import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SigninScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignin = () => {
    // Handle signin logic here
    // For now, just navigate to the main app
    router.replace('/(root)/(tabs)');
  };

  const handleSignup = () => {
    router.push('./signup');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-black text-3xl font-bold mb-2">Sign in</Text>
          <Text className="text-gray-600 text-base">Welcome back to KuzaVPN!</Text>
        </View>

        {/* Form */}
        <View className="space-y-6">
          {/* Email Input */}
          <View>
            <Text className="text-black font-semibold mb-2">Email Address</Text>
            <TextInput
              className="border-2 border-teal-600 rounded-lg px-4 py-3 text-black"
              placeholder="name@email.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-black font-semibold mb-2">Password</Text>
            <View className="relative">
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-black pr-12"
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              {/* Eye icon placeholder */}
              <TouchableOpacity className="absolute right-4 top-3">
                <Text className="text-gray-400">👁</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity>
            <Text className="text-teal-600 text-right text-base underline">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View className="mt-8 space-y-4">
          <TouchableOpacity
            className={`rounded-full py-4 px-8 ${
              email && password ? 'bg-teal-600' : 'bg-gray-300'
            }`}
            onPress={handleSignin}
            disabled={!email || !password}
          >
            <Text className={`text-center font-semibold text-lg ${
              email && password ? 'text-white' : 'text-gray-500'
            }`}>
              Sign In
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center">
            <Text className="text-gray-600 text-base">
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignup}>
              <Text className="text-teal-600 text-base underline">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SigninScreen;
