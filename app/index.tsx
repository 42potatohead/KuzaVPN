import { useGlobalContext } from '@/lib/global-provider';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { loading, isLogged } = useGlobalContext();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#808080" />
      </View>
    );
  }

  if (isLogged) {
    return <Redirect href="/(root)/(tabs)" />;
  }

  return <Redirect href="/welcomescreen" />;
}
