# VPN App Development Instructions

This document describes how to implement a **WireGuard-based VPN app** with **per-app selection functionality** for React Native on iOS and Android.

## 🎯 App Overview

**KuzaVPN** - A React Native VPN app featuring:
- WireGuard protocol for secure, fast connections
- Per-app VPN selection (choose which apps use the VPN)
- Cross-platform support (iOS & Android)
- Modern UI with app selector interface

## 🔧 Core Arch## 🎨 UI Implementation

### App Selector Screen

Create an intuitive app selection interface:

**AppSelectorScreen.tsx:**
```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Switch } from 'react-native';
import { KuzaVPN, AppInfo } from '../lib/VPNModule';

export const AppSelectorScreen = () => {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInstalledApps();
  }, []);

  const loadInstalledApps = async () => {
    try {
      const installedApps = await KuzaVPN.getInstalledApps();
      setApps(installedApps);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApp = (appId: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const renderApp = ({ item }: { item: AppInfo }) => {
    const appId = item.packageName || item.bundleId || '';
    const isSelected = selectedApps.has(appId);

    return (
      <TouchableOpacity
        style={styles.appItem}
        onPress={() => toggleApp(appId)}
      >
        <View style={styles.appInfo}>
          {item.icon && (
            <Image source={{ uri: item.icon }} style={styles.appIcon} />
          )}
          <Text style={styles.appName}>{item.appName}</Text>
        </View>
        <Switch
          value={isSelected}
          onValueChange={() => toggleApp(appId)}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isSelected ? '#f5dd4b' : '#f4f3f4'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Apps for VPN</Text>
      <Text style={styles.subtitle}>
        Choose which apps should use the VPN connection
      </Text>

      <FlatList
        data={apps}
        renderItem={renderApp}
        keyExtractor={(item) => item.packageName || item.bundleId || item.appName}
        style={styles.appsList}
      />

      <TouchableOpacity
        style={styles.connectButton}
        onPress={() => handleConnect()}
      >
        <Text style={styles.connectButtonText}>
          Connect VPN ({selectedApps.size} apps)
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 🎯 Key UI Features:

1. **Search & Filter**: Allow users to search for specific apps
2. **Categories**: Group apps by type (Social, Games, Productivity, etc.)
3. **Quick Presets**: "Social Media", "Streaming", "All Apps" buttons
4. **Data Usage**: Show which apps use most data
5. **VPN Status**: Real-time connection status and speed

## 🔧 WireGuard Configuration

### Server Setup

**Example WireGuard server config:**
```ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = [SERVER_PRIVATE_KEY]

[Peer]
# Client configuration
PublicKey = [CLIENT_PUBLIC_KEY]
AllowedIPs = 10.0.0.2/32
```

### Client Configuration

**Generated for each user:**
```ini
[Interface]
Address = 10.0.0.2/24
PrivateKey = [CLIENT_PRIVATE_KEY]
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = [SERVER_PUBLIC_KEY]
Endpoint = your-server.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

## ⚠️ Important Notes & Limitations

### iOS Limitations
- **No True Per-App VPN**: iOS doesn't support per-app VPN without MDM (Mobile Device Management)
- **Domain-Based Workaround**: We simulate per-app by excluding/including domains and IP ranges
- **App Store Review**: Network Extensions require special approval from Apple
- **Maintenance Required**: Domain mappings need regular updates as services change IPs

### Android Advantages
- **True Per-App VPN**: Full support via `VpnService.addAllowedApplication()`
- **Real-time App Detection**: Can detect when apps are launched/closed
- **Granular Control**: Per-app bandwidth monitoring and control

### Security Considerations
1. **Key Management**: Store WireGuard keys securely (Keychain/KeyStore)
2. **Configuration Protection**: Encrypt VPN configurations
3. **DNS Leaks**: Ensure DNS queries go through VPN
4. **Kill Switch**: Stop internet if VPN fails

### Performance Optimization
1. **Battery Usage**: Optimize for minimal battery drain
2. **Connection Persistence**: Handle network changes gracefully
3. **Startup Speed**: Fast VPN connection establishment
4. **Memory Usage**: Efficient app list caching

### Testing Strategy
1. **Unit Tests**: Test VPN state management
2. **Integration Tests**: Test with real WireGuard servers
3. **Performance Tests**: Battery and speed benchmarks
4. **Device Testing**: Test on various Android/iOS versions

## 🚀 Development Roadmap

### Phase 1: Core VPN (Week 1-2)
- [ ] Basic WireGuard integration
- [ ] Simple on/off VPN functionality
- [ ] Connection status monitoring

