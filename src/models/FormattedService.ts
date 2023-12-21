import { constructor } from 'tsyringe/dist/typings/types';
import { OpenApiSpec } from '../types/OpenApiSpec';
import { Schema } from '../types/Schema';

export type ParamterPlace = 'requestBody' | 'path' | 'responseBody' | 'query';

export interface FormattedParam {
	usedIn: ParamterPlace;
	type: string;
	format?: string;
	description?: string;
	schema?: Schema;
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
	fillParameters() {
		const paths = Object.keys(this.spec.paths);
		const pathsMap: Map<string, FormatedMethods> = new Map();
		paths.forEach((path) => {
			const methods = Object.keys(this.spec.paths[path]);
			const methodsMap: FormatedMethods = new Map();
			methods.forEach((method) => {
				const formattedParams: FormattedParams = new Map();
				const addParamter = (
					name: string,
					usedIn: ParamterPlace,
					type: string,
					schema: Schema,
					format?: string
				) => {
					formattedParams.set(name, {
						usedIn,
						type,
						format,
						schema,
					});
				};
				const methodParams = this.spec.paths[path][method].parameters;
				methodParams?.forEach((param) => {
					if (param.schema) {
						const schemaUrl = param.schema['$ref'];
						if (schemaUrl) {
							// param is an object and holds a reference to a schema
							const schema = this.schemas.get(schemaUrl);
							addParamter(
								param.name,
								param.in as ParamterPlace, // in this case can only be 'path' or 'query'
								'object', // in this case can only be 'object' since it is refering to a schema
								schema
							);
						} else {
							//param is a primitive
							addParamter(
								param.name,
								param.in as ParamterPlace, // in this case can only be 'path' or 'query'
								param.schema.type,
								undefined, // no schema since it is a primitive
								param.schema.format
							);
						}
					}
				});
				const requestBody = this.spec.paths[path][method].requestBody;
				if (requestBody) {
					const requestBodySchema =
						requestBody.content['application/json'].schema; //TODO: handle other content types
					if (requestBodySchema) {
						const schemaUrl = requestBodySchema['$ref'];
						if (schemaUrl) {
							const schemaName = schemaUrl.split('/').pop();
							const schema = this.schemas.get(schemaUrl);
							addParamter(schemaName, 'requestBody', 'object', schema);
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
								addParamter(schemaName, 'responseBody', 'object', schema);
							} else if (responseSchema.type === 'array') {
								schemaUrl = responseSchema.items['$ref'];
								const schemaName = schemaUrl.split('/').pop();
								const schema = this.schemas.get(schemaUrl);
								addParamter(schemaName, 'responseBody', 'array', schema);
							} else {
								addParamter(
									`${operationId}_response_${code}`,
									'responseBody',
									responseSchema.type,
									undefined,
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
			const schema = this.spec.components?.schemas?.[schemaName];
			if (schema) {
				this.schemas.set(this.buildSchemaPath(schemaName), schema);
			}
		});
	}

	private buildSchemaPath(schemaName: string): string {
		return `#/components/schemas/${schemaName}`;
	}
}
