import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppInfo, BandwidthStats, KuzaVPN, VPNConfig } from './VPNModule';

interface VPNContextType {
  vpnStatus: 'connected' | 'disconnected' | 'connecting';
  selectedApps: AppInfo[];
  availableApps: AppInfo[];
  isLoading: boolean;
  bandwidthStats: BandwidthStats | null;
  bandwidthLimit: number;
  vpnConfig: VPNConfig | null;

  // Actions
  connectVPN: () => Promise<void>;
  disconnectVPN: () => Promise<void>;
  toggleAppSelection: (app: AppInfo) => void;
  setSelectedApps: (apps: AppInfo[]) => void;
  loadAvailableApps: () => Promise<void>;
  setEncryptAll: () => void;
  setCustomSelection: () => void;
  setVPNConfig: (config: VPNConfig) => void;
  refreshBandwidthStats: () => Promise<void>;
}

const VPNContext = createContext<VPNContextType | undefined>(undefined);

// Default VPN configuration using your actual WireGuard server
const DEFAULT_VPN_CONFIG: VPNConfig = {
  serverEndpoint: "152.53.146.237:51820",
  publicKey: "WvzOJrORUIUP3BICmHXlG1dIDJW9Fl3RXMr2AnDv+AU=", // Your server's public key
  privateKey: "4Kr3B+rUH8nsWv2cDuXXmI32dKcYvI6e7sGlUPDbXlU=", // Your client's private key
  allowedIPs: ["0.0.0.0/0", "::/0"],
  dns: ["1.1.1.1", "8.8.8.8"]
};

export const VPNProvider = ({ children }: { children: ReactNode }) => {
  const [vpnStatus, setVpnStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [selectedApps, setSelectedAppsState] = useState<AppInfo[]>([]);
  const [availableApps, setAvailableApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bandwidthStats, setBandwidthStats] = useState<BandwidthStats | null>(null);
  const [bandwidthLimit] = useState(1040 * 1024 * 1024); // 1040 MB converted to bytes
  const [vpnConfig, setVPNConfigState] = useState<VPNConfig | null>(DEFAULT_VPN_CONFIG);
  const [selectionMode, setSelectionMode] = useState<'encrypt-all' | 'custom'>('encrypt-all');

  useEffect(() => {
    loadAvailableApps();
    // Check VPN status more frequently for better UI responsiveness
    const interval = setInterval(checkVPNStatus, 1000); // Check every second
    return () => clearInterval(interval);
  }, []);

  const loadAvailableApps = async () => {
    try {
      setIsLoading(true);
      const apps = await KuzaVPN.getInstalledApps();
      setAvailableApps(apps);

      // Default to some popular apps being selected
      const defaultSelected = apps.filter(app =>
        ['Snapchat', 'WhatsApp', 'Instagram', 'TikTok'].includes(app.appName)
      );
      setSelectedAppsState(defaultSelected);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkVPNStatus = async () => {
    try {
      const status = await KuzaVPN.getVPNStatus();
      // Handle both string and object responses
      const statusString = typeof status === 'string' ? status : (status as any).status || 'disconnected';
      setVpnStatus(statusString as 'connected' | 'disconnected' | 'connecting');

      // Refresh bandwidth stats if connected
      if (statusString === 'connected') {
        refreshBandwidthStatsLocal();
      }
    } catch (error) {
      console.error('Failed to check VPN status:', error);
      setVpnStatus('disconnected');
    }
  };

  const refreshBandwidthStatsLocal = async () => {
    try {
      const stats = await KuzaVPN.getBandwidthStats();
      setBandwidthStats(stats);
    } catch (error) {
      console.error('Failed to get bandwidth stats:', error);
    }
  };

  const connectVPN = async () => {
    if (!vpnConfig) {
      console.error('VPN configuration not set');
      return;
    }

    try {
      setIsLoading(true);
      setVpnStatus('connecting');

      console.log('🔄 Starting VPN connection...');

      // Request permission first
      console.log('📋 Requesting VPN permission...');
      const hasPermission = await KuzaVPN.requestVPNPermission();
      if (!hasPermission) {
        console.error('❌ VPN permission denied');
        throw new Error('VPN permission denied');
      }
      console.log('✅ VPN permission granted');

      // Prepare app list for native module
      const appsToConnect = selectionMode === 'encrypt-all' 
        ? [] // Empty array means all traffic goes through VPN
        : selectedApps;

      console.log('🚀 Starting VPN with config:', {
        server: vpnConfig.serverEndpoint,
        appsCount: appsToConnect.length,
        mode: selectionMode
      });

      // Start VPN with real WireGuard configuration
      const success = await KuzaVPN.startVPN(vpnConfig, appsToConnect);

      if (success) {
        setVpnStatus('connected');
        console.log('✅ VPN Connected to WireGuard server:', vpnConfig.serverEndpoint);
        console.log('📱 Apps routing through VPN:', appsToConnect.length === 0 ? 'ALL APPS' : appsToConnect.map(app => app.appName));
        
        // Force immediate status check after connection
        setTimeout(checkVPNStatus, 1000);
        
        // Start bandwidth monitoring
        refreshBandwidthStatsLocal();
      } else {
        console.error('❌ VPN connection failed');
        setVpnStatus('disconnected');
        throw new Error('Failed to start VPN');
      }
    } catch (error) {
      console.error('❌ Failed to connect VPN:', error);
      setVpnStatus('disconnected');
      
      // Show user-friendly error message
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectVPN = async () => {
    try {
      setIsLoading(true);
      await KuzaVPN.stopVPN();
      setVpnStatus('disconnected');
      setBandwidthStats(null);
    } catch (error) {
      console.error('Failed to disconnect VPN:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAppSelection = (app: AppInfo) => {
    setSelectedAppsState(prev => {
      const isSelected = prev.some(selectedApp => selectedApp.packageName === app.packageName);
      if (isSelected) {
        return prev.filter(selectedApp => selectedApp.packageName !== app.packageName);
      } else {
        return [...prev, app];
      }
    });
  };

  const setSelectedApps = (apps: AppInfo[]) => {
    setSelectedAppsState(apps);
  };

  const setEncryptAll = () => {
    setSelectionMode('encrypt-all');
    setSelectedAppsState(availableApps);
  };

  const setCustomSelection = () => {
    setSelectionMode('custom');
  };

  const setVPNConfig = (config: VPNConfig) => {
    setVPNConfigState(config);
  };

  const refreshBandwidthStats = async () => {
    try {
      const stats = await KuzaVPN.getBandwidthStats();
      setBandwidthStats(stats);
    } catch (error) {
      console.error('Failed to get bandwidth stats:', error);
    }
  };

  return (
    <VPNContext.Provider value={{
      vpnStatus,
      selectedApps,
      availableApps,
      isLoading,
      bandwidthStats,
      bandwidthLimit,
      vpnConfig,
      connectVPN,
      disconnectVPN,
      toggleAppSelection,
      setSelectedApps,
      loadAvailableApps,
      setEncryptAll,
      setCustomSelection,
      setVPNConfig,
      refreshBandwidthStats,
    }}>
      {children}
    </VPNContext.Provider>
  );
};

export const useVPN = () => {
  const context = useContext(VPNContext);
  if (context === undefined) {
    throw new Error('useVPN must be used within a VPNProvider');
  }
  return context;
};
