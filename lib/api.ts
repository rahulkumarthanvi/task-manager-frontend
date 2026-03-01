import axios from 'axios';
import { showToast } from './toast';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => {
    const payload = response.data as Partial<ApiResponse<unknown>> | undefined;
    if (payload && typeof payload === 'object' && 'success' in payload) {
      const message =
        typeof payload.message === 'string' ? payload.message.trim() : '';
      if (message) {
        showToast(payload.success ? 'success' : 'error', message);
      }
    }
    return response;
  },
  (error) => {
    const payload = error?.response?.data as
      | Partial<ApiResponse<unknown>>
      | undefined;
    const message =
      (typeof payload?.message === 'string' && payload.message.trim()) ||
      (typeof payload?.error === 'string' && payload.error.trim()) ||
      (typeof error?.message === 'string' && error.message.trim()) ||
      '';

    if (message) {
      showToast('error', message);
    }

    return Promise.reject(error);
  },
);
