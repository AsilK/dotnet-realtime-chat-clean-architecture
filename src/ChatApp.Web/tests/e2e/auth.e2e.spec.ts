import { expect, test } from '@playwright/test';
import { registerUser } from './helpers/apiClient';
import { readAccessToken, seedAuthTokens } from './helpers/authStorage';

test.describe('Auth flows', () => {
  test('register + login + logout', async ({ page }) => {
    const seed = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const email = `ui-reg-${seed}@example.com`;
    const username = `ui-reg-${seed}`;
    const displayName = `UI User ${seed}`;
    const password = 'Test1234!';

    await page.goto('/register');

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Display Name').fill(displayName);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm Password').fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(`@${username}`)).toBeVisible();

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.getByLabel('Email or Username').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(`@${username}`)).toBeVisible();
  });

  test('401 access token -> refresh -> continue', async ({ page }) => {
    const user = await registerUser('refresh-flow');
    await seedAuthTokens(page, {
      accessToken: 'invalid-access-token',
      refreshToken: user.auth.refreshToken,
    });

    await page.goto('/chat');

    await expect(page).toHaveURL(/\/chat/);
    await expect(page.getByText(`@${user.auth.username}`)).toBeVisible();

    const refreshedAccessToken = await readAccessToken(page);
    expect(refreshedAccessToken).toBeTruthy();
    expect(refreshedAccessToken).not.toBe('invalid-access-token');
  });
});
