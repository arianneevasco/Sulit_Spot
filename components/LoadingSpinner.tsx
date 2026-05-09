import { PRIMARY } from "@/constants/theme";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function LoadingSpinner() {
  return (
    <View style={s.wrap}>
      <ActivityIndicator size="large" color={PRIMARY} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", alignItems: "center" },
});
