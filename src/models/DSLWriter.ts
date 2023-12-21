import {
	OpenApiSpec,
	Parameter,
	PathItem,
	RequestBody,
} from '../types/OpenApiSpec';
import { writeFile } from 'fs';
import {
	FormattedParam,
	FormattedParams,
	TranslatedService,
} from './TranslatedService';
import { Schema } from '../types/Schema';

interface DSLPath {
	method: string;
	description: string;
	request?: {
		entities: Array<{
			name: string;
			structure: Record<string, string>;
			privacy: string;
		}>;
		parameters: Array<{ name: string; type: string }>;
	};
	response?: {
		entities: Array<{
			name: string;
			structure: Record<string, string>;
			privacy: string;
		}>;
		parameters: Array<{ name: string; type: string }>;
	};
}

export class OpenAPIToDSLConverter {
	private dsl: string;
	private openApiSpec: OpenApiSpec;

	constructor() {
		this.dsl = '';
	}

	convertTranslatedService(translatedService: TranslatedService) {
		this.dsl += `service '${translatedService.title}'{\n`;

		translatedService.paths.forEach((methods, path) => {
			this.dsl += `    path "${path}"{\n`;

			methods.forEach((params, method) => {
				this.dsl += `        method "${method}"{\n`;

				const parametersDSL = this.convertFormattedParams(params);
				this.dsl += `            parameters{\n${parametersDSL}            }\n`;

				this.dsl += '        }\n';
			});

			this.dsl += '    }\n';
		});

		this.dsl += '}\n';
	}

	private convertFormattedParams(params: FormattedParams): string {
		let paramsDSL = '';

		params.forEach((param, paramName) => {
			paramsDSL += `                '${paramName}' : ${this.convertFormattedParam(
				param
			)}\n`;
		});

		return paramsDSL;
	}

	private convertFormattedParam(param: FormattedParam): string {
		if (param.type !== 'object' && param.type !== 'array') {
			return param.type;
		}

		if (!param.schema && param.type === 'object') {
			return param.type;
		}

		let paramDSL = `{`;

		if (param.schema) {
			paramDSL += `\n${this.convertSchema(param.schema)}`;
		}

		paramDSL += `}`;
		if (param.type === 'array') {
			paramDSL += '[]';
		}
		return paramDSL;
	}

	private convertSchema(schema: Schema): string {
		if (schema.type === 'object' && schema.properties) {
			// For object types with properties
			const propertiesDSL = Object.entries(schema.properties)
				.map(([propertyName, property]) => {
					const sensitiveTag = " 'SENSITIVE'";
					return `                    '${propertyName}' : ${property.type}${sensitiveTag}`;
				})
				.join('\n');

			return `${propertiesDSL}\n                `;
		} else {
			// For primitive types or other cases
			return `                ${schema.type}`;
		}
	}

	convert(openApiSpec: OpenApiSpec): string {
		this.dsl += `service "${openApiSpec.info.title}" {\n`;
		this.openApiSpec = openApiSpec;

		for (const path in openApiSpec.paths) {
			this.convertPath(path, openApiSpec.paths[path]);
		}

		this.dsl += '}\n';
		return this.dsl;
	}

	private convertPath(path: string, pathItem: PathItem) {
		this.dsl += `  path "${path}" {\n`;

		for (const httpMethod in pathItem) {
			const operation = pathItem[httpMethod];
			this.convertOperation(httpMethod, operation);
		}

		this.dsl += '  }\n';
	}

	private convertOperation(
		httpMethod: string,
		operation: {
			tags?: string[];
			summary?: string;
			operationId?: string;
			parameters?: Parameter[];
			requestBody?: RequestBody;
			responses?: Record<string, Response>;
		}
	) {
		this.dsl += `    method "${httpMethod}" : "${operation.summary}"\n`;
		this.convertMethodParameters(operation.parameters);
		this.convertRequest(operation);
		this.convertResponse(operation);
	}

