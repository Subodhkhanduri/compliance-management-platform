import { HttpApiAdapter } from '../../adapters/infrastructure/HttpApiAdapter';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// Singleton — one adapter instance for the whole app
export const apiClient = new HttpApiAdapter(BASE_URL);
