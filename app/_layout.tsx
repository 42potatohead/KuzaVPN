import GlobalProvider from "@/lib/global-provider";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "./global.css";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Sora-Regular": require("../assets/fonts/Sora-Regular.ttf"),
    "Sora-Bold": require("../assets/fonts/Sora-Bold.ttf"),
    "Sora-ExtraBold": require("../assets/fonts/Sora-ExtraBold.ttf"),
    "Sora-SemiBold": require("../assets/fonts/Sora-SemiBold.ttf"),
    "Sora-Light": require("../assets/fonts/Sora-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GlobalProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </GlobalProvider>
    </SafeAreaProvider>
  );
}
