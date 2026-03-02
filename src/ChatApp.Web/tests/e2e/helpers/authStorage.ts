import type { Page } from '@playwright/test';

const accessTokenKey = 'chatapp_access_token';
const refreshTokenKey = 'chatapp_refresh_token';

type SeedAuthTokensInput = {
  accessToken: string;
  refreshToken: string;
};

export async function seedAuthTokens(page: Page, tokens: SeedAuthTokensInput): Promise<void> {
  await page.addInitScript((input) => {
    sessionStorage.setItem('chatapp_access_token', input.accessToken);
    sessionStorage.setItem('chatapp_refresh_token', input.refreshToken);
    localStorage.setItem('chatapp_access_token', input.accessToken);
    localStorage.setItem('chatapp_refresh_token', input.refreshToken);
  }, tokens);
}

export async function readAccessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => sessionStorage.getItem('chatapp_access_token') ?? localStorage.getItem('chatapp_access_token'));
}

export async function clearAuthTokens(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.removeItem('chatapp_access_token');
    sessionStorage.removeItem('chatapp_refresh_token');
    localStorage.removeItem('chatapp_access_token');
    localStorage.removeItem('chatapp_refresh_token');
  });
}

export const tokenKeys = {
  accessTokenKey,
  refreshTokenKey,
};
