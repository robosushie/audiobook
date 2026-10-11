import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * EAS CLI evaluates this file locally and does not inject dashboard env vars.
 * Load apps/mobile/.env so `eas build` can read EXPO_PUBLIC_* on the machine.
 * Cloud builds still get the same keys from the EAS dashboard (`.env` is gitignored).
 */
function loadLocalEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnvFile();

function requirePublicEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Local: set it in apps/mobile/.env. ` +
        `EAS cloud: add it in the Expo dashboard for the preview environment.`,
    );
  }
  return value;
}

const apiBaseUrl = requirePublicEnv('EXPO_PUBLIC_API_BASE_URL');
requirePublicEnv('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.audiobook.mobile',
  },
  android: {
    ...config.android,
    package: 'com.audiobook.mobile',
    // Allow http:// LAN URLs during dev APK testing (Android blocks cleartext by default).
    usesCleartextTraffic: apiBaseUrl.startsWith('http://'),
  },
});
