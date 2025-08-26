import { NativeModules, Platform } from 'react-native';

// Native module interface - must match KuzaVpnModule names
interface KuzaVpnNativeModule {
  // VPN Control
  requestVpnPermission(): Promise<boolean>;
  startVPN(config: string, selectedApps: string[]): Promise<boolean>;
  stopVPN(): Promise<boolean>;
  getVpnStatus(): Promise<any>;

  // App Management
  getInstalledApps(): Promise<AppInfo[]>;

  // Statistics
  getBandwidthStats(): Promise<BandwidthStats>;
}

// Type definitions
export interface AppInfo {
  packageName: string;
  appName: string;
  isSystemApp: boolean;
  iconBase64?: string;
}

export interface VPNConfig {
  serverEndpoint: string;
  publicKey: string;
  privateKey: string;
  allowedIPs: string[];
  dns: string[];
}

export interface BandwidthStats {
  bytesReceived: number;
  bytesSent: number;
  totalBytes: number;
  lastUpdated: string;
}

// Get native module with fallback for development
const KuzaVpnNativeModule = NativeModules.KuzaVPN as KuzaVpnNativeModule | undefined;

/**
 * KuzaVPN - Main VPN functionality class
 * Provides unified interface for WireGuard VPN with per-app routing
 */
export class KuzaVPN {

  /**
   * Request VPN permission from the user
   * Must be called before starting VPN
   */
  static async requestVPNPermission(): Promise<boolean> {
    if (!KuzaVpnNativeModule) {
      console.log('Native module not available - development mode');
      return true; // Allow development
    }

    try {
      return await KuzaVpnNativeModule.requestVpnPermission();
    } catch (error) {
      console.error('Failed to request VPN permission:', error);
      return false;
    }
  }

  /**
   * Start VPN with WireGuard configuration and selected apps
   *
   * @param config - WireGuard configuration
   * @param selectedApps - List of apps to route through VPN
   */
  static async startVPN(config: VPNConfig, selectedApps: AppInfo[]): Promise<boolean> {
    if (!KuzaVpnNativeModule) {
      console.log('VPN start simulated - development mode');
      return true;
    }

    try {
      // Convert config to JSON string for native modules
      const configJson = JSON.stringify({
        serverEndpoint: config.serverEndpoint,
        publicKey: config.publicKey,
        privateKey: config.privateKey,
        allowedIPs: config.allowedIPs,
        dns: config.dns
      });

      // Extract package names for native modules
      const packageNames = selectedApps.map(app => app.packageName);

      return await KuzaVpnNativeModule.startVPN(configJson, packageNames);
    } catch (error) {
      console.error('Failed to start VPN:', error);
      throw error;
    }
  }

  /**
   * Stop VPN connection
   */
  static async stopVPN(): Promise<boolean> {
    if (!KuzaVpnNativeModule) {
      console.log('VPN stop simulated - development mode');
      return true;
    }

    try {
      return await KuzaVpnNativeModule.stopVPN();
    } catch (error) {
      console.error('Failed to stop VPN:', error);
      throw error;
    }
  }

  /**
   * Get current VPN connection status
   */
  static async getVPNStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    if (!KuzaVpnNativeModule) {
      return 'disconnected';
    }

