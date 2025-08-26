const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add native modules to the watchFolders
config.watchFolders = [
  ...config.watchFolders,
  path.resolve(__dirname, 'modules/vpn-module/android'),
  path.resolve(__dirname, 'modules/vpn-module/ios'),
];

// Add native module resolution
config.resolver.platforms = [...config.resolver.platforms, 'native', 'android', 'ios'];

// Add alias for native modules
config.resolver.alias = {
  ...config.resolver.alias,
  '@kuza-vpn/native': path.resolve(__dirname, 'modules/vpn-module'),
};

// Configure source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'];

module.exports = withNativeWind(config, { input: './app/global.css' });
