const accessTokenKey = 'chatapp_access_token';
const refreshTokenKey = 'chatapp_refresh_token';
const tokenStoragePreference = (import.meta.env.VITE_TOKEN_STORAGE ?? 'session').toLowerCase();

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

function resolvePrimaryStorage(): Storage {
  return tokenStoragePreference === 'local' ? localStorage : sessionStorage;
}

function resolveFallbackStorage(primary: Storage): Storage {
  return primary === localStorage ? sessionStorage : localStorage;
}

function readTokens(storage: Storage): TokenPair | null {
  try {
    const accessToken = storage.getItem(accessTokenKey);
    const refreshToken = storage.getItem(refreshTokenKey);

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

function writeTokens(storage: Storage, tokens: TokenPair): void {
  try {
    storage.setItem(accessTokenKey, tokens.accessToken);
    storage.setItem(refreshTokenKey, tokens.refreshToken);
  } catch {
    // Ignore quota/privacy-mode storage failures.
  }
}

function removeTokens(storage: Storage): void {
  try {
    storage.removeItem(accessTokenKey);
    storage.removeItem(refreshTokenKey);
  } catch {
    // Ignore quota/privacy-mode storage failures.
  }
}

export function getStoredTokens(): TokenPair | null {
  const primaryStorage = resolvePrimaryStorage();
  const fallbackStorage = resolveFallbackStorage(primaryStorage);

  const primaryTokens = readTokens(primaryStorage);
  if (primaryTokens) {
    return primaryTokens;
  }

  const fallbackTokens = readTokens(fallbackStorage);
  if (!fallbackTokens) {
    return null;
  }

  writeTokens(primaryStorage, fallbackTokens);
  removeTokens(fallbackStorage);
  return fallbackTokens;
}

export function persistTokens(tokens: TokenPair): void {
  const primaryStorage = resolvePrimaryStorage();
  const fallbackStorage = resolveFallbackStorage(primaryStorage);

  writeTokens(primaryStorage, tokens);
  removeTokens(fallbackStorage);
}

export function clearStoredTokens(): void {
  removeTokens(localStorage);
  removeTokens(sessionStorage);
}
