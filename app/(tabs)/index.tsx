import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#4ECBA4";
const CATEGORIES = ["All", "Food", "Items", "Tips"];
const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// Maps UI label → Firestore value
const CATEGORY_MAP: Record<string, string> = {
  All: "All",
  Food: "Food",
  Items: "Item",
  Tips: "Tip",
};

function PostCard({ post, onPress }: { post: any; onPress: () => void }) {
  const badgeColor = CATEGORY_COLORS[post.category] ?? "#aaa";
  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={cardStyles.row}>
        <Text style={cardStyles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={[cardStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={cardStyles.badgeText}>{post.category}</Text>
        </View>
      </View>

      {(post.ratingAverage ?? 0) > 0 && (
        <View style={cardStyles.ratingRow}>
          <Ionicons name="star" size={11} color="#F6A94A" />
          <Text style={cardStyles.ratingText}>
            {" "}
            {post.ratingAverage.toFixed(1)}
          </Text>
        </View>
      )}

      <View style={cardStyles.metaRow}>
        <View style={cardStyles.metaItem}>
          <Ionicons name="location-outline" size={13} color="#888" />
          <Text style={cardStyles.metaText}>{post.locationText}</Text>
        </View>
        {post.priceRange ? (
          <View style={cardStyles.metaItem}>
            <Text style={cardStyles.pesoSign}>₱</Text>
            <Text style={cardStyles.metaText}>{post.priceRange}</Text>
          </View>
        ) : null}
      </View>

      {post.description ? (
        <Text style={cardStyles.desc} numberOfLines={1}>
          {post.description}
        </Text>
      ) : null}

      {post.isOutdated && (
        <View style={cardStyles.outdatedBadge}>
          <Ionicons name="warning-outline" size={11} color="#92400E" />
          <Text style={cardStyles.outdatedText}>May be outdated</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
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
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 12, color: "#666" },
  pesoSign: { fontSize: 12, color: "#888", fontWeight: "700" },
  desc: { fontSize: 12, color: "#999", marginTop: 2 },
  outdatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outdatedText: { fontSize: 11, color: "#92400E", fontWeight: "600" },
});

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    posts,
    loading,
    error,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
  } = usePosts();

  // usePosts uses "All"|"Food"|"Item"|"Tip" — map UI chips to those values
  const handleCategoryChange = (uiCat: string) => {
    setCategory(CATEGORY_MAP[uiCat] as any);
  };

  // Reverse map for highlighting active chip
  const reverseMap: Record<string, string> = {
    All: "All",
    Food: "Food",
    Item: "Items",
    Tip: "Tips",
  };
  const activeChip = reverseMap[category] ?? "All";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>Sulit Spot</Text>
          <Text style={styles.brandSub}>Budget finds near you</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <Ionicons name="person-circle-outline" size={36} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#aaa"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cheap finds"
            placeholderTextColor="#BDBDBD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category chips */}
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeChip === cat && styles.chipActive]}
              onPress={() => handleCategoryChange(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  activeChip === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Recent finds</Text>

        {/* Loading */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={PRIMARY} size="large" />
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.center}>
            <Ionicons name="cloud-offline-outline" size={40} color="#ddd" />
            <Text style={styles.emptyText}>
              Could not load posts. Check connection.
            </Text>
          </View>
        )}

        {/* Posts */}
        {!loading && !error && (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onPress={() =>
                  router.push({
                    pathname: "/detail",
                    params: { postId: item.id },
                  })
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color="#ddd" />
                <Text style={styles.emptyText}>
                  No finds yet. Be the first!
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => (user ? router.push("/add") : router.push("/login"))}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 24,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  profileBtn: { padding: 2 },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#333" },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  chipActive: { backgroundColor: "#1A1A1A", borderColor: "#1A1A1A" },
  chipText: { fontSize: 13, color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 10,
  },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, color: "#bbb" },
  fab: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});