	private convertMethodParameters(parameters: Parameter[]) {
		parameters?.forEach((param) => {
			this.dsl += `      parameter "${param.name}"`;
			if (param.schema) {
				const schemaUrl = param.schema['$ref'];
				if (schemaUrl) {
					const schemaName = schemaUrl.split('/').pop();
					const schema = this.openApiSpec.components.schemas[schemaName];
					this.convertStructure(schema);
				} else {
					this.dsl += `: ${JSON.stringify(param.schema, null, 4)}\n`;
				}
			} else {
				this.dsl += '\n';
			}
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private convertRequest(operation: any) {
		if (!operation.requestBody || !operation.requestBody.content) {
			return null;
		}

		const content = operation.requestBody.content;
		const requestEntities: Array<{
			name: string;
			structure: Record<string, string>;
			privacy: string;
		}> = [];
		const requestParameters: Array<{ name: string; type: string }> = [];
		this.dsl += '    request {\n';

		for (const contentType in content) {
			const schema = content[contentType].schema;
			if (schema) {
				const schemaUrl = schema['$ref'];
				if (schemaUrl) {
					const schemaName = schemaUrl.split('/').pop();
					const schema = this.openApiSpec.components.schemas[schemaName];
					this.dsl += `\n${JSON.stringify(schema, null, 4)}\n `;
				} else {
					this.dsl += `${schema}\n`;
				}
			}
		}

		this.dsl += '    }\n';
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private convertResponse(operation: any) {
		if (!operation.responses) {
			return null;
		}

		const responses = operation.responses;
		const responseEntities: Array<{
			name: string;
			structure: Record<string, string>;
			privacy: string;
		}> = [];
		const responseParameters: Array<{ name: string; type: string }> = [];

		this.dsl += '    response {\n';

		for (const statusCode in responses) {
			const response = responses[statusCode];
			if (response.content) {
				for (const contentType in response.content) {
					const schema = response.content[contentType].schema;
					if (schema) {
						const schemaUrl = schema['$ref'];
						if (schemaUrl) {
							const schemaName = schemaUrl.split('/').pop();
							const schema = this.openApiSpec.components.schemas[schemaName];
							this.dsl += `\n${JSON.stringify(schema, null, 4)}\n `;
						} else {
							this.dsl += `${
								typeof schema === 'object'
									? JSON.stringify(schema, null, 4)
									: schema
							}\n`;
						}
					}
				}
			}
		}

		this.dsl += '    }\n';
	}

	private convertEntities(
		entities: Array<{
			name: string;
			structure: Record<string, string>;
			privacy: string;
		}>
	) {
		for (const entity of entities) {
			this.dsl += `      entity "${entity.name}" {\n`;
			this.convertStructure(entity.structure);
			this.dsl += `        privacy "${entity.privacy}"\n`;
			this.dsl += '      }\n';
		}
	}
	private convertStructure(structure: Record<string, string | unknown>) {
		const obj = { structure };

		this.dsl += `${JSON.stringify(structure, null, 6)}\n`;
		// for (const field in structure) {
		// 	const type = typeof structure[field];
		// 	//NEED TO CHECK FOR PROPERTIES FOR EXAMPLE IN PARAMTERS SCHEMA. THE PROPERTIES ARE NOT IN THE ROOT OF THE SCHEMA eg. {properties: {id: {…}}, type:'object' }
		// 	this.dsl += `          ${field}: ${
		// 		typeof structure[field] === 'object'
		// 			? this.convertStructure(
		// 					structure[field] as Record<string, string | unknown>
		// 			  )
		// 			: structure[field]
		// 	}\n`;
		// }
		this.dsl += '        \n';
	}

	private convertParameters(parameters: Array<{ name: string; type: string }>) {
		for (const param of parameters) {
			this.dsl += `      parameter "${param.name}": ${param.type}\n`;
		}
	}

	writeToFile(filePath: string) {
		writeFile(filePath, this.dsl, {}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}
}
