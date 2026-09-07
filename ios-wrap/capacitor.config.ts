import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Brain Kit default: bundled www/ (no remote server.url).
 * Optional: set REMOTE_URL=https://… when Grok hosts a live preview later.
 * (Do not invent a grok.me host — none exists for Brain Kit yet.)
 */
const remoteUrl = (process.env.REMOTE_URL || '').trim();

const config: CapacitorConfig = {
  appId: 'com.mikemarshall.brainkit',
  appName: 'Brain Kit',
  webDir: 'www',
  ...(remoteUrl
    ? {
        server: {
          url: remoteUrl,
          cleartext: false,
        },
      }
    : {}),
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    minVersion: '15.0',
  },
};

export default config;
