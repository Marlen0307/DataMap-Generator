import { OpenApiSpec } from '../types/OpenApiSpec';
import { writeFile } from 'fs';
import {
	FormattedParam,
	FormattedParams,
	FormattedService,
} from './FormattedService';
import { Schema } from '../types/Schema';

export class OpenAPIToDSLConverter {
	private dsl: string;
	private openApiSpec: OpenApiSpec;
	formattedService: FormattedService;

	constructor() {
		this.dsl = '';
	}

	convertFormattedService(translatedService: FormattedService) {
		this.formattedService = translatedService;
		this.dsl += `service '${translatedService.title}'{\n`;

		translatedService.paths.forEach((methods, path) => {
			this.dsl += `    path "${path}"{\n`;

			methods.forEach((params, method) => {
				const methodSummery = params.entries().next().value[1].methodSummery;
				this.dsl += `        method "${method}" | ${methodSummery} {\n`;

				const parametersDSL = this.convertFormattedParams(params);
				this.dsl += `            parameters{\n${parametersDSL}            }\n`;

				this.dsl += `        }\n`;
			});

			this.dsl += '    }\n';
		});

		this.dsl += '}\n';
	}

	private convertFormattedParams(params: FormattedParams): string {
		let paramsDSL = '';

		params.forEach((param, paramName) => {
			paramsDSL += `				'${paramName}' ${
				param.description ? `| ${param.description}` : ''
			} : ${this.convertFormattedParam(param)}\n`;
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
		let paramDSL = '';
		if (param.schema) {
			paramDSL += `${this.convertSchema(param.schema)}`;
		}

		if (param.type === 'array') {
			paramDSL += '[]';
		}
		return `${paramDSL}  `;
	}

	private convertSchema(schema: Schema, indent = 5): string {
		let paramDSL = `{\n`;
		const indentString = '	'.repeat(indent);
		if (schema.type === 'object' && schema.properties) {
			// For object types with properties
			const propertiesDSL = Object.entries(schema.properties)
				.map(([propertyName, property]) => {
					return `${indentString}'${propertyName}' : ${this.convertProperty(
						property,
						indent + 1
					)}`;
				})
				.join('\n');

			paramDSL += `${propertiesDSL}\n`;
			paramDSL += `${indentString}}`;
			return paramDSL;
		} else {
			// For primitive types or other cases
			return `                ${schema.type}`;
		}
	}

	private convertProperty(
		property: {
			type: string;
			format?: string;
			items?: object;
		},
		indent: number
	) {
		if (property.type === 'array') {
			if (property.items['$ref']) {
				return `${this.convertSchema(
					this.formattedService.schemas.get(property.items['$ref']),
					indent
				)}[]`;
			}
		}

		return `${property.type}`;
	}

	writeToFile(filePath: string) {
		writeFile(filePath, this.dsl, {}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}
}
