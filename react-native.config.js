module.exports = {
  // Native module configuration for KuzaVPN
  dependencies: {
    'kuza-vpn-native': {
      platforms: {
        android: {
          sourceDir: './modules/vpn-module/android',
          packageImportPath: 'com.kuzavpn.native',
          buildTypes: ['debug', 'release']
        },
        ios: {
          project: './modules/vpn-module/ios/KuzaVpnModule.xcodeproj',
          podspecPath: './modules/vpn-module/ios/KuzaVpnModule.podspec'
        }
      }
    }
  },

  // Project configuration
  project: {
    ios: {
      project: './ios/KuzaVPN.xcodeproj'
    },
    android: {
      sourceDir: './android',
      manifestPath: './android/app/src/main/AndroidManifest.xml'
    }
  },

  // Assets configuration
  assets: ['./assets/fonts/'],

  // Commands configuration
  commands: [
    {
      name: 'build-native',
      description: 'Build native modules for both platforms',
      func: () => {
        console.log('Building native modules...');
        // Add custom build logic here if needed
      }
    }
  ]
};
