import { useVPN } from '@/lib/vpn-context';
import { AppInfo } from '@/lib/VPNModule';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const AppSelectorScreen = () => {
  const { availableApps, selectedApps, toggleAppSelection, isLoading, connectVPN } = useVPN();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApps = availableApps.filter(app =>
    app.appName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAppSelected = (app: AppInfo) => {
    return selectedApps.some(selectedApp => selectedApp.packageName === app.packageName);
  };

  const handleConnect = async () => {
    try {
      await connectVPN();
      router.back();
    } catch (error) {
      console.error('Failed to connect VPN:', error);
    }
  };

  const renderApp = ({ item }: { item: AppInfo }) => {
    const isSelected = isAppSelected(item);

    return (
      <TouchableOpacity
        style={styles.appItem}
        onPress={() => toggleAppSelection(item)}
      >
        <View style={styles.appInfo}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>📱</Text>
          </View>
          <Text style={styles.appName}>{item.appName}</Text>
        </View>
        <Switch
          value={isSelected}
          onValueChange={() => toggleAppSelection(item)}
          trackColor={{ false: '#767577', true: '#14B8A6' }}
          thumbColor={'#ffffff'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Apps for VPN</Text>
        <View style={styles.placeholder} />
      </View>

      <Text style={styles.subtitle}>
        Choose which apps should use the VPN connection
      </Text>

      <FlatList
        data={filteredApps}
        renderItem={renderApp}
        keyExtractor={(item) => item.packageName || item.bundleId || item.appName}
        style={styles.appsList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
        >
          <Text style={styles.connectButtonText}>
            Connect VPN ({selectedApps.length} apps)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    fontSize: 24,
    color: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 24,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  appsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  bottomSection: {
    padding: 24,
  },
  connectButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  connectButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppSelectorScreen;
