import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PremiumScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = [
    {
      id: 'daily',
      price: '$0.99',
      period: 'Daily',
      savings: null,
    },
    {
      id: 'weekly',
      price: '$1.99',
      period: 'Weekly',
      savings: null,
    },
    {
      id: 'monthly',
      price: '$9.99',
      period: 'Monthly',
      savings: 'Most Popular',
    },
    {
      id: 'yearly',
      price: '$99.99',
      period: 'Yearly',
      savings: 'Save 15%',
    },
  ];

  const handleUpgrade = () => {
    // Handle upgrade logic here
    console.log('Upgrading to:', selectedPlan);
    router.back();
  };

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

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Access all servers worldwide and get unlimited bandwidth,{'\n'}
            fast and powerful!
          </Text>
        </View>

        {/* Plan Selection */}
        <View style={styles.planSection}>
          <Text style={styles.planSectionTitle}>CHOOSE YOUR PLAN</Text>

          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlanCard
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <View style={styles.planContent}>
                  <Text style={[
                    styles.planPrice,
                    selectedPlan === plan.id && styles.selectedPlanText
                  ]}>
                    {plan.price}
                  </Text>
                  <Text style={[
                    styles.planPeriod,
                    selectedPlan === plan.id && styles.selectedPlanText
                  ]}>
                    {plan.period}
                  </Text>
                </View>

                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>{plan.savings}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Features Include:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Access to all global servers</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Unlimited bandwidth</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>No ads</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Priority customer support</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>Advanced security features</Text>
            </View>
          </View>
        </View>

        {/* Upgrade Button */}
        <View style={styles.upgradeSection}>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
          >
            <Text style={styles.upgradeButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By upgrading, you agree to our Terms of Service and Privacy Policy.
            Subscription automatically renews unless cancelled 24 hours before renewal.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  planSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  planSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#14b8a6',
    backgroundColor: '#14b8a6',
  },
  planContent: {
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  planPeriod: {
    fontSize: 16,
    color: '#6b7280',
  },
  selectedPlanText: {
    color: 'white',
  },
  savingsBadge: {
    position: 'absolute',
    top: -6,
    right: 16,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  featuresSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    color: '#14b8a6',
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
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
    fontSize: 18,
    fontWeight: '600',
  },
  termsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PremiumScreen;
