import { useVPN } from '@/lib/vpn-context';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Home() {
  const {
    vpnStatus,
    selectedApps,
    connectVPN,
    disconnectVPN,
    setEncryptAll,
    setCustomSelection,
    bandwidthStats,
    bandwidthLimit
  } = useVPN();

  const [isEncryptAll, setIsEncryptAll] = useState(true);

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
    if (isEncryptAll) {
      setCustomSelection();
    } else {
      setEncryptAll();
    }
    setIsEncryptAll(!isEncryptAll);
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
                isEncryptAll ? 'bg-highlight-darkest' : 'bg-gray-200'
              }`}
              onPress={() => !isEncryptAll && handleEncryptAllToggle()}
            >
              <Text className={`text-center font-semibold ${
                isEncryptAll ? 'text-white' : 'text-gray-600'
              }`}>
                Encrypt All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 py-3 px-6 rounded-r-[8px] ${
                !isEncryptAll ? 'bg-highlight-darkest' : 'bg-highlight-lightest'
              }`}
              onPress={() => isEncryptAll && handleEncryptAllToggle()}
            >
              <Text className={`text-center font-semibold ${
                !isEncryptAll ? 'text-white' : 'text-gray-600'
              }`}>
                Custom Selection
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App List */}
        <View className="mx-6 mb-6 bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Popular Apps Preview */}
          {selectedApps.slice(0, 4).map((app, index) => (
            <View key={app.packageName || index} className={`flex-row items-center justify-between px-6 py-4 ${index < 3 ? 'border-b border-gray-100' : ''}`}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-yellow-400 rounded-lg items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">S</Text>
                </View>
                <Text className="font-medium text-gray-900">{app.appName}</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: '#D1D5DB', true: '#14B8A6' }}
                thumbColor={'#ffffff'}
                ios_backgroundColor="#D1D5DB"
              />
            </View>
          ))}

          {/* View All Apps Button */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-6 py-4 bg-gray-50"
            onPress={() => router.push('/pages/app-selector' as any)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-highlight-darkest rounded-lg items-center justify-center mr-3">
                <Image source={require('@/assets/images/app/hamburger-menu.png')} />
              </View>
              <Text className="font-medium text-gray-900">View All Apps</Text>
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
