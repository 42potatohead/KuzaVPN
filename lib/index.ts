/**
 * KuzaVPN Native Module Entry Point
 *
 * This file exports all the functionality needed for the VPN native module.
 * It provides a unified interface for both Android and iOS implementations.
 */

// Main VPN functionality
export { KuzaVPN, KuzaVPN as default } from './VPNModule';

// Type definitions
export type { AppInfo, BandwidthStats, VPNConfig } from './VPNModule';

// Context provider for React components
export { VPNProvider, useVPN } from './vpn-context';

// Utility functions
export const VPNUtils = {
  /**
   * Format bytes to human readable format
   */
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate a random WireGuard private key (for demo purposes)
   * In production, use proper cryptographic libraries
   */
  generatePrivateKey: (): string => {
    // This is a mock implementation - use proper crypto in production
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  /**
   * Validate WireGuard key format
   */
  isValidWireGuardKey: (key: string): boolean => {
    // WireGuard keys are base64 encoded and 44 characters long
    const base64Regex = /^[A-Za-z0-9+/]{43}=$/;
    return base64Regex.test(key);
  },

  /**
   * Validate endpoint format
   */
  isValidEndpoint: (endpoint: string): boolean => {
    // Basic validation for IP:port or domain:port
    const endpointRegex = /^([a-zA-Z0-9.-]+):(\d+)$/;
    return endpointRegex.test(endpoint);
  }
};
