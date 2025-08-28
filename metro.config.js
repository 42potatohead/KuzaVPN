const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configure source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'];

// Watch iOS module directory for cross-platform development
config.watchFolders = [
  path.resolve(__dirname, 'modules/vpn-module/ios'),
];

// Resolve modules directory for iOS native modules
config.resolver.alias = {
  '@modules': path.resolve(__dirname, 'modules'),
};

module.exports = withNativeWind(config, { input: './app/global.css' });
