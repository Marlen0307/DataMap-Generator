import axios, { AxiosRequestConfig } from 'axios';
import 'reflect-metadata';

class HttpService {
	public static async get<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<T> {
		const response = await axios.get<T>(url, config);
		return response.data;
	}

	public static async post<T>(
		url: string,
		data?: object,
		config?: AxiosRequestConfig
	): Promise<T> {
		const response = await axios.post<T>(url, data, config);
		return response.data;
	}

	public static async put<T>(
		url: string,
		data?: object,
		config?: AxiosRequestConfig
	): Promise<T> {
		const response = await axios.put<T>(url, data, config);
		return response.data;
	}

	public static async delete<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<T> {
		const response = await axios.delete<T>(url, config);
		return response.data;
	}
}

export default HttpService;