### Phase 2: App Selection (Week 3-4)
- [ ] Installed apps enumeration
- [ ] App selection UI
- [ ] Per-app routing implementation

### Phase 3: Advanced Features (Week 5-6)
- [ ] Connection speed monitoring
- [ ] Data usage tracking
- [ ] App categorization and presets

### Phase 4: Polish & Optimization (Week 7-8)
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Comprehensive testing┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │────│  Native Modules  │────│  VPN Services   │
│   UI Layer      │    │   (Bridge)       │    │  (WireGuard)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
    App Selector UI         Translation Layer        Tunnel Management
```

## 📱 iOS Implementation (App Store Build)

### 🎯 Goal
Implement a WireGuard VPN client using `NEPacketTunnelProvider` with split tunneling. Since iOS doesn't support true per-app VPN without MDM, we'll simulate it using domain/IP-based routing.

### 📋 Prerequisites
- iOS 12+ (for NEPacketTunnelProvider)
- Xcode with Network Extensions capability
- Apple Developer Account with Network Extensions entitlement
- WireGuard configuration details (server endpoint, keys, etc.)

### 🛠️ Implementation Steps

#### 1. Enable Network Extension Entitlement
```bash
# In Xcode:
1. Select your app target
2. Go to "Signing & Capabilities"
3. Add "Network Extensions" capability
4. Enable "Packet Tunnel" option
```

Request entitlement from Apple:
- Entitlement: `com.apple.developer.networking.networkextension`
- Type: `packet-tunnel`

#### 2. Add WireGuard Dependencies
```bash
# Add to package.json or install separately
npm install react-native-wireguard
# OR use the official WireGuard iOS framework
```

#### 3. Create Packet Tunnel Extension

Add a new target in Xcode:
1. **File** → **New** → **Target**
2. Choose **Network Extension** → **Packet Tunnel Provider**
3. Name it `KuzaVPNTunnel`

**PacketTunnelProvider.swift:**
```swift
import NetworkExtension
import WireGuardKit

class PacketTunnelProvider: NEPacketTunnelProvider {
    private var adapter: WireGuardAdapter?

    override func startTunnel(options: [String : NSObject]?) async throws {
        // Get WireGuard config from options or keychain
        let tunnelConfiguration = try parseWireGuardConfig(from: options)

        // Configure network settings with split tunneling
        let settings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: tunnelConfiguration.interface.addresses.first?.stringRepresentation ?? "10.0.0.1")

        // Set up IPv4 settings
        let ipv4Settings = NEIPv4Settings(
            addresses: [tunnelConfiguration.interface.addresses.first?.address ?? "10.0.0.2"],
            subnetMasks: ["255.255.255.0"]
        )

        // Configure routing based on selected apps/domains
        ipv4Settings.includedRoutes = [NEIPv4Route.default()]
        ipv4Settings.excludedRoutes = buildExcludedRoutes(from: options)

        settings.ipv4Settings = ipv4Settings
        settings.dnsSettings = NEDNSSettings(servers: ["1.1.1.1", "8.8.8.8"])

        try await setTunnelNetworkSettings(settings)

        // Start WireGuard tunnel
        adapter = WireGuardAdapter(with: self) { _, logMessage in
            wg_log(.info, staticMessage: logMessage.message)
        }

        try adapter?.start(tunnelConfiguration: tunnelConfiguration)
    }

    private func buildExcludedRoutes(from options: [String: NSObject]?) -> [NEIPv4Route] {
        // Parse selected apps and convert to IP ranges/domains to exclude
        // This is where the "inverse" per-app logic happens
        guard let selectedApps = options?["selectedApps"] as? [String] else {
            return []
        }

        // Map apps to their known IP ranges/domains
        return AppDomainMapper.getExcludedRoutes(for: selectedApps)
    }
}
```

#### 4. App-to-Domain Mapping System

**AppDomainMapper.swift:**
```swift
class AppDomainMapper {
    private static let appDomainMap: [String: [String]] = [
        "WhatsApp": ["*.whatsapp.net", "*.whatsapp.com"],
        "Instagram": ["*.instagram.com", "*.facebook.com"],
        "Twitter": ["*.twitter.com", "*.x.com"],
        "Telegram": ["*.telegram.org"],
        // Add more apps as needed
    ]

