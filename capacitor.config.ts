import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safi.app',
  appName: 'صافي | Safi',
  webDir: 'out',
  server: {
    // For development: point to your local dev server
    // Comment this out for production builds
    url: 'http://localhost:3000',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Safi',
  },
};

export default config;
