import DefaultButton from '@/components/ui/DefaultButton';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSignup = () => {
    // Handle signup logic here
    // For now, just navigate to the main app
    router.replace('/(root)/(tabs)');
  };

  const handleUseWithoutAccount = () => {
    // Navigate to main app without signup
    router.replace('/(root)/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-[14px]">
      <ScrollView className="flex-1 pt-4">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-n-dark-darkest font-Sora-ExtraBold text-[24px] mb-2">Sign up</Text>
          <Text className="text-n-dark-dark font-Sora-Regular text-[16px]">Ready to explore the internet?</Text>
        </View>

        {/* Form */}
        <View className="gap-4">{/* Changed from space-y-6 to gap-4 for 16px gap */}
          {/* Name Input */}
          <View>
            <Text className="text-n-dark-darkest font-Sora-SemiBold text-[14px] mb-2">Name</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-black ${
                focusedInput === 'name' ? 'border-highlight-darkest' : 'border-gray-300'
              }`}
              placeholder="Sara"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Email Input */}
          <View>
            <Text className="text-n-dark-darkest font-Sora-SemiBold text-[14px] mb-2">Email Address</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-black ${
                focusedInput === 'email' ? 'border-highlight-darkest' : 'border-gray-300'
              }`}
              placeholder="name@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-n-dark-darkest font-Sora-SemiBold text-[14px] mb-2">Password</Text>
            <View className="relative">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-black pr-12"
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                secureTextEntry
              />
              {/* Eye icon placeholder */}
              <TouchableOpacity className="absolute right-4 top-3">
                <Text className="text-n-dark-light">👁</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <View className="flex-row items-start gap-3">
            <TouchableOpacity
              className={`w-5 h-5 border-2 rounded ${
                agreedToTerms ? 'bg-highlight-darkest border-highlight-darkest' : 'border-n-light-light'
              } justify-center items-center mt-1`}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              {agreedToTerms && (
                <Text className="text-n-light-lightest text-xs">✓</Text>
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-n-dark-dark font-Sora-Regular text-[14px] leading-5">
                I've read and agree with the{' '}
                <Text className="text-highlight-darkest underline">Terms and Conditions</Text>
                {' '}and the{' '}
                <Text className="text-highlight-darkest underline">Privacy Policy</Text>.
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View className="mt-8 gap-4">
          <DefaultButton
            text="Sign Up"
            onPress={handleSignup}
          />

          <TouchableOpacity onPress={handleUseWithoutAccount}>
            <Text className="text-n-dark-dark text-center font-Sora-Regular text-[14px]">
              Use without an account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;
