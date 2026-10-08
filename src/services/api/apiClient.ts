/**
 * PCBInspect AI - Unified API Client
 * Supports seamless switching between Local Mock Layer and Real Python/FastAPI Backend.
 */

export const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API !== 'false';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000/ws';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pcb_auth_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}]: ${errorText || response.statusText}`);
  }

  return response.json();
}
