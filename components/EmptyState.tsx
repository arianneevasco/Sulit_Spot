import { PRIMARY } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon = "document-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={s.wrap}>
      <Ionicons name={icon as any} size={48} color="#ddd" />
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.sub}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  title: { fontSize: 15, color: "#bbb", fontWeight: "600" },
  sub: { fontSize: 13, color: "#ccc", textAlign: "center" },
  btn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
