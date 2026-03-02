function parseOptionalBoolean(value: string | undefined): boolean | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }

  return null;
}

const explicitQaFlag = parseOptionalBoolean(import.meta.env.VITE_ENABLE_QA_CONSOLE);

export const isQaEnabled = (explicitQaFlag ?? import.meta.env.DEV) || import.meta.env.MODE === 'test';
