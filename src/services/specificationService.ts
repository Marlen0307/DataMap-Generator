import { Response } from 'express';
import { injectable } from 'tsyringe';
import HttpService from './httpService';
import fs from 'node:fs';
import 'reflect-metadata';
import { OpenApiSpec } from '../types/OpenApiSpec';
import { join } from 'path';
import { OpenAPIToDSLConverter } from '../models/DSLWriter';
import { FormattedService } from '../models/FormattedService';
@injectable()
export class SpecificationService {
	_specificationFolder = join(__dirname, '../../specifications');
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

		try {
			if (!fs.existsSync(this._specificationFolder)) {
				fs.mkdirSync(this._specificationFolder);
			}
			const newFileName = fileName || dslWriter.getAlternativeFileName();
			const filePath = `${this._specificationFolder}/${newFileName}.dmap`;
			dslWriter.writeToFile(filePath);
			return res.status(200).send('Specification generated');
		} catch (e) {
			return res.status(500).send('Error generating specification');
		}
	}
}
