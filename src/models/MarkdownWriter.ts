import { OpenApiSpec } from '../types/OpenApiSpec';
import { writeFile } from 'fs';
export class MarkdownWriter {
	private filePath: string;
	markdownContent: string = '';
	constructor(filePath: string) {
		this.filePath = filePath;
	}

	addTitle(title: string) {
		this.markdownContent += `# ${title}\n`;
	}

	getContent() {
		return this.markdownContent;
	}

	addFormattedCode(code: string, programmingLanguge: string) {
		this.markdownContent += '\n```' + programmingLanguge + '\n';
		this.markdownContent += code + '\n';
		this.markdownContent += '```\n';
		console.log(this.markdownContent);
	}

	async addSection(response: OpenApiSpec) {
		this.markdownContent += `## ${response.info.title}\n`;
		const paths = Object.keys(response.paths);
		if (!paths) {
			console.log('No paths found');
		}
		paths.forEach((path) => {
			const methods = Object.keys(response.paths[path]);
			methods.forEach((method) => {
				this.markdownContent += `* ${path} ${method}\n`;
				const methodParams = response.paths[path][method].parameters;
				if (methodParams?.length > 0) {
					this.markdownContent += '     * Parameters\n';
				}
				methodParams?.forEach((param) => {
					if (param.schema) {
						const schemaUrl = param.schema['$ref'];
						if (schemaUrl) {
							const schemaName = schemaUrl.split('/').pop();
							const schema = response.components.schemas[schemaName];
							this.markdownContent += `          * ${param.name} `;
							this.addFormattedCode(JSON.stringify(schema, null, 4), 'json');
						} else {
							this.markdownContent += `          * ${param.name} `;
							this.addFormattedCode(
								JSON.stringify(param.schema, null, 4),
								'json'
							);
						}
					}
				});
				const requestBody = response.paths[path][method].requestBody;
				if (requestBody) {
					this.markdownContent += '     * Request Body\n';
					const requestBodySchema =
						requestBody.content['application/json'].schema;
					if (requestBodySchema) {
						const schemaUrl = requestBodySchema['$ref'];
						if (schemaUrl) {
							const schemaName = schemaUrl.split('/').pop();
							const schema = response.components.schemas[schemaName];
							this.addFormattedCode(JSON.stringify(schema, null, 4), 'json');
						} else {
							this.markdownContent += `          * ${requestBodySchema}\n`;
						}
					}
				}
				const responses = response.paths[path][method].responses;
				if (responses) {
					this.markdownContent += '     * Responses\n';
					const responseCodes = Object.keys(responses);
					responseCodes.forEach((code) => {
						this.markdownContent += `          * ${code}\n`;
						const methodResponse = responses[code];
						const responseContent = methodResponse['content'];
						let responseSchema;
						if (responseContent) {
							//TODO: research about the response content type in OpenAPI specificiatin
							if ('application/json' in responseContent) {
								responseSchema = responseContent['application/json'].schema;
							} else if ('*/*' in responseContent) {
								responseSchema = responseContent['*/*'].schema;
							}
						}
						if (responseSchema) {
							const schemaUrl = responseSchema['$ref'];
							if (schemaUrl) {
								const schemaName = schemaUrl.split('/').pop();
								const schema = response.components.schemas[schemaName];
								this.addFormattedCode(JSON.stringify(schema, null, 4), 'json');
							} else {
								this.addFormattedCode(
									JSON.stringify(responseSchema, null, 4),
									'json'
								);
							}
						}
					});
				}
			});
		});
	}

	write() {
		writeFile(this.filePath, this.markdownContent, {}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}
}
