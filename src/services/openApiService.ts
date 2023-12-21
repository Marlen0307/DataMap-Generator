import HttpService from './httpService';
import Http from './httpService';

export class OpenApiService {
	private openApiSpecUrl: string;
	private httpService: Http;
	constructor(openApiSpecUrl: string) {
		this.openApiSpecUrl = openApiSpecUrl;
	}

	async getOpenApiSpec() {
		return HttpService.get(this.openApiSpecUrl);
	}
}
