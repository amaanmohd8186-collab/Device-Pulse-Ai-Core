import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.devicepulse.ai',
  appName: 'DevicePulse AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
