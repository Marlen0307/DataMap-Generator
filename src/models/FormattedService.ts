import { constructor } from 'tsyringe/dist/typings/types';
import { OpenApiSpec } from '../types/OpenApiSpec';
import { Schema } from '../types/Schema';

export type ParameterPlace = 'requestBody' | 'path' | 'responseBody' | 'query';

const typeOfApplicationContents = new Set([
	'application/json',
	'application/xml',
	'application/x-www-form-urlencoded',
	'application/octet-stream',
]);

export interface FormattedParam {
	usedIn: ParameterPlace;
	type: string;
	format?: string;
	description?: string;
	schema?: Schema;
	methodSummery?: string;
}

export type FormattedParams = Map<string, FormattedParam>;

export type FormatedMethods = Map<string, FormattedParams>;

export class FormattedService {
	private spec: OpenApiSpec;
	schemas: Map<string, Schema> = new Map();
	title: string;
	parameters: Map<string, FormattedParam> = new Map();
	paths: Map<string, FormatedMethods> = new Map();
	constructor(spec: OpenApiSpec) {
		this.spec = spec;
		this.title = spec.info.title;
		this.fillSchemas();
		this.fillParameters();
	}

	private getApplicationContentType(content: Record<string, unknown>): object {
		let contentType = 'application/json'; // default content type
		Array.from(Object.keys(content)).forEach((key) => {
			if (typeOfApplicationContents.has(key)) {
				contentType = key;
				return;
			}
		});
		return content[contentType] as object;
	}
	private fillParameters() {
		const paths = Object.keys(this.spec.paths);
		paths?.forEach((path) => {
			const methods = Object.keys(this.spec.paths[path]);
			const methodsMap: FormatedMethods = new Map();
			methods?.forEach((method) => {
				const formattedParams: FormattedParams = new Map();
				const addParameter = (
					name: string,
					usedIn: ParameterPlace,
					type: string,
					schema: Schema,
					description?: string,
					format?: string
				) => {
					formattedParams.set(name, {
						usedIn,
						type,
						format,
						description,
						schema,
						methodSummery: this.spec.paths[path][method].summary,
					});
				};
				const methodParams = this.spec.paths[path][method].parameters;
				methodParams?.forEach((param) => {
					if (param.schema) {
						const schemaUrl = param.schema['$ref'];
						if (schemaUrl) {
							// param is an object and holds a reference to a schema
							const schema = this.schemas.get(schemaUrl);
							addParameter(
								param.name,
								param.in as ParameterPlace, // in this case can only be 'path' or 'query'
								'object', // in this case can only be 'object' since it is refering to a schema
								schema,
								param?.description
							);
						} else {
							//param is a primitive
							addParameter(
								param.name,
								param.in as ParameterPlace, // in this case can only be 'path' or 'query'
								param.schema.type,
								undefined, // no schema since it is a primitive
								param?.description,
								param.schema.format
							);
						}
					}
				});
				const requestBody = this.spec.paths[path][method].requestBody;
				if (requestBody) {
					let requestApplicationContent = this.getApplicationContentType(
						requestBody.content
					);
					let requestBodySchema = requestApplicationContent['schema'];

					if (requestBodySchema) {
						const schemaUrl = requestBodySchema['$ref'];
						if (schemaUrl) {
							const schemaName = schemaUrl.split('/').pop();
							const schema = this.schemas.get(schemaUrl);
							addParameter(
								schemaName,
								'requestBody',
								'object',
								schema,
								schema.description
							);
						}
					}
				}
				const responses = this.spec.paths[path][method].responses;
				const operationId = this.spec.paths[path][method].operationId;
				if (responses) {
					const responseCodes = Object.keys(responses);
					responseCodes.forEach((code) => {
						const response = responses[code];
						const responseContent = response['content'];
						let responseSchema;

						if (responseContent) {
							for (const contentType in responseContent) {
								responseSchema = responseContent[contentType].schema;
							}
						}

						if (responseSchema) {
							let schemaUrl = responseSchema['$ref'];
							if (schemaUrl) {
								const schemaName = schemaUrl.split('/').pop();
								const schema = this.schemas.get(schemaUrl);
								addParameter(
									schemaName,
									'responseBody',
									'object',
									schema,
									schema.description
								);
							} else if (responseSchema.type === 'array') {
								schemaUrl = responseSchema.items['$ref'];
								const schemaName = schemaUrl.split('/').pop();
								const schema = this.schemas.get(schemaUrl);
								addParameter(
									schemaName,
									'responseBody',
									'array',
									schema,
									schema.description
								);
							} else {
								addParameter(
									`${operationId}_response_${code}`,
									'responseBody',
									responseSchema.type,
									undefined,
									'',
									responseSchema.format
								);
							}
						}
					});
				}
				this.parameters = new Map([...this.parameters, ...formattedParams]);
				methodsMap.set(method, formattedParams);
				this.paths.set(path, methodsMap);
			});
		});
	}

	private fillSchemas(): void {
		if (!this.spec.components?.schemas) {
			return;
		}
		const schemaNames = Object.keys(this.spec.components.schemas);
		schemaNames.forEach((schemaName) => {
			const schema = this.spec.components.schemas[schemaName];
			if (schema) {
				this.schemas.set(this.buildSchemaPath(schemaName), schema);
			}
		});
	}

	private buildSchemaPath(schemaName: string): string {
		return `#/components/schemas/${schemaName}`;
	}
}
