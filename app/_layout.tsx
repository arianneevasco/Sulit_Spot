import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";

export default function RootLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useNotifications();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const inPublicRoute = segments[0] === "login" || segments[0] === "register";

    if (!user && inAuthGroup) {
      // Not logged in but trying to access protected tabs → go to login
      router.replace("/login");
    } else if (user && inPublicRoute) {
      // Already logged in but on login/register → go to home
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4ECBA4" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="add" options={{ presentation: "modal" }} />
      <Stack.Screen name="detail" />
      <Stack.Screen name="edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="editprofile" options={{ presentation: "modal" }} />
    </Stack>
  );
}
