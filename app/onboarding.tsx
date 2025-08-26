import DefaultButton from '@/components/ui/DefaultButton';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    {
      title: "Blazing Fast Connection",
      description: "Experience lightning-speed browsing and streaming with just one tap.",
      image: require('@/assets/images/app/fast.png'),
    },
    {
      title: "Security",
      description: "Military-grade encryption keeps your data safe from hackers and trackers.",
      image: require('@/assets/images/app/secure.png'),
    },
    {
      title: "Access Without Borders",
      description: "Connect to global servers and enjoy unrestricted internet anywhere in the world.",
      image: require('@/assets/images/app/unlock.png'),
    },
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('./signup');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <SafeAreaView className="flex h-full bg-n-light-dark px-[14px]">
      <ImageBackground source={require('@/assets/images/app/background.png')} className="absolute inset-0 w-100% h-100%" />
      <View className="flex-2 pt-4 justify-center items-center">
        <Text className="text-highlight-darkest font-Sora-Bold text-[24px]">KuzaVPN</Text>
      </View>
      <View className="flex-1 m-auto gap-[7px] justify-center items-center w-full">
        {/* Illustration */}
        <Image
          source={currentStepData.image}
          className="w-[209px] h-[241px]"
          resizeMode="contain"
        />

        <Text className="text-center text-n-dark-darkest font-Sora-ExtraBold text-[24px] w-[315px]">
          {currentStepData.title}
        </Text>

        <Text className="text-center text-n-dark-darkest font-Sora-Regular text-[16px]">
          {currentStepData.description}
        </Text>

        {/* Progress Indicators */}
        <View className="flex-row justify-center mb-4 gap-[8px]">
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              className={`w-[8px] h-[8px] rounded-full ${index === currentStep ? 'bg-highlight-darkest' : 'bg-n-light-lightest'}`}
            />
          ))}
        </View>

        {/* Buttons */}
        {currentStep < onboardingSteps.length - 1 ? (
          <View className="w-full gap-[12px]">
            <DefaultButton text="Next" onPress={handleNext} />
            {currentStep > 0 && (
              <TouchableOpacity onPress={handlePrevious}>
                <Text className="text-center text-n-dark-darkest font-Sora-Regular text-[14px]">
                  Previous
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="w-full gap-[12px]">
            <DefaultButton text="Start Now!" onPress={handleNext} />
            <TouchableOpacity onPress={handlePrevious}>
              <Text className="text-center text-n-dark-darkest font-Sora-Regular text-[14px]">
                Previous
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;
