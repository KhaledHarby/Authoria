import axios from 'axios';
import { store } from '../app/store';

const http = axios.create({ baseURL: (import.meta as any).env.VITE_API_BASE || 'http://localhost:5000' });

http.interceptors.request.use((config) => {
	const state: any = store.getState();
	const token = state?.auth?.accessToken;
	const tenantId = state?.auth?.tenantId;
	config.headers = config.headers || {};
	if (token) (config.headers as any)['Authorization'] = `Bearer ${token}`;
	if (tenantId) (config.headers as any)['X-Authoria-Tenant'] = tenantId as any;
	return config;
});

export default http;


