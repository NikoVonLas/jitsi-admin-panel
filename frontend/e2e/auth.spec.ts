import { expect, test, type APIRequestContext, type Browser, type Page } from '@playwright/test';

const mode = process.env.E2E_MODE || 'local';
const jitsiBaseUrl = process.env.JITSI_BASE_URL || 'http://jitsi-web:8000';

async function waitForJson(
  request: APIRequestContext,
  url: string,
  ready: (value: unknown) => boolean
) {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get(url);
          if (!response.ok()) return false;
          return ready(await response.json());
        } catch {
          return false;
        }
      },
      { timeout: 90_000, intervals: [500, 1_000, 2_000] }
    )
    .toBe(true);
}

async function openAccount(page: Page, name: RegExp) {
  await page.getByRole('button', { name }).click();
  await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible();
}

async function waitForHttp(request: APIRequestContext, url: string) {
  await expect
    .poll(
      async () => {
        try {
          return (await request.get(url)).ok();
        } catch {
          return false;
        }
      },
      { timeout: 120_000, intervals: [500, 1_000, 2_000] }
    )
    .toBe(true);
}

async function assertGatewayConfig(request: APIRequestContext) {
  const response = await request.get('/');
  expect(response.ok()).toBe(true);
  expect(response.headers()['server']).toBeUndefined();
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');

  const publicConfig = await request.post('/api/pub/hello', { data: {} });
  expect(publicConfig.ok()).toBe(true);
  expect((await publicConfig.json()).lang).toBe('en');
}

