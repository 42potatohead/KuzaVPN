import { useVPN } from '@/lib/vpn-context';
import { router } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const {
    vpnStatus,
    selectedApps,
    availableApps,
    connectVPN,
    disconnectVPN,
    setEncryptAll,
    setCustomSelection,
    bandwidthStats,
    bandwidthLimit,
    toggleAppSelection,
    isLoading,
    selectionMode
  } = useVPN();

  // Get apps to display on home page (top 3 most popular or available apps)
  const getHomePageApps = () => {
    if (selectionMode === 'encrypt-all') {
      // Show first 3 available apps when encrypting all
      return availableApps.slice(0, 3);
    } else {
      // Show selected apps, up to 3
      return selectedApps.slice(0, 3);
    }
  };

  // Check if an app is selected (only relevant in custom mode)
  const isAppSelected = (app: any) => {
    return selectedApps.some(selectedApp => selectedApp.packageName === app.packageName);
  };

  // Helper function to format bandwidth with unit
  const formatBandwidth = (bytes: number): { value: string, unit: string } => {
    if (bytes === 0) return { value: '0', unit: 'B' };

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2)).toString();
    const unit = sizes[i] || 'GB';

    return { value, unit };
  };

  // Get current bandwidth usage
  const getCurrentBandwidth = () => {
    if (!bandwidthStats) return { value: '0', unit: 'B' };
    return formatBandwidth(bandwidthStats.totalBytes);
  };

  // Get bandwidth limit in readable format
  const getBandwidthLimit = () => {
    return formatBandwidth(bandwidthLimit);
  };

  const handleVPNToggle = async () => {
    try {
      if (vpnStatus === 'connected') {
        await disconnectVPN();
      } else {
        await connectVPN();
      }
    } catch (error) {
      console.error('VPN toggle failed:', error);
    }
  };

  const handleEncryptAllToggle = () => {
    if (selectionMode === 'encrypt-all') {
      setCustomSelection();
    } else {
      setEncryptAll();
    }
  };

  const getConnectionButtonText = () => {
    switch (vpnStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return 'Disconnect';
      default:
        return 'Connect with Adblock';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-n-light-light">
      <ImageBackground source={require('@/assets/images/app/hatch-fadded.png')} className="absolute inset-0 w-100% h-100%" />
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <TouchableOpacity className="bg-white rounded-[14px] p-4 shadow-md">
            <Image
              source={require('@/assets/images/app/menu-icon.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-highlight-darkest rounded-[14px] p-4 shadow-lg"
            onPress={() => router.push('/pages/premium' as any)}
          >
            <Image
              source={require('@/assets/images/app/crown.png')}
              className="w-6 h-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Bandwidth Usage Card */}
        <View className="mx-6 mb-6 bg-white rounded-2xl p-6 shadow-md">
          <Text className="text-gray-500 text-center mb-2">Used Bandwidth</Text>
          <Text className="text-3xl font-light text-center text-gray-400">
            {getCurrentBandwidth().value} {getCurrentBandwidth().unit} / {getBandwidthLimit().value} {getBandwidthLimit().unit}
          </Text>
        </View>

        {/* Connection Button */}
        <View className="mx-6 mb-6">
          <TouchableOpacity
            className={`rounded-[160px] py-4 px-8 shadow-lg ${
              vpnStatus === 'connected'
                ? 'bg-highlight-darkest'
                : vpnStatus === 'connecting'
                ? 'bg-highlight-dark'
                : 'bg-white'
            }`}
            style={{
              borderWidth: 2,
              borderColor: vpnStatus === 'connected' ? 'transparent' : '#0f7a70',
            }}
            onPress={handleVPNToggle}
            disabled={vpnStatus === 'connecting'}
          >
            <View className="flex-col justify-center items-center">
              <Image
                source={require('@/assets/images/app/power.png')}
                className="w-6 h-6 mb-2"
                style={{
                  tintColor: vpnStatus === 'connected' ? 'white' : '#0f7a70'
                }}
                resizeMode="contain"
              />
              <Text className={`font-semibold text-lg ${
                vpnStatus === 'connected'
                  ? 'text-white'
                  : vpnStatus === 'connecting'
                  ? 'text-white'
                  : 'text-highlight-darkest'
              }`}>
                {getConnectionButtonText()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mode Selection */}
        <View className="mx-6 mb-6">
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-3 px-6 rounded-l-[8px] ${
                selectionMode === 'encrypt-all' ? 'bg-highlight-darkest' : 'bg-gray-200'
              }`}
              onPress={() => selectionMode !== 'encrypt-all' && handleEncryptAllToggle()}
            >
              <Text className={`text-center font-semibold ${
                selectionMode === 'encrypt-all' ? 'text-white' : 'text-gray-600'
              }`}>
                Encrypt All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-6 rounded-r-[8px] ${
                selectionMode === 'custom' ? 'bg-highlight-darkest' : 'bg-highlight-lightest'
              }`}
              onPress={() => selectionMode === 'encrypt-all' && handleEncryptAllToggle()}
            >
              <Text className={`text-center font-semibold ${
                selectionMode === 'custom' ? 'text-white' : 'text-gray-600'
              }`}>
                Custom Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App List */}
        <View className="mx-6 mb-6 bg-white rounded-2xl shadow-md overflow-hidden">
          {/* App Preview List */}
          {getHomePageApps().length > 0 ? (
            getHomePageApps().map((app, index) => (
              <View key={app.packageName || index} className={`flex-row items-center justify-between px-6 py-4 ${index < getHomePageApps().length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row items-center">
                  {app.iconBase64 ? (
                    <View className="w-10 h-10 rounded-lg mr-3 overflow-hidden">
                      <Image
                        source={{ uri: `data:image/png;base64,${app.iconBase64}` }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View className="w-10 h-10 bg-blue-500 rounded-lg items-center justify-center mr-3">
                      <Text className="text-white font-bold text-lg">
                        {app.appName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text className="font-medium text-gray-900">{app.appName}</Text>
                </View>
                <Switch
                  value={selectionMode === 'encrypt-all' ? true : isAppSelected(app)}
                  onValueChange={() => {
                    if (selectionMode === 'custom') {
                      toggleAppSelection(app);
                    }
                  }}
                  disabled={selectionMode === 'encrypt-all'}
                  trackColor={{ false: '#D1D5DB', true: '#14B8A6' }}
                  thumbColor={'#ffffff'}
                  ios_backgroundColor="#D1D5DB"
                />
              </View>
            ))
          ) : (
            <View className="px-6 py-8 items-center">
              {isLoading ? (
                <Text className="text-gray-500">Loading apps...</Text>
              ) : (
                <Text className="text-gray-500">No apps available</Text>
              )}
            </View>
          )}

          {/* View All Apps Button */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 bg-gray-50"
            onPress={() => router.push('/pages/app-selector' as any)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-highlight-darkest rounded-lg items-center justify-center mr-3">
                <Image source={require('@/assets/images/app/hamburger-menu.png')} />
              </View>
              <Text className="font-medium text-gray-900">
                {selectionMode === 'encrypt-all' ? 'View All Apps' : `Manage Apps (${selectedApps.length} selected)`}
              </Text>
            </View>
            <Text className="text-gray-400 text-xl">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Server Selection - Fixed at bottom */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className="bg-white rounded-2xl p-6 flex-row items-center justify-between shadow-md"
          onPress={() => router.push('/pages/server-selection' as any)}
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-3">🇩🇪</Text>
            <Text className="font-medium text-gray-900">Germany</Text>
          </View>
          <Text className="text-gray-400 text-xl">^</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