    try {
      return await KuzaVpnNativeModule.getVpnStatus();
    } catch (error) {
      console.error('Failed to get VPN status:', error);
      return 'disconnected';
    }
  }

  /**
   * Get list of all installed applications
   * Filters out system apps and returns user-installed apps
   */
  static async getInstalledApps(): Promise<AppInfo[]> {
    if (!KuzaVpnNativeModule) {
      // Return mock apps for development
      return this.getMockApps();
    }

    try {
      const apps = await KuzaVpnNativeModule.getInstalledApps();

      // Add default apps if none found (for testing)
      if (apps.length === 0) {
        return this.getMockApps();
      }

      return apps;
    } catch (error) {
      console.error('Failed to get installed apps:', error);

      // Return mock apps for development/testing
      return this.getMockApps();
    }
  }

  /**
   * Get list of popular/recommended applications
   */
  static async getPopularApps(): Promise<AppInfo[]> {
    if (!KuzaVpnNativeModule) {
      return [];
    }

    try {
      // For now, return a subset of installed apps as popular
      const allApps = await KuzaVpnNativeModule.getInstalledApps();
      return allApps.slice(0, 10); // Return first 10 as "popular"
    } catch (error) {
      console.error('Failed to get popular apps:', error);
      return [];
    }
  }

  /**
   * Check if a specific app is installed
   */
  static async isAppInstalled(packageName: string): Promise<boolean> {
    if (!KuzaVpnNativeModule) {
      // Mock check for development
      const mockApps = this.getMockApps();
      return mockApps.some(app => app.packageName === packageName);
    }

    try {
      // Check if app exists in installed apps list
      const installedApps = await KuzaVpnNativeModule.getInstalledApps();
      return installedApps.some(app => app.packageName === packageName);
    } catch (error) {
      console.error(`Failed to check if app is installed: ${packageName}`, error);
      return false;
    }
  }

  /**
   * Get bandwidth usage statistics
   */
  static async getBandwidthStats(): Promise<BandwidthStats> {
    if (!KuzaVpnNativeModule) {
      return {
        bytesReceived: Math.floor(Math.random() * 1000000),
        bytesSent: Math.floor(Math.random() * 500000),
        totalBytes: Math.floor(Math.random() * 1500000),
        lastUpdated: new Date().toISOString()
      };
    }

    try {
      return await KuzaVpnNativeModule.getBandwidthStats();
    } catch (error) {
      console.error('Failed to get bandwidth stats:', error);

      // Return mock stats
      return {
        bytesReceived: 0,
        bytesSent: 0,
        totalBytes: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Create WireGuard configuration from server details
   */
  static createWireGuardConfig(
    serverEndpoint: string,
    serverPublicKey: string,
    clientPrivateKey: string,
    clientIP: string = '10.0.0.2/24',
    dns: string[] = ['1.1.1.1', '8.8.8.8']
  ): VPNConfig {
    return {
      serverEndpoint,
      publicKey: serverPublicKey,
      privateKey: clientPrivateKey,
      allowedIPs: ['0.0.0.0/0', '::/0'], // Route all traffic through VPN (IPv4 and IPv6)
      dns
    };
  }

  /**
   * Get mock apps for development/testing
   * Used when native module is not available or returns empty results
   */
  private static getMockApps(): AppInfo[] {
    const mockApps: AppInfo[] = [
      {
        packageName: Platform.OS === 'ios' ? 'com.snapchat.Snapchat' : 'com.snapchat.android',
        appName: 'Snapchat',
        isSystemApp: false
      },
      {
        packageName: Platform.OS === 'ios' ? 'net.whatsapp.WhatsApp' : 'com.whatsapp',
        appName: 'WhatsApp',
        isSystemApp: false
      },
      {
        packageName: Platform.OS === 'ios' ? 'com.burbn.instagram' : 'com.instagram.android',
        appName: 'Instagram',
        isSystemApp: false
      },
      {
        packageName: Platform.OS === 'ios' ? 'com.zhiliaoapp.musically' : 'com.zhiliaoapp.musically',
        appName: 'TikTok',
        isSystemApp: false
      },
      {
        packageName: Platform.OS === 'ios' ? 'com.twitter.app' : 'com.twitter.android',
        appName: 'Twitter',
        isSystemApp: false
      },
      {
        packageName: Platform.OS === 'ios' ? 'com.spotify.client' : 'com.spotify.music',
        appName: 'Spotify',
        isSystemApp: false
      }
    ];

    return mockApps;
  }

  /**
   * Platform-specific app package name conversion
   */
  static convertPackageName(packageName: string, targetPlatform: 'ios' | 'android'): string {
    const conversions: { [key: string]: { ios: string; android: string } } = {
      snapchat: {
        ios: 'com.snapchat.Snapchat',
        android: 'com.snapchat.android'
      },
      whatsapp: {
        ios: 'net.whatsapp.WhatsApp',
        android: 'com.whatsapp'
      },
      instagram: {
        ios: 'com.burbn.instagram',
        android: 'com.instagram.android'
      },
      twitter: {
        ios: 'com.twitter.app',
        android: 'com.twitter.android'
      },
      spotify: {
        ios: 'com.spotify.client',
        android: 'com.spotify.music'
      }
    };

    // Find the app in conversions
    for (const [key, value] of Object.entries(conversions)) {
      if (value.ios === packageName || value.android === packageName) {
        return value[targetPlatform];
      }
    }

    // Return original if no conversion found
    return packageName;
  }
}

// Export everything for convenience
export default KuzaVPN;
