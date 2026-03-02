import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createRoom, registerUser } from './helpers/apiClient';
import { seedAuthTokens } from './helpers/authStorage';

async function waitForRealtimeReady(page: Page) {
  await expect(page.locator('.connection-badge')).toHaveText(/connected/i, { timeout: 20_000 });
}

test.describe('Chat flows', () => {
  test('create room + join + send + edit + delete message', async ({ page }) => {
    const user = await registerUser('chat-owner');
    await seedAuthTokens(page, {
      accessToken: user.auth.accessToken,
      refreshToken: user.auth.refreshToken,
    });

    await page.goto('/chat');
    await expect(page).toHaveURL(/\/chat/);
    await waitForRealtimeReady(page);

    const roomName = `pw-room-${Date.now()}`;
    const firstMessage = `hello-${Date.now()}`;
    const editedMessage = `${firstMessage}-edited`;

    await page.getByLabel('Name').fill(roomName);
    await page.getByLabel('Description').fill('Playwright chat room');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('heading', { name: roomName })).toBeVisible();

    await page.getByRole('button', { name: 'Join' }).click();
    await page.getByPlaceholder('Write a message').fill(firstMessage);
    await page.getByRole('button', { name: 'Send' }).click();

    const sentMessageLocator = page.locator('.message-item p', { hasText: firstMessage });
    await expect(sentMessageLocator).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.locator('.message-edit-row input').fill(editedMessage);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.locator('.message-item p', { hasText: editedMessage })).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.locator('.message-item p', { hasText: '[deleted]' })).toBeVisible();
  });

  test('two sessions realtime typing + presence + read', async ({ browser }) => {
    const userA = await registerUser('rt-a');
    const userB = await registerUser('rt-b');
    const roomName = `rt-room-${Date.now()}`;
    const room = await createRoom(userA.auth.accessToken, roomName, 'Realtime test room', [userB.auth.userId]);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await seedAuthTokens(pageA, {
        accessToken: userA.auth.accessToken,
        refreshToken: userA.auth.refreshToken,
      });
      await seedAuthTokens(pageB, {
        accessToken: userB.auth.accessToken,
        refreshToken: userB.auth.refreshToken,
      });

      await pageA.goto('/chat');
      await pageB.goto('/chat');
      await waitForRealtimeReady(pageA);
      await waitForRealtimeReady(pageB);

      const roomButtonA = pageA.getByRole('button', { name: new RegExp(roomName) });
      const roomButtonB = pageB.getByRole('button', { name: new RegExp(roomName) });

      await roomButtonA.click();
      await roomButtonB.click();

      await expect(pageA.getByRole('heading', { name: roomName })).toBeVisible();
      await expect(pageB.getByRole('heading', { name: roomName })).toBeVisible();

      await pageB.getByPlaceholder('Write a message').fill(`typing-${Date.now()}`);
      await expect(pageA.locator('.typing-indicator')).toContainText('typing');

      const messageText = `from-a-${Date.now()}`;
      await pageA.getByPlaceholder('Write a message').fill(messageText);
      await pageA.getByRole('button', { name: 'Send' }).click();

      await pageB.reload();
      await waitForRealtimeReady(pageB);
      await pageB.getByRole('button', { name: new RegExp(roomName) }).click();
      await expect(pageB.locator('.message-item p', { hasText: messageText })).toBeVisible();
      await pageB.getByRole('button', { name: 'Mark Read' }).first().click();
      await expect(pageA.locator('.message-read-by')).toContainText('Read by');

      const statusEvents = pageA.locator('.realtime-events li', { hasText: 'UserStatusChanged' });
      const beforeCount = await statusEvents.count();
      await contextB.close();
      await expect.poll(async () => statusEvents.count()).toBeGreaterThan(beforeCount);
    } finally {
      await contextA.close();
      if (contextB.pages().length > 0) {
        await contextB.close();
      }
    }

    // keep room variable used for trace readability and to avoid lint no-unused warning
    expect(room.id).toBeTruthy();
  });
});
