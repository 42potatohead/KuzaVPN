import { useGlobalContext } from '@/lib/global-provider';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const { user, logout } = useGlobalContext();

  const menuItems = [
    {
      icon: '⚙️',
      title: 'Preferences',
      subtitle: 'Caption',
      onPress: () => {},
    },
    {
      icon: '🚀',
      title: 'Speed Test',
      subtitle: 'Caption',
      onPress: () => {},
    },
    {
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Caption',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Status */}
        <View style={styles.subscriptionCard}>
          <View style={styles.circularProgress}>
            <View style={styles.progressCircle}>
              <Text style={styles.expiryText}>Expire</Text>
              <Text style={styles.daysLeft}>248</Text>
              <Text style={styles.daysLabel}>Days</Text>
            </View>
          </View>

          <Text style={styles.securityTitle}>Your are secured Until</Text>
          <Text style={styles.expiryDate}>Oct 22nd, 2021</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Text style={styles.menuIconText}>{item.icon}</Text>
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upgrade Button */}
        <View style={styles.upgradeSection}>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push('./premium')}
          >
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.appVersion}>App version 1.2.2</Text>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={logout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
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
  subscriptionCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
  },
  circularProgress: {
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#14b8a6',
    borderTopColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  daysLeft: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  daysLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 16,
    color: '#6b7280',
  },
  menuContainer: {
    marginHorizontal: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chevron: {
    fontSize: 20,
    color: '#9ca3af',
  },
  upgradeSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  upgradeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  appVersion: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 24,
  },
  logoutSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  logoutButtonText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
