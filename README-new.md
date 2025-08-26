# KuzaVPN - WireGuard VPN with Per-App Routing

A modern React Native VPN application built with Expo, featuring WireGuard protocol integration and per-app routing capabilities for Android and iOS.

## 🚀 Features

### Core VPN Functionality
- **WireGuard Integration**: Modern, fast, and secure VPN protocol
- **Per-App Routing**: Select specific apps to route through VPN (Android native support)
- **Domain-Based Routing**: iOS implementation using domain filtering for app-specific routing
- **Real-time Status**: Live VPN connection status and bandwidth monitoring
- **Native Performance**: Platform-specific implementations for optimal performance

### User Interface
- **Modern Design**: Clean, intuitive interface with custom styling
- **App Selection**: Easy toggle interface for selecting apps to protect
- **Bandwidth Monitoring**: Real-time data usage tracking
- **Server Selection**: Multiple VPN server locations
- **Dark/Light Theme**: Adaptive UI design

### Platform Support
- **Android**: True per-app VPN using `VpnService` and `addAllowedApplication()`
- **iOS**: Domain-based routing using Network Extensions and packet filtering
- **Cross-Platform**: Unified React Native interface with platform-specific native modules

## 📱 Technology Stack

### Frontend
- **React Native 0.79.5**: Cross-platform mobile development
- **Expo 53**: Managed workflow with custom native modules
- **TypeScript**: Type-safe development
- **NativeWind**: Tailwind CSS for React Native styling
- **Expo Router**: File-based navigation system

### Native Modules
- **Android**: Java-based VPN service with WireGuard library
- **iOS**: Swift-based Network Extension with WireGuardKit
- **Bridge**: React Native bridge for seamless integration

### VPN Technology
- **WireGuard Protocol**: Modern VPN implementation
- **Per-App Routing**: Application-level traffic control
- **Bandwidth Monitoring**: Real-time data usage tracking
- **Secure Key Management**: Proper cryptographic key handling

## 🏗️ Architecture

### Project Structure
```
KuzaVPN/
├── app/                          # Expo Router pages
│   ├── (root)/(tabs)/           # Main app screens
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Welcome screen
├── lib/                         # Core business logic
│   ├── VPNModule.ts            # Main VPN interface
│   ├── vpn-context.tsx         # React context for VPN state
│   └── index.ts                # Library exports
├── modules/vpn-module/         # Native module implementations
│   ├── android/                # Android VPN service
│   │   ├── KuzaVpnService.java # VPN service implementation
│   │   ├── KuzaVpnModule.java  # React Native bridge
│   │   └── InstalledAppsHelper.java # App enumeration
│   └── ios/                    # iOS Network Extension
│       ├── KuzaVpnModule.swift # Main iOS bridge
│       ├── KuzaVpnTunnelProvider.swift # Packet tunnel
│       └── AppDomainMapper.swift # App-to-domain mapping
└── components/                 # Reusable UI components
```

### Native Module Architecture

#### Android Implementation
```java
// VPN Service with WireGuard integration
KuzaVpnService extends VpnService {
    // Per-app routing using addAllowedApplication()
    // WireGuard tunnel management
    // Bandwidth monitoring
}

// React Native Bridge
KuzaVpnModule extends ReactContextBaseJavaModule {
    // Expose VPN functionality to React Native
    // Handle permission requests
    // Manage app selection
}
```

#### iOS Implementation
```swift
// Network Extension Tunnel Provider
KuzaVpnTunnelProvider: NEPacketTunnelProvider {
    // WireGuard integration using WireGuardKit
    // Domain-based routing for app filtering
    // Packet inspection and filtering
}

// React Native Bridge
KuzaVpnModule: RCTEventEmitter {
    // Bridge VPN functionality to React Native
    // Handle iOS-specific limitations
    // Manage tunnel provider lifecycle
}
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)
- Expo CLI

### Quick Start
```bash
# Clone the repository
git clone https://github.com/kuzavpn/KuzaVPN.git
cd KuzaVPN

# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platforms
npx expo start --android
npx expo start --ios
```

### Building Native Modules

#### Android Setup
```bash
# Build Android native module
cd modules/vpn-module/android
./gradlew assembleDebug

# Or use project scripts
npm run native:android
```

#### iOS Setup
```bash
# Install CocoaPods dependencies
cd ios && pod install

# Build iOS project
xcodebuild -workspace KuzaVPN.xcworkspace -scheme KuzaVPN -configuration Debug

