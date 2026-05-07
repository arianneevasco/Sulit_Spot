import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function IndexRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1B5E37" />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  return <Redirect href="/login" />;
}
