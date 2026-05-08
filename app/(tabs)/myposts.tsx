import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY = "#4ECBA4";
const DANGER = "#EF4444";
const GRAY_BG = "#F5F6FA";

const MOCK_MY_POSTS = [
  {
    id: "1",
    title: "Siomai rice for 50 pesos with 10 pcs",
    category: "Food",
    priceRange: "50",
    locationText: "Near Gate 2",
    ratingAverage: 4.5,
  },
  {
    id: "2",
    title: "Buy after 6PM at Canteen B",
    category: "Tips",
    priceRange: "",
    locationText: "Canteen B",
    ratingAverage: 4.5,
    timeHint: "6PM",
  },
  {
    id: "3",
    title: "Notebook bundle, 100 Pesos",
    category: "Items",
    priceRange: "100",
    locationText: "Daza",
    ratingAverage: 4.5,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

export default function MyPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState(MOCK_MY_POSTS);

  const handleArchive = (id: string, title: string) => {
    Alert.alert("Archive Post", `Archive "${title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => setPosts((p) => p.filter((x) => x.id !== id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Posts</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{posts.length} Shared</Text>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/add")}
            >
              <Text style={styles.emptyBtnText}>Share your first find</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: CATEGORY_COLORS[item.category] ?? "#aaa" },
                ]}
              >
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color="#F6A94A" />
              <Text style={styles.ratingText}>
                {" "}
                {item.ratingAverage.toFixed(1)}
              </Text>
            </View>

            {/* Meta */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color="#888" />
                <Text style={styles.metaText}>{item.locationText}</Text>
              </View>
              {item.priceRange ? (
                <View style={styles.metaItem}>
                  <Text style={styles.peso}>₱</Text>
                  <Text style={styles.metaText}>{item.priceRange}</Text>
                </View>
              ) : null}
              {item.timeHint ? (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#888" />
                  <Text style={styles.metaText}>{item.timeHint}</Text>
                </View>
              ) : null}
            </View>

            {/* Divider + Actions */}
            <View style={styles.divider} />
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push({ pathname: "/edit", params: { id: item.id } })}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={14} color={PRIMARY} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.archiveBtn}
                onPress={() => handleArchive(item.id, item.title)}
                activeOpacity={0.85}
              >
                <Ionicons name="archive-outline" size={14} color={DANGER} />
                <Text style={styles.archiveBtnText}>Archive</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GRAY_BG },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countText: { fontSize: 13, color: "#fff", fontWeight: "600" },

  list: { padding: 16, paddingBottom: 100 },

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
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  cardTitle: {
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

  metaRow: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: "#666" },
  peso: { fontSize: 12, fontWeight: "700", color: "#888" },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  actions: { flexDirection: "row", gap: 10 },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}12`,
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: PRIMARY },
  archiveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DANGER,
    backgroundColor: `${DANGER}0F`,
  },
  archiveBtnText: { fontSize: 13, fontWeight: "700", color: DANGER },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: "#bbb", fontWeight: "600" },
  emptyBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
