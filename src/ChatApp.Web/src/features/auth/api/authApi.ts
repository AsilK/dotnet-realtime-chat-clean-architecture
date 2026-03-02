import { apiClient } from '../../../shared/api/client';
import type { ApiResult, ApiResultWithoutValue, AuthResponseDto, UserDto } from '../../../shared/api/contracts';

export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
  displayName: string;
};

export async function login(request: LoginRequest): Promise<AuthResponseDto> {
  const response = await apiClient.post<ApiResult<AuthResponseDto>>('/api/auth/login', request);
  if (!response.data.isSuccess || !response.data.value) {
    throw new Error(response.data.error ?? 'Login failed.');
  }

  return response.data.value;
}

export async function register(request: RegisterRequest): Promise<AuthResponseDto> {
  const response = await apiClient.post<ApiResult<AuthResponseDto>>('/api/auth/register', request);
  if (!response.data.isSuccess || !response.data.value) {
    throw new Error(response.data.error ?? 'Register failed.');
  }

  return response.data.value;
}

export async function refresh(refreshToken: string): Promise<AuthResponseDto> {
  const response = await apiClient.post<ApiResult<AuthResponseDto>>('/api/auth/refresh', { refreshToken });
  if (!response.data.isSuccess || !response.data.value) {
    throw new Error(response.data.error ?? 'Refresh failed.');
  }

  return response.data.value;
}

export async function logout(refreshToken: string): Promise<void> {
  const response = await apiClient.post<ApiResultWithoutValue>('/api/auth/logout', { refreshToken });
  if (!response.data.isSuccess) {
    throw new Error(response.data.error ?? 'Logout failed.');
  }
}

export async function getCurrentUser(): Promise<UserDto> {
  const response = await apiClient.get<ApiResult<UserDto>>('/api/auth/me');
  if (!response.data.isSuccess || !response.data.value) {
    throw new Error(response.data.error ?? 'Current user not found.');
  }

  return response.data.value;
}
