import { OpenApiSpec } from '../types/OpenApiSpec';

export class Service {
	private openApiSpec: OpenApiSpec;
	constructor(openApiSpec: OpenApiSpec) {
		this.openApiSpec = openApiSpec;
	}
}
