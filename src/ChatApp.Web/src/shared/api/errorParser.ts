import { AxiosError } from 'axios';

type ValidationProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

function joinValidationErrors(errors: Record<string, string[]> | undefined): string | null {
  if (!errors) {
    return null;
  }

  const messages = Object.entries(errors)
    .flatMap(([field, fieldErrors]) => fieldErrors.map((message) => `${field}: ${message}`))
    .filter((message) => message.trim().length > 0);

  if (messages.length === 0) {
    return null;
  }

  return messages.join(' | ');
}

export function parseApiError(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof AxiosError)) {
    return error instanceof Error ? error.message : fallbackMessage;
  }

  const payload = error.response?.data;
  if (!payload) {
    return error.message || fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (typeof payload !== 'object') {
    return error.message || fallbackMessage;
  }

  const data = payload as { error?: string } & ValidationProblemDetails;
  if (typeof data.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  const validationMessage = joinValidationErrors(data.errors);
  if (validationMessage) {
    return validationMessage;
  }

  if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
    return data.detail;
  }

  if (typeof data.title === 'string' && data.title.trim().length > 0) {
    return data.title;
  }

  return error.message || fallbackMessage;
}
