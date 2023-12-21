export interface Schema {
	required: string[];
	type: string;
	properties: Record<
		string,
		{
			type: string;
			format?: string;
		}
	>;
	description?: string;
}
