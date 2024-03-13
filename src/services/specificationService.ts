import { Response } from 'express';
import { injectable } from 'tsyringe';
import HttpService from './httpService';
import 'reflect-metadata';
import { OpenApiSpec } from '../types/OpenApiSpec';
// import { MarkdownWriter } from '../models/MarkdownWriter';
import { join } from 'path';
import { OpenAPIToDSLConverter } from '../models/DSLWriter';
import { FormattedService } from '../models/FormattedService';
@injectable()
export class SpecificationService {
	constructor() {}

	async generateSpecification(
		res: Response,
		urls: string[],
		fileName?: string
	) {
		const dslWriter = new OpenAPIToDSLConverter();
		for (const url of urls) {
			const response: OpenApiSpec = await HttpService.get(url);
			const formattedService = new FormattedService(response);

			dslWriter.convertFormattedService(formattedService);
		}

		const newFileName = fileName || dslWriter.getAlternativeFileName();
		dslWriter.writeToFile(
			join(__dirname, `../../specifications/${newFileName}.dmap`)
		);
		return res.status(200).send('Specification generated');
	}
}
