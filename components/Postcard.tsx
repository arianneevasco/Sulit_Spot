import { CATEGORY_COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Post = {
  id: string;
  title: string;
  category: string;
  priceRange?: string;
  locationText: string;
  description?: string;
  ratingAverage?: number;
  timeHint?: string;
  isOutdated?: boolean;
};

type Props = { post: Post; onPress: () => void };

export default function PostCard({ post, onPress }: Props) {
  const badgeColor = (CATEGORY_COLORS as any)[post.category] ?? "#aaa";
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={s.row}>
        <Text style={s.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={[s.badge, { backgroundColor: badgeColor }]}>
          <Text style={s.badgeText}>{post.category}</Text>
        </View>
      </View>
      {(post.ratingAverage ?? 0) > 0 && (
        <View style={s.ratingRow}>
          <Ionicons name="star" size={11} color="#F6A94A" />
          <Text style={s.ratingText}> {post.ratingAverage?.toFixed(1)}</Text>
        </View>
      )}
      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Ionicons name="location-outline" size={13} color="#888" />
          <Text style={s.metaText}>{post.locationText}</Text>
        </View>
        {post.priceRange ? (
          <View style={s.metaItem}>
            <Text style={s.peso}>₱</Text>
            <Text style={s.metaText}>{post.priceRange}</Text>
          </View>
        ) : null}
        {post.timeHint ? (
          <View style={s.metaItem}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={s.metaText}>{post.timeHint}</Text>
          </View>
        ) : null}
      </View>
      {post.isOutdated && (
        <View style={s.outdatedTag}>
          <Text style={s.outdatedText}>⚠ May be outdated</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 20,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  ratingText: { fontSize: 11, color: "#888" },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: "#666" },
  peso: { fontSize: 12, fontWeight: "700", color: "#888" },
  outdatedTag: {
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  outdatedText: { fontSize: 11, color: "#92400E", fontWeight: "500" },
});
