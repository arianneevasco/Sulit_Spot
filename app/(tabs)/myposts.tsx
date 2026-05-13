import { useAuth } from "@/hooks/useAuth";
import { useMyPosts } from "@/hooks/useMyPosts";
import { archivePost } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Item: "#5B9CF6",
  Items: "#5B9CF6",
  Tip: "#9B5DE5",
  Tips: "#9B5DE5",
};

export default function MyPostsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { posts, loading, error } = useMyPosts(user?.uid);

  const handleArchive = (id: string, title: string) => {
    Alert.alert(
      "Archive Post",
      `Archive "${title}"?\n\nIt will be removed from the public feed but still visible here.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            try {
              await archivePost(id);
            } catch (e: any) {
              Alert.alert("Error", e.message || "Could not archive post.");
            }
          },
        },
      ],
    );
  };

  // Show loading while auth is resolving so we don't flash "Login" to signed-in users
  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Posts</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Posts</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color="#ddd" />
          <Text style={styles.emptyText}>Login to see your posts</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activePosts = posts.filter((p) => !p.isArchived);
  const archivedPosts = posts.filter((p) => p.isArchived);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Posts</Text>
        {!loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activePosts.length} Active</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      )}

      {/* Full error screen — only when we have NO data to show */}
      {!loading && error && posts.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={40} color="#ddd" />
          <Text style={styles.emptyText}>Could not load posts.</Text>
          <Text style={styles.retryHint}>
            Check your connection and try again.
          </Text>
        </View>
      )}

      {/* Small banner when error fires but we still have cached posts */}
      {!loading && error && posts.length > 0 && (
        <View style={styles.errorBanner}>
          <Ionicons name="wifi-outline" size={14} color="#92400E" />
          <Text style={styles.errorBannerText}>
            Showing cached posts — reconnecting…
          </Text>
        </View>
      )}

      {!loading && posts.length > 0 && (
        <FlatList
          data={posts}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.push("/add")}
              >
                <Text style={styles.loginBtnText}>Share your first find</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const isArchived = !!item.isArchived;
            return (
              <View style={[styles.card, isArchived && styles.cardArchived]}>
                <View style={styles.cardTop}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isArchived && styles.cardTitleMuted,
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.badgeRow}>
                    {isArchived && (
                      <View style={styles.archivedBadge}>
                        <Ionicons name="archive" size={10} color="#fff" />
                        <Text style={styles.archivedBadgeText}>Archived</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: isArchived
                            ? "#aaa"
                            : (CATEGORY_COLORS[item.category] ?? "#aaa"),
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{item.category}</Text>
                    </View>
                  </View>
                </View>

                {(item.ratingAverage ?? 0) > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color="#F6A94A" />
                    <Text style={styles.ratingText}>
                      {" "}
                      {item.ratingAverage.toFixed(1)}
                    </Text>
                  </View>
                )}

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
                </View>

                {/* Only show action buttons for active (non-archived) posts */}
                {!isArchived && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() =>
                          router.push({
                            pathname: "/edit",
                            params: { id: item.id },
                          })
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="create-outline"
                          size={14}
                          color={PRIMARY}
                        />
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.archiveBtn}
                        onPress={() => handleArchive(item.id, item.title)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="archive-outline"
                          size={14}
                          color={DANGER}
                        />
                        <Text style={styles.archiveBtnText}>Archive</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          }}
        />
      )}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
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
  cardArchived: {
    backgroundColor: "#F9F9F9",
    opacity: 0.75,
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
  cardTitleMuted: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#999",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  archivedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
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
  emptyText: { fontSize: 15, color: "#bbb", fontWeight: "600" },
  retryHint: { fontSize: 12, color: "#ccc", marginTop: 4 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF8E7",
    borderBottomWidth: 1,
    borderBottomColor: "#F6A94A40",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  errorBannerText: { fontSize: 12, color: "#92400E", flex: 1 },
  loginBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