async function createJitsiRoom(page: Page) {
  const suffix = `${mode}-${Date.now().toString(36)}`;
  const domainName = `E2E Jitsi ${suffix}`;
  const roomLabel = `E2E Conference ${suffix}`;
  const roomSlug = `e2e-${suffix}`;

  await page.goto('/setting?tab=domains');
  await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).first().click();

  const domainDialog = page.getByRole('dialog', { name: 'Add a Jitsi domain' });
  await domainDialog.getByText('Token', { exact: true }).click();
  await domainDialog.getByLabel('Name').fill(domainName);
  await domainDialog.getByLabel('URL').fill(jitsiBaseUrl);
  await domainDialog.getByLabel('App ID').fill('jitsi-admin-e2e');
  await domainDialog.getByLabel('App Secret').fill('e2e-jitsi-secret');

  const domainAdded = page.waitForResponse(
    (response) => response.url().endsWith('/api/pri/domain/add') && response.status() === 200
  );
  await domainDialog.getByRole('button', { name: 'Add', exact: true }).click();
  await domainAdded;
  await expect(page.getByText(domainName, { exact: true })).toBeVisible();

  await page.goto('/room');
  await expect(page.getByRole('heading', { name: 'My meeting rooms' })).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).first().click();

  const roomDialog = page.getByRole('dialog', { name: 'Add a meeting room' });
  await roomDialog.getByLabel('Display name (shown in Jitsi)').fill(roomLabel);
  await roomDialog.getByLabel('Room slug (used in URL)').fill(roomSlug);
  await expect(roomDialog.getByText(domainName, { exact: false })).toBeVisible();

  const roomAdded = page.waitForResponse(
    (response) => response.url().endsWith('/api/pri/room/add') && response.status() === 200
  );
  await roomDialog.getByRole('button', { name: 'Add', exact: true }).click();
  const roomAddedResponse = await roomAdded;
  const [{ id: roomId }] = (await roomAddedResponse.json()) as [{ id: string }];

  const roomCard = page.locator('.ant-card').filter({ hasText: roomLabel });
  await expect(roomCard).toBeVisible();
  const participantUrl = await roomCard
    .getByRole('link', { name: 'Participant link' })
    .getAttribute('href');
  const moderatorUrl = await roomCard
    .getByRole('link', { name: 'Moderator link' })
    .getAttribute('href');

  await roomCard.locator('i.bi-key').locator('xpath=..').click();
  const keyDialog = page.getByRole('dialog', { name: new RegExp(`Host key.*${roomLabel}`) });
  const hostKey = ((await keyDialog.locator('code').textContent()) || '').replaceAll(/\s/g, '');

  expect(participantUrl).toMatch(/^http:\/\/web\/r\//);
  expect(moderatorUrl).toMatch(/^http:\/\/web\/rm\//);
  expect(hostKey).toMatch(/^[a-z0-9]{9}$/);

  return {
    hostKey,
    moderatorUrl: moderatorUrl!,
    participantUrl: participantUrl!,
    roomId,
    roomSlug,
  };
}

interface MailpitMessage {
  ID?: string;
  Subject?: string;
  To?: Array<{ Address?: string }>;
}

async function exerciseEmailReminder(page: Page, request: APIRequestContext, roomId: string) {
  const expectedEmail = mode === 'keycloak' ? 'keycloak-admin@example.test' : 'admin@example.test';
  const api = page.context().request;

  const profileResponse = await api.post('/api/pri/profile/get/default', { data: {} });
  expect(profileResponse.ok()).toBe(true);
  const [{ id: profileId }] = (await profileResponse.json()) as [{ id: string }];

  const meetingName = `E2E reminder ${mode}-${Date.now().toString(36)}`;
  const meetingResponse = await api.post('/api/pri/meeting/add', {
    data: {
      profile_id: profileId,
      room_id: roomId,
      name: meetingName,
      info: 'Real SMTP reminder delivery',
      hidden: false,
      subscribable: false,
    },
  });
  expect(meetingResponse.ok()).toBe(true);
  const [{ id: meetingId }] = (await meetingResponse.json()) as [{ id: string }];

  const scheduleResponse = await api.post('/api/pri/meeting/schedule/add', {
    data: {
      meeting_id: meetingId,
      schedule_attr: {
        type: 'o',
        duration: '60',
        started_at: new Date(Date.now() + 28 * 60 * 1000).toISOString(),
      },
    },
  });
  expect(scheduleResponse.ok()).toBe(true);

  let reminderId = '';
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get('http://mailpit:8025/api/v1/messages');
          if (!response.ok()) return false;
          const payload = (await response.json()) as { messages?: MailpitMessage[] };
          const reminder = payload.messages?.find(
            (message) =>
              message.Subject === `You have a meeting in 30 minutes, ${meetingName}` &&
              message.To?.some((address) => address.Address === expectedEmail)
          );
          reminderId = reminder?.ID || '';
          return reminderId !== '';
        } catch {
          return false;
        }
      },
      { timeout: 90_000, intervals: [500, 1_000, 2_000] }
    )
    .toBe(true);

  const messageResponse = await request.get(`http://mailpit:8025/api/v1/message/${reminderId}`);
  expect(messageResponse.ok()).toBe(true);
  const message = (await messageResponse.json()) as { Text?: string };
  expect(message.Text).toContain(`http://web/jm/${meetingId}`);
}

async function conferenceStatus(page: Page) {
  return page.evaluate(() => {
    interface Conference {
      getParticipants?: () => unknown[];
      isJoined?: () => boolean;
    }
    interface JitsiApp {
      conference?: { _room?: Conference };
      store?: { getState?: () => Record<string, { conference?: Conference }> };
    }
    const app = (globalThis as typeof globalThis & { APP?: JitsiApp }).APP;
    const stateConference = app?.store?.getState?.()['features/base/conference']?.conference;
    const conference = stateConference || app?.conference?._room;
    return {
      joined: conference?.isJoined?.() === true,
      remoteParticipants: conference?.getParticipants?.().length ?? -1,
    };
  });
}

async function waitForConference(page: Page, remoteParticipants: number) {
  await expect
    .poll(
      async () => {
        try {
          return await conferenceStatus(page);
        } catch (error) {
          if (page.isClosed()) throw error;
          return { joined: false, remoteParticipants: -1 };
        }
      },
      {
        timeout: 90_000,
        intervals: [1_000, 2_000],
      }
    )
    .toMatchObject({ joined: true, remoteParticipants });
}

