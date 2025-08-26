import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Server {
  id: string;
  country: string;
  city: string;
  flag: string;
  ping: number;
  load: number;
}

const ServerSelectionScreen = () => {
  const [selectedServer, setSelectedServer] = useState('germany-berlin');

  const servers: Server[] = [
    {
      id: 'germany-berlin',
      country: 'Germany',
      city: 'Berlin',
      flag: '🇩🇪',
      ping: 12,
      load: 35,
    },
    {
      id: 'usa-newyork',
      country: 'United States',
      city: 'New York',
      flag: '🇺🇸',
      ping: 45,
      load: 67,
    },
    {
      id: 'uk-london',
      country: 'United Kingdom',
      city: 'London',
      flag: '🇬🇧',
      ping: 23,
      load: 42,
    },
    {
      id: 'japan-tokyo',
      country: 'Japan',
      city: 'Tokyo',
      flag: '🇯🇵',
      ping: 89,
      load: 28,
    },
    {
      id: 'canada-toronto',
      country: 'Canada',
      city: 'Toronto',
      flag: '🇨🇦',
      ping: 56,
      load: 51,
    },
    {
      id: 'australia-sydney',
      country: 'Australia',
      city: 'Sydney',
      flag: '🇦🇺',
      ping: 134,
      load: 39,
    },
    {
      id: 'singapore',
      country: 'Singapore',
      city: 'Singapore',
      flag: '🇸🇬',
      ping: 78,
      load: 44,
    },
    {
      id: 'netherlands-amsterdam',
      country: 'Netherlands',
      city: 'Amsterdam',
      flag: '🇳🇱',
      ping: 18,
      load: 33,
    },
  ];

  const handleServerSelect = (serverId: string) => {
    setSelectedServer(serverId);
  };

  const handleConnect = () => {
    // Handle server connection
    router.back();
  };

  const getLoadColor = (load: number) => {
    if (load < 40) return '#10b981'; // Green
    if (load < 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const renderServer = ({ item }: { item: Server }) => {
    const isSelected = selectedServer === item.id;

    return (
      <TouchableOpacity
        style={[styles.serverItem, isSelected && styles.selectedServerItem]}
        onPress={() => handleServerSelect(item.id)}
      >
        <View style={styles.serverInfo}>
          <View style={styles.flagContainer}>
            <Text style={styles.flag}>{item.flag}</Text>
          </View>

          <View style={styles.serverDetails}>
            <Text style={[styles.countryName, isSelected && styles.selectedText]}>
              {item.country}
            </Text>
            <Text style={[styles.cityName, isSelected && styles.selectedSubtext]}>
              {item.city}
            </Text>
          </View>
        </View>

        <View style={styles.serverStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isSelected && styles.selectedText]}>
              {item.ping}ms
            </Text>
            <Text style={[styles.statLabel, isSelected && styles.selectedSubtext]}>
              Ping
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.loadContainer}>
              <View
                style={[
                  styles.loadBar,
                  { width: `${item.load}%`, backgroundColor: getLoadColor(item.load) }
                ]}
              />
            </View>
            <Text style={[styles.statLabel, isSelected && styles.selectedSubtext]}>
              {item.load}% Load
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Server</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={servers}
        renderItem={renderServer}
        keyExtractor={(item) => item.id}
        style={styles.serversList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.serversContainer}
      />

      <View style={styles.connectSection}>
        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
        >
          <Text style={styles.connectButtonText}>Connect to Selected Server</Text>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  serversList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  serversContainer: {
    paddingBottom: 24,
  },
  serverItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedServerItem: {
    backgroundColor: '#14b8a6',
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 32,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flag: {
    fontSize: 18,
  },
  serverDetails: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedText: {
    color: 'white',
  },
  selectedSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  serverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadContainer: {
    width: 30,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 4,
  },
  loadBar: {
    height: '100%',
    borderRadius: 2,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  connectSection: {
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

export default ServerSelectionScreen;
