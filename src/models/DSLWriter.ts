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

	constructor() {
		this.dsl = '';
	}

	convertFormattedService(translatedService: FormattedService) {
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

	writeToFile(filePath: string) {
		writeFile(filePath, this.dsl, {}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}
}