async function exerciseJitsi(page: Page, browser: Browser, request: APIRequestContext) {
  await waitForHttp(request, `${jitsiBaseUrl}/config.js`);
  const room = await createJitsiRoom(page);
  await exerciseEmailReminder(page, request, room.roomId);

  const moderatorPage = await page.context().newPage();
  await moderatorPage.goto(room.moderatorUrl);
  const keyInputs = moderatorPage.locator('input[type="text"]');
  await expect(keyInputs).toHaveCount(3);
  await keyInputs.nth(0).fill(room.hostKey.slice(0, 3));
  await keyInputs.nth(1).fill(room.hostKey.slice(3, 6));
  await keyInputs.nth(2).fill(room.hostKey.slice(6, 9));
  await moderatorPage.getByRole('button', { name: 'Join' }).click();
  await expect(moderatorPage).toHaveURL(
    new RegExp(`^${jitsiBaseUrl.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${room.roomSlug}`),
    { timeout: 60_000 }
  );
  await waitForConference(moderatorPage, 0);

  const participantContext = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: { width: 1280, height: 720 },
  });
  const participantPage = await participantContext.newPage();
  await participantPage.goto(room.participantUrl);
  await expect(participantPage).toHaveURL(
    new RegExp(`^${jitsiBaseUrl.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${room.roomSlug}`),
    { timeout: 60_000 }
  );
  await waitForConference(participantPage, 1);
  await waitForConference(moderatorPage, 1);

  await expect
    .poll(
      async () => {
        try {
          const response = await request.get('http://jvb:8080/colibri/stats');
          if (!response.ok()) return { conferences: 0, participants: 0 };
          const stats = (await response.json()) as {
            conferences?: number;
            participants?: number;
          };
          return {
            conferences: stats.conferences ?? 0,
            participants: stats.participants ?? 0,
          };
        } catch {
          return { conferences: 0, participants: 0 };
        }
      },
      { timeout: 60_000, intervals: [1_000, 2_000] }
    )
    .toMatchObject({ conferences: 1, participants: 2 });

  await participantContext.close();
  await moderatorPage.close();
}

test.describe('local authentication @local', () => {
  test.skip(mode !== 'local', 'local stack only');

  test('registers, manages a local user, signs back in, and joins Jitsi', async ({
    page,
    browser,
    request,
  }) => {
    await assertGatewayConfig(request);
    await waitForJson(request, '/api/adm/auth/config', (value) => {
      const config = value as { local?: boolean };
      return config.local === true;
    });

    const authConfigResponse = await request.get('/api/adm/auth/config');
    const authConfig = (await authConfigResponse.json()) as { setup?: boolean };
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login$/);
    if (authConfig.setup) {
      await expect(page.getByText('First run', { exact: false })).toBeVisible();
      await page.locator('input[autocomplete="name"]').fill('E2E Admin');
      await page.locator('input[autocomplete="email"]').fill('admin@example.test');
      await page.locator('input[autocomplete="new-password"]').fill('LocalE2ePassword123!');
      const registered = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/adm/auth/local/register') && response.status() === 200
      );
      await page.getByRole('button', { name: 'Create account' }).click();
      await registered;
    } else {
      await page.locator('input[autocomplete="email"]').fill('admin@example.test');
      await page.locator('input[autocomplete="current-password"]').fill('LocalE2ePassword123!');
      await page.getByRole('button', { name: 'Sign In' }).click();
    }
    await expect(page).toHaveURL(/\/meeting$/);
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

    await page.goto('/setting?tab=users');
    await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
    await page.getByRole('button', { name: 'Add' }).click();

    const dialog = page.getByRole('dialog', { name: 'Add user' });
    const managedEmail = `managed-user-${Date.now()}@example.test`;
    await dialog.getByLabel('Email').fill(managedEmail);
    await dialog.getByLabel('Display name').fill('Managed User');
    await dialog.getByLabel('Password').fill('ManagedUserPassword123!');

    const added = page.waitForResponse(
      (response) => response.url().endsWith('/api/pri/user/add') && response.status() === 200
    );
    await dialog.getByRole('button', { name: 'Add user' }).click();
    await added;

    const userRow = page.getByRole('row', { name: new RegExp(managedEmail) });
    await expect(userRow).toBeVisible();

    const promoted = page.waitForResponse(
      (response) => response.url().endsWith('/api/pri/user/set-admin') && response.status() === 200
    );
    await userRow.getByRole('switch').click();
    await promoted;
    await expect(userRow.getByRole('switch')).toHaveAttribute('aria-checked', 'true');

    await userRow.locator('button').last().click();
    const deleted = page.waitForResponse(
      (response) => response.url().endsWith('/api/pri/user/del') && response.status() === 200
    );
    await page.locator('.ant-popconfirm').getByRole('button', { name: 'OK' }).click();
    await deleted;
    await expect(userRow).toHaveCount(0);

    await openAccount(page, /E2E/);
    await page.getByRole('button', { name: 'Log Out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();

    await page.locator('input[autocomplete="email"]').fill('admin@example.test');
    await page.locator('input[autocomplete="current-password"]').fill('LocalE2ePassword123!');
    const loggedIn = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/adm/auth/local/login') && response.status() === 200
    );
    await page.getByRole('button', { name: 'Sign In' }).click();
    await loggedIn;
    await expect(page).toHaveURL(/\/meeting$/);
    await exerciseJitsi(page, browser, request);
  });
});