    static func getExcludedRoutes(for selectedApps: [String]) -> [NEIPv4Route] {
        // Convert domain patterns to IP ranges
        // This requires maintaining an updated IP database
        var routes: [NEIPv4Route] = []

        for app in selectedApps {
            if let domains = appDomainMap[app] {
                routes.append(contentsOf: convertDomainsToRoutes(domains))
            }
        }

        return routes
    }
}
```

## 🤖 Android Implementation

### 🎯 Goal
Implement a WireGuard VPN service with **true per-app VPN selection** using Android's `VpnService` API.

### 📋 Prerequisites
- Android 5.0+ (API level 21) for `VpnService.Builder.addAllowedApplication()`
- WireGuard Android library
- `BIND_VPN_SERVICE` permission

### 🛠️ Implementation Steps

#### 1. Add Dependencies

**android/app/build.gradle:**
```gradle
dependencies {
    implementation 'com.wireguard.android:tunnel:1.0.20230706'
    implementation 'net.java.dev.jna:jna:5.8.0@aar'
}
```

**AndroidManifest.xml:**
```xml
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
<uses-permission android:name="android.permission.INTERNET" />

<service android:name=".vpn.KuzaVpnService"
         android:permission="android.permission.BIND_VPN_SERVICE">
    <intent-filter>
        <action android:name="android.net.VpnService" />
    </intent-filter>
</service>
```

#### 2. Create VPN Service

**KuzaVpnService.java:**
```java
import com.wireguard.android.backend.GoBackend;
import com.wireguard.config.Config;
import com.wireguard.config.Interface;
import com.wireguard.config.Peer;

public class KuzaVpnService extends VpnService {
    private static final String TAG = "KuzaVpnService";
    private GoBackend backend;
    private Tunnel tunnel;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String[] selectedApps = intent.getStringArrayExtra("selectedApps");
        String wireGuardConfig = intent.getStringExtra("wireGuardConfig");

        try {
            establishTunnel(selectedApps, wireGuardConfig);
        } catch (Exception e) {
            Log.e(TAG, "Failed to establish tunnel", e);
            return START_NOT_STICKY;
        }

        return START_STICKY;
    }

    private void establishTunnel(String[] selectedApps, String wireGuardConfig) throws Exception {
        // Parse WireGuard configuration
        Config config = Config.parse(new StringReader(wireGuardConfig));

        // Build VPN interface
        VpnService.Builder builder = new Builder();
        builder.setSession("KuzaVPN");

        // Configure interface from WireGuard config
        Interface wgInterface = config.getInterface();
        for (InetNetwork addr : wgInterface.getAddresses()) {
            builder.addAddress(addr.getAddress(), addr.getMask());
        }

        // Add DNS servers
        for (InetAddress dns : wgInterface.getDnsServers()) {
            builder.addDnsServer(dns);
        }

        // 🎯 PER-APP SELECTION - This is the key feature!
        if (selectedApps != null && selectedApps.length > 0) {
            // Only route traffic from selected apps through VPN
            for (String packageName : selectedApps) {
                try {
                    builder.addAllowedApplication(packageName);
                    Log.d(TAG, "Added app to VPN: " + packageName);
                } catch (PackageManager.NameNotFoundException e) {
                    Log.w(TAG, "App not found: " + packageName);
                }
            }
        } else {
            // If no apps selected, route all traffic
            builder.addRoute("0.0.0.0", 0);
        }

        // Establish the interface
        ParcelFileDescriptor vpnInterface = builder.establish();

        if (vpnInterface == null) {
            throw new IllegalStateException("Failed to establish VPN interface");
        }

        // Start WireGuard backend
        backend = new GoBackend(getApplicationContext());
        tunnel = new Tunnel("KuzaVPN", config, Tunnel.State.UP);
        backend.setState(tunnel, Tunnel.State.UP, config);

        // Start foreground service notification
        startForeground(1, createNotification());
    }

    private Notification createNotification() {
        // Create a persistent notification for the VPN service
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("KuzaVPN Connected")
            .setContentText("VPN is protecting your selected apps")
            .setSmallIcon(R.drawable.ic_vpn)
            .setOngoing(true)
            .build();
    }
}
```

#### 3. App Selection Helper

**InstalledAppsHelper.java:**
```java
public class InstalledAppsHelper {

