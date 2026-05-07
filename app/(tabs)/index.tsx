import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_POSTS = [
  {
    id: "1",
    title: "Siomai rice for 50 pesos with 10 pcs",
    category: "Food",
    priceRange: "50",
    locationText: "Near Gate 2",
    description: "Busog na busog - sulit talaga for budget students",
    ratingAverage: 4.5,
    isOutdated: false,
  },
  {
    id: "2",
    title: "Buy after 6PM at Canteen B",
    category: "Tips",
    priceRange: "",
    locationText: "Canteen B",
    timeHint: "6PM",
    description: "Discounted leftover meals - up to 30pesos off",
    ratingAverage: 4.5,
    isOutdated: false,
  },
  {
    id: "3",
    title: "Notebook bundle, 100 Pesos",
    category: "Items",
    priceRange: "100",
    locationText: "Daza",
    description: "Notebook bundle",
    ratingAverage: 4.5,
    isOutdated: false,
  },
];

const CATEGORIES = ["All", "Food", "Items", "Tips"];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, onPress }: { post: any; onPress: () => void }) {
  const badgeColor = CATEGORY_COLORS[post.category] ?? "#aaa";
  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Row 1: title + badge */}
      <View style={cardStyles.row}>
        <Text style={cardStyles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <View style={[cardStyles.badge, { backgroundColor: badgeColor }]}>
          <Text style={cardStyles.badgeText}>{post.category}</Text>
        </View>
      </View>

      {/* Rating */}
      <View style={cardStyles.ratingRow}>
        <Ionicons name="star" size={11} color="#F6A94A" />
        <Text style={cardStyles.ratingText}>
          {" "}
          {post.ratingAverage.toFixed(1)}
        </Text>
      </View>

      {/* Meta */}
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
        {post.timeHint ? (
          <View style={cardStyles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={cardStyles.metaText}>{post.timeHint}</Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      {post.description ? (
        <Text style={cardStyles.desc} numberOfLines={1}>
          {post.description}
        </Text>
      ) : null}
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11,
    color: "#888",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
  },
  pesoSign: {
    fontSize: 12,
    color: "#888",
    fontWeight: "700",
  },
  desc: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});

// ─── Home Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = MOCK_POSTS.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#4ECBA4" />

      {/* ── Hero Header ── */}
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

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Search bar */}
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
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter chips */}
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, activeCategory === cat && styles.chipActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === cat && styles.chipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>Recent finds</Text>

        {/* Posts list */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() =>
                router.push({ pathname: "/post/[id]", params: { id: item.id } })
              }
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#ddd" />
              <Text style={styles.emptyText}>No finds yet. Be the first!</Text>
            </View>
          }
        />
      </View>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PRIMARY = "#4ECBA4";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  profileBtn: {
    padding: 2,
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },

  /* Search */
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  /* Category chips */
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  chipActive: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  chipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },

  /* Section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  /* Empty */
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#bbb",
  },

  /* FAB */
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