# Or use project scripts
npm run native:ios
```

### WireGuard Dependencies

#### Android
Add to `modules/vpn-module/android/build.gradle`:
```gradle
dependencies {
    implementation 'com.wireguard.android:tunnel:1.0.20230706'
}
```

#### iOS
Add to `modules/vpn-module/ios/KuzaVpnModule.podspec`:
```ruby
s.dependency "WireGuardKit", "~> 1.0"
```

## 🔧 Configuration

### VPN Server Setup
```typescript
// Example WireGuard configuration
const vpnConfig: VPNConfig = {
  serverEndpoint: "your-server.com:51820",
  publicKey: "SERVER_PUBLIC_KEY_HERE",
  privateKey: "CLIENT_PRIVATE_KEY_HERE",
  allowedIPs: ["0.0.0.0/0"], // Route all traffic
  dns: ["1.1.1.1", "8.8.8.8"]
};
```

### App Selection
```typescript
// Select specific apps for VPN routing
const selectedApps: AppInfo[] = [
  {
    packageName: "com.snapchat.android",
    appName: "Snapchat",
    isSystemApp: false
  },
  // ... more apps
];

// Start VPN with selected apps
await KuzaVPN.startVPN(vpnConfig, selectedApps);
```

## 📱 Usage

### Basic VPN Operations
```typescript
import { KuzaVPN, VPNConfig, AppInfo } from './lib';

// Request VPN permission (required first)
const hasPermission = await KuzaVPN.requestVPNPermission();

// Get installed apps
const apps = await KuzaVPN.getInstalledApps();

// Create VPN configuration
const config = KuzaVPN.createWireGuardConfig(
  "server.com:51820",
  "SERVER_PUBLIC_KEY",
  "CLIENT_PRIVATE_KEY"
);

// Start VPN with selected apps
await KuzaVPN.startVPN(config, selectedApps);

// Monitor VPN status
const status = await KuzaVPN.getVPNStatus(); // 'connected' | 'disconnected' | 'connecting'

// Get bandwidth statistics
const stats = await KuzaVPN.getBandwidthStats();

// Stop VPN
await KuzaVPN.stopVPN();
```

### React Context Usage
```tsx
import { VPNProvider, useVPN } from './lib';

function App() {
  return (
    <VPNProvider>
      <VPNDashboard />
    </VPNProvider>
  );
}

function VPNDashboard() {
  const {
    vpnStatus,
    selectedApps,
    connectVPN,
    disconnectVPN,
    toggleAppSelection
  } = useVPN();

  return (
    <View>
      <Text>Status: {vpnStatus}</Text>
      <Button
        title={vpnStatus === 'connected' ? 'Disconnect' : 'Connect'}
        onPress={vpnStatus === 'connected' ? disconnectVPN : connectVPN}
      />
    </View>
  );
}
```

## 🔒 Security Considerations

### WireGuard Security
- Uses state-of-the-art cryptography (ChaCha20, Poly1305, BLAKE2s)
- Perfect forward secrecy
- Minimal attack surface
- Regular security audits

### App Permissions
- **Android**: `BIND_VPN_SERVICE`, `QUERY_ALL_PACKAGES`
- **iOS**: Network Extension entitlements, VPN configuration rights
- Minimal permission model following security best practices

### Key Management
- Secure key generation and storage
- No hardcoded keys in production
- Proper key rotation mechanisms
- Platform-specific secure storage (Keychain/Keystore)

## 🧪 Testing

### Development Testing
```bash
# Run in development mode
npm start

# Test specific platforms
npm run android
npm run ios

# Debug native modules
npm run native:clean
npm run native:android
```

### Production Testing
```bash
# Create production builds
npx expo build:android
npx expo build:ios

# Test native module integration
npm run prebuild
npm run prebuild:clean
```

## 📈 Performance Optimization

### Android Optimizations
- Efficient VPN service lifecycle management
- Optimized packet routing
- Background service optimization
- Battery usage minimization

### iOS Optimizations
- Network Extension efficiency
- Packet tunnel optimization
- Domain filtering performance
- Memory usage optimization

### Cross-Platform
- Lazy loading of native modules
- Efficient state management
- Optimized React Native bridge calls
- Minimal UI re-renders

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make changes and test thoroughly
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Comprehensive testing
- Documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Permission Denied**: Ensure VPN permissions are granted
- **Connection Failed**: Check server configuration and connectivity
- **App Not Listed**: Verify app enumeration permissions on Android

### Getting Help
- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/kuzavpn/KuzaVPN/issues)
- 💬 [Community Discussions](https://github.com/kuzavpn/KuzaVPN/discussions)

## 🔮 Roadmap

### Upcoming Features
- [ ] Multiple server locations
- [ ] Kill switch functionality
- [ ] Split tunneling improvements
- [ ] VPN statistics dashboard
- [ ] Custom DNS configuration
- [ ] Protocol selection (WireGuard/OpenVPN)

### Long-term Goals
- [ ] Enterprise features
- [ ] Advanced security options
- [ ] Performance analytics
- [ ] Cloud configuration sync

---

**Built with ❤️ by the KuzaVPN Team**

*Secure your digital life, one app at a time.*
