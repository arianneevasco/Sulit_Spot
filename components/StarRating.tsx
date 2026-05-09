import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  value: number | null;
  average?: number;
  count?: number;
  onRate?: (v: number) => void;
  size?: number;
};

export default function StarRating({
  value,
  average,
  count,
  onRate,
  size = 22,
}: Props) {
  const display = value ?? Math.round(average ?? 0);
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate?.(star)}
          disabled={!onRate}
          activeOpacity={0.7}
        >
          <Text style={[s.star, { fontSize: size }]}>
            {star <= display ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      ))}
      {average !== undefined && count !== undefined && count > 0 && (
        <Text style={s.label}>
          {average.toFixed(1)} ({count})
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2 },
  star: { color: "#F6A94A" },
  label: { fontSize: 13, color: "#888", marginLeft: 6 },
});
