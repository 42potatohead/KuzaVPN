import DefaultButton from '@/components/ui/DefaultButton';
import { router } from 'expo-router';
import React from 'react';
import { Image, ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WelcomeScreen = () => {
  return (
	<SafeAreaView className="flex h-full bg-n-light-dark px-[14px]">
		<ImageBackground source={require('@/assets/images/app/background.png')} className="absolute inset-0 w-100% h-100%" />
		<View className="flex-2 pt-4 justify-center items-center">
			<Text className="text-highlight-darkest font-Sora-Bold text-[24px]">KuzaVPN</Text>
		</View>
		<View className="flex-1 m-auto gap-[7px] justify-center items-center w-full">
			<Text className="text-center text-n-dark-darkest font-Sora-ExtraBold text-[24px]">Unlock the Internet</Text>
			<Image
				source={require('@/assets/images/app/logo.png')}
				className="w-[209px] h-[241px]"
				resizeMode="contain"
			/>
			<Text className="text-center text-n-dark-darkest font-Sora-Regular text-[16px]">Protect your privacy, browse faster, and unlock the full power of the internet. Let’s get you connected in seconds.</Text>

			<DefaultButton text="Let's Start!" onPress={() => {
				router.push("./onboarding")
			}} />

				<TouchableOpacity onPress={() => {
					router.push("./signin")
				}}>
					<Text className="text-center text-n-dark-darkest font-inter-regular text-[14px]">
				Already have an account?
			</Text>
				</TouchableOpacity>
		</View>
	</SafeAreaView>
  )
}

export default WelcomeScreen;