test.describe('Keycloak authentication @keycloak', () => {
  test.skip(mode !== 'keycloak', 'Keycloak stack only');

  test('logs in through Keycloak, provisions JIT identity, joins Jitsi and logs out', async ({
    page,
    browser,
    request,
  }) => {
    await assertGatewayConfig(request);
    await waitForJson(
      request,
      'http://keycloak:8080/realms/jitsi/.well-known/openid-configuration',
      (value) => (value as { issuer?: string }).issuer === 'http://keycloak:8080/realms/jitsi'
    );
    await waitForJson(request, '/api/adm/auth/config', (value) => {
      const config = value as { local?: boolean; oidc?: boolean; oidc_providers?: unknown[] };
      return config.local === false && config.oidc === true && config.oidc_providers?.length === 1;
    });

    await page.goto('/login');
    await expect(page.locator('input[autocomplete="email"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Sign in via Keycloak' }).click();

    await expect(page.locator('#username')).toBeVisible();
    await page.locator('#username').fill('keycloak-admin');
    await page.locator('#password').fill('E2eKeycloakPassword123!');
    await page.locator('#kc-login').click();

    await expect(page).toHaveURL(/http:\/\/web\/meeting$/);
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

    const role = await page.evaluate(async () => {
      const response = await fetch('/api/pri/identity/role', {
        method: 'POST',
        credentials: 'include',
        body: '{}',
      });
      return response.json();
    });
    expect(role).toEqual([{ is_superadmin: true }]);

    const profile = await page.evaluate(async () => {
      const response = await fetch('/api/pri/profile/get/default', {
        method: 'POST',
        credentials: 'include',
        body: '{}',
      });
      return response.json();
    });
    expect(profile[0]).toMatchObject({
      name: 'keycloak-admin',
      email: 'keycloak-admin@example.test',
    });

    await page.goto('/setting');
    await expect(page.getByRole('tab', { name: 'Users' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Authentication' })).toBeVisible();

    await exerciseJitsi(page, browser, request);

    await openAccount(page, /keycloak-admin/);
    await page.getByRole('button', { name: 'Log Out' }).click();

    const keycloakLogout = page.getByRole('button', { name: 'Logout', exact: true });
    await expect(keycloakLogout).toBeVisible({ timeout: 30_000 });
    await keycloakLogout.click();
    await expect(page).toHaveURL(/http:\/\/web\/login$/, { timeout: 30_000 });

    await page.goto('/meeting');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('button', { name: 'Sign in via Keycloak' }).click();
    await expect(page.locator('#username')).toBeVisible();
  });
});