    public static List<AppInfo> getInstalledApps(Context context) {
        PackageManager pm = context.getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        List<AppInfo> appList = new ArrayList<>();

        for (ApplicationInfo app : apps) {
            // Filter out system apps if desired
            if ((app.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                AppInfo appInfo = new AppInfo();
                appInfo.packageName = app.packageName;
                appInfo.appName = pm.getApplicationLabel(app).toString();
                appInfo.icon = pm.getApplicationIcon(app);
                appList.add(appInfo);
            }
        }

        Collections.sort(appList, (a, b) -> a.appName.compareToIgnoreCase(b.appName));
        return appList;
    }

    public static class AppInfo {
        public String packageName;
        public String appName;
        public Drawable icon;
    }
}
```

## 🌍 React Native Bridge

### 📱 Cross-Platform API

Create a unified JavaScript interface that handles both iOS and Android implementations:

**VPNModule.ts:**
```typescript
import { NativeModules, Platform } from 'react-native';

const { VPNModule } = NativeModules;

export interface AppInfo {
  packageName: string; // Android only
  bundleId?: string;   // iOS equivalent
  appName: string;
  icon?: string;       // Base64 encoded icon
}

export interface VPNConfig {
  serverEndpoint: string;
  publicKey: string;
  privateKey: string;
  allowedIPs: string[];
  dns?: string[];
}

export class KuzaVPN {
  /**
   * Get list of installed apps (Android only, iOS returns predefined list)
   */
  static async getInstalledApps(): Promise<AppInfo[]> {
    if (Platform.OS === 'android') {
      return await VPNModule.getInstalledApps();
    } else {
      // iOS: Return predefined popular apps
      return [
        { appName: 'WhatsApp', bundleId: 'net.whatsapp.WhatsApp' },
        { appName: 'Instagram', bundleId: 'com.burbn.instagram' },
        { appName: 'Twitter', bundleId: 'com.twitter.twitter' },
        // Add more popular apps
      ];
    }
  }

  /**
   * Start VPN with selected apps
   */
  static async startVPN(config: VPNConfig, selectedApps: AppInfo[]): Promise<boolean> {
    try {
      const appIdentifiers = selectedApps.map(app =>
        Platform.OS === 'android' ? app.packageName : app.bundleId
      ).filter(Boolean);

      return await VPNModule.startVPN({
        config: config,
        selectedApps: appIdentifiers
      });
    } catch (error) {
      console.error('Failed to start VPN:', error);
      throw error;
    }
  }

  /**
   * Stop VPN connection
   */
  static async stopVPN(): Promise<boolean> {
    return await VPNModule.stopVPN();
  }

  /**
   * Get current VPN status
   */
  static async getVPNStatus(): Promise<'connected' | 'disconnected' | 'connecting'> {
    return await VPNModule.getVPNStatus();
  }

  /**
   * Request VPN permission (required before starting)
   */
  static async requestVPNPermission(): Promise<boolean> {
    return await VPNModule.requestPermission();
  }
}
```

### 🔗 Native Module Implementation

#### iOS Native Module (Objective-C/Swift)

**VPNModule.m:**
```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VPNModule, NSObject)

RCT_EXTERN_METHOD(startVPN:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopVPN:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getVPNStatus:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestPermission:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

#### Android Native Module (Java)

**VPNModule.java:**
```java
@ReactModule(name = VPNModule.NAME)
public class VPNModule extends ReactContextBaseJavaModule {
    public static final String NAME = "VPNModule";

    @ReactMethod
    public void getInstalledApps(Promise promise) {
        try {
            List<InstalledAppsHelper.AppInfo> apps = InstalledAppsHelper.getInstalledApps(getReactApplicationContext());
            WritableArray result = Arguments.createArray();

            for (InstalledAppsHelper.AppInfo app : apps) {
                WritableMap appMap = Arguments.createMap();
                appMap.putString("packageName", app.packageName);
                appMap.putString("appName", app.appName);
                // Convert icon to base64 if needed
                result.pushMap(appMap);
            }

            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void startVPN(ReadableMap config, Promise promise) {
        try {
            // Request VPN permission if needed
            Intent intent = VpnService.prepare(getReactApplicationContext());
            if (intent != null) {
                promise.reject("PERMISSION_REQUIRED", "VPN permission required");
                return;
            }

            // Start VPN service
            Intent vpnIntent = new Intent(getReactApplicationContext(), KuzaVpnService.class);
            vpnIntent.putExtra("config", config.toHashMap());
            getReactApplicationContext().startService(vpnIntent);

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("START_ERROR", e.getMessage());
        }
    }
}
```


UI:

Android: show installed apps list → allow selection.

iOS: show “apps” but actually map to domains → route only those domains.

⚠️ Notes

iOS: True per-app VPN is not possible without MDM. Use domain/IP filtering instead.

Android: Full per-app VPN is supported.

Keep routing lists updated (apps often change domains).

Make sure to handle user permissions (BIND_VPN_SERVICE on Android, entitlements on iOS).

Optimize for battery usage — VPN services drain power if not carefully managed.
