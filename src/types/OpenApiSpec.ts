import { Schema } from './Schema';

export interface OpenApiSpec {
	openapi: string;
	info: {
		title: string;
		description: string;
		version: string;
	};
	servers?: Server[];
	paths: Paths;
	components?: Components;
}
interface Server {
	url: string;
	description?: string;
}

export interface Paths {
	[path: string]: PathItem;
}
export interface PathItem {
	[httpMethod: string]: {
		tags?: string[];
		summary?: string;
		operationId?: string;
		parameters?: Parameter[];
		requestBody?: RequestBody;
		responses?: Record<string, Response>;
	};
}
export interface Parameter {
	name: string;
	in: string;
	description?: string;
	required?: boolean;
	schema?: Record<string, string>;
}
export interface RequestBody {
	content: Record<string, { schema: Record<string, string> }>;
	required?: boolean;
}
interface Components {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	schemas?: Schema[];
}
