import { Response } from 'express';
import { injectable } from 'tsyringe';
import HttpService from './httpService';
import 'reflect-metadata';
import { OpenApiSpec } from '../types/OpenApiSpec';
// import { MarkdownWriter } from '../models/MarkdownWriter';
import { join } from 'path';
import { OpenAPIToDSLConverter } from '../models/DSLWriter';
import { TranslatedService } from '../models/TranslatedService';
@injectable()
export class SpecificationService {
	constructor() {}

	async generateSpecification(res: Response, urls: string[]) {
		// const markdownWriter = new MarkdownWriter(
		// 	join(__dirname, '../specification.md')
		// );
		const dslWriter = new OpenAPIToDSLConverter();
		for (const url of urls) {
			const response: OpenApiSpec = await HttpService.get(url);
			const translatedService = new TranslatedService(response);

			dslWriter.convertTranslatedService(translatedService);

			// dslWriter.convert(response);

			// dslWriter.writeToFile(join(__dirname, '../specification.txt'));

			// markdownWriter.addSection(response);
			// const title = response.info.title;
			// console.log({ title });
			// const paths = Object.keys(response.paths);
			// if (!paths) {
			// 	console.log('No paths found');
			// }
			// paths.forEach((path) => {
			// 	console.log({ path });
			// 	const methods = Object.keys(response.paths[path]);
			// 	methods.forEach((method) => {
			// 		console.log({ method });
			// 		const methodParams = response.paths[path][method].parameters;
			// 		methodParams?.forEach((param) => {
			// 			if (param.schema) {
			// 				const schemaUrl = param.schema['$ref'];
			// 				if (schemaUrl) {
			// 					const schemaName = schemaUrl.split('/').pop();
			// 					const schema = response.components.schemas[schemaName];
			// 					console.log('paramSchema:', { name: param.name, schema });
			// 				} else {
			// 					console.log('paramSchema:', { name: param.name, ...param.schema });
			// 				}
			// 			}
			// 		});
			// 		const requestBody = response.paths[path][method].requestBody;
			// 		if (requestBody) {
			// 			const requestBodySchema = requestBody.content['application/json'].schema;
			// 			if (requestBodySchema) {
			// 				const schemaUrl = requestBodySchema['$ref'];
			// 				if (schemaUrl) {
			// 					const schemaName = schemaUrl.split('/').pop();
			// 					const schema = response.components.schemas[schemaName];
			// 					console.log('requestBodySchema:', schema);
			// 				} else {
			// 					console.log('requestBodySchema:', requestBodySchema);
			// 				}
			// 			}
			// 		}
			// 		const responses = response.paths[path][method].responses;
			// 		if (responses) {
			// 			const responseCodes = Object.keys(responses);
			// 			responseCodes.forEach((code) => {
			// 				const methodResponse = responses[code];
			// 				const responseContent = methodResponse['content'];
			// 				let responseSchema;
			// 				if (responseContent) {
			// 					//TODO: research about the response content type in OpenAPI specificiatin
			// 					if ('application/json' in responseContent) {
			// 						responseSchema = responseContent['application/json'].schema;
			// 					} else if ('*/*' in responseContent) {
			// 						responseSchema = responseContent['*/*'].schema;
			// 					}
			// 				}
			// 				if (responseSchema) {
			// 					const schemaUrl = responseSchema['$ref'];
			// 					if (schemaUrl) {
			// 						const schemaName = schemaUrl.split('/').pop();
			// 						const schema = response.components.schemas[schemaName];
			// 						console.log('responseSchema:', schema);
			// 					} else {
			// 						console.log('responseSchema:', responseSchema);
			// 					}
			// 				}
			// 			});
			// 		}

			// 		console.log('END METHOD-----------------------------------');
			// });
			// });
			console.log('END SERVICE-----------------------------------');
		}
		dslWriter.writeToFile(join(__dirname, '../specification.txt'));
		// markdownWriter.write();
		return res.send('Specification generated');
	}
}
