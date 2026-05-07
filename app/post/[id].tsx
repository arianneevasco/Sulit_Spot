import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_POST = {
  id: "1",
  title: "Siomai rice for 50 pesos with 10 pcs",
  category: "Food",
  priceRange: "50",
  locationText: "Near Gate 2",
  description:
    "Busog na busog ang portion — sulit talaga para sa mga budget students. Luto fresh every morning, available until 2PM lang!",
  ratingAverage: 4.5,
  accurateCount: 8,
  outdatedCount: 1,
  isOutdated: false,
  authorName: "Arianne Evasco",
  authorInitial: "A",
  postedAgo: "2h ago",
  isOwner: true,
};

const MOCK_COMMENTS = [
  {
    id: "c1",
    authorName: "Maria S.",
    authorInitial: "M",
    text: "Confirmed! Still 50 pesos as of today. Very filling too.",
    createdAgo: "1h ago",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Item: "#5B9CF6",
  Tip: "#F6A94A",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function InitialAvatar({
  initial,
  color = "#4ECBA4",
}: {
  initial: string;
  color?: string;
}) {
  return (
    <View style={[avatarStyles.circle, { backgroundColor: color }]}>
      <Text style={avatarStyles.text}>{initial}</Text>
    </View>
  );
}
const avatarStyles = StyleSheet.create({
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

// ─── Post Detail Screen ───────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const post = MOCK_POST; // TODO: replace with usePosts(id)
  const comments = MOCK_COMMENTS;

  const [comment, setComment] = useState("");
  const [userVote, setUserVote] = useState<"accurate" | "outdated" | null>(
    null,
  );
  const [accurateCount, setAccurateCount] = useState(post.accurateCount);
  const [outdatedCount, setOutdatedCount] = useState(post.outdatedCount);

  const badgeColor = CATEGORY_COLORS[post.category] ?? "#aaa";

  const handleAccurate = () => {
    if (userVote === "accurate") return;
    setAccurateCount((n) => n + 1);
    if (userVote === "outdated") setOutdatedCount((n) => n - 1);
    setUserVote("accurate");
  };

  const handleOutdated = () => {
    if (userVote === "outdated") return;
    setOutdatedCount((n) => n + 1);
    if (userVote === "accurate") setAccurateCount((n) => n - 1);
    setUserVote("outdated");
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    // TODO: commentService.addComment(post.id, comment)
    setComment("");
    Alert.alert("Comment added!");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Detail</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Post Card ── */}
          <View style={styles.postCard}>
            {/* Category badge */}
            <View
              style={[styles.categoryBadge, { backgroundColor: badgeColor }]}
            >
              <Text style={styles.categoryBadgeText}>{post.category}</Text>
            </View>

            <Text style={styles.postTitle}>{post.title}</Text>

            <View style={styles.postMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color="#888" />
                <Text style={styles.metaText}>{post.locationText}</Text>
              </View>
              {post.priceRange ? (
                <View style={styles.metaItem}>
                  <Text style={styles.pesoSign}>₱</Text>
                  <Text style={styles.metaText}>{post.priceRange}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Map Placeholder ── */}
          <TouchableOpacity style={styles.mapPlaceholder} activeOpacity={0.8}>
            <View style={styles.mapIconBg}>
              <Ionicons name="location" size={26} color="#4ECBA4" />
            </View>
            <Text style={styles.mapLabel}>Map View</Text>
          </TouchableOpacity>

          {/* ── Description ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{post.description}</Text>
          </View>

          {/* ── Trust Signals ── */}
          <View style={styles.trustCard}>
            <Text style={styles.trustTitle}>Trust signals</Text>

            <View style={styles.trustButtons}>
              {/* Still Accurate */}
              <TouchableOpacity
                style={[
                  styles.trustBtn,
                  styles.trustBtnAccurate,
                  userVote === "accurate" && styles.trustBtnAccurateActive,
                ]}
                onPress={handleAccurate}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="checkmark"
                  size={15}
                  color={userVote === "accurate" ? "#fff" : "#4ECBA4"}
                />
                <Text
                  style={[
                    styles.trustBtnText,
                    { color: userVote === "accurate" ? "#fff" : "#4ECBA4" },
                  ]}
                >
                  Still accurate {accurateCount > 0 ? `(${accurateCount})` : ""}
                </Text>
              </TouchableOpacity>

              {/* Outdated */}
              <TouchableOpacity
                style={[
                  styles.trustBtn,
                  styles.trustBtnOutdated,
                  userVote === "outdated" && styles.trustBtnOutdatedActive,
                ]}
                onPress={handleOutdated}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="close"
                  size={15}
                  color={userVote === "outdated" ? "#fff" : "#E53935"}
                />
                <Text
                  style={[
                    styles.trustBtnText,
                    { color: userVote === "outdated" ? "#fff" : "#E53935" },
                  ]}
                >
                  Outdated {outdatedCount > 0 ? `(${outdatedCount})` : ""}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Star rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={
                    i <= Math.round(post.ratingAverage)
                      ? "star"
                      : "star-outline"
                  }
                  size={14}
                  color="#F6A94A"
                />
              ))}
              <Text style={styles.ratingLabel}>
                {post.ratingAverage.toFixed(1)} ratings
              </Text>
            </View>

            {/* Repost */}
            <TouchableOpacity style={styles.repostBtn} activeOpacity={0.85}>
              <Text style={styles.repostBtnText}>Repost Post</Text>
            </TouchableOpacity>
          </View>

          {/* ── Comments ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Comments ({comments.length})
            </Text>

            {comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <InitialAvatar initial={c.authorInitial} color="#4ECBA4" />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{c.authorName}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            ))}

            {/* Author meta + actions */}
            {post.isOwner && (
              <View style={styles.ownerRow}>
                <InitialAvatar initial={post.authorInitial} color="#5B9CF6" />
                <View style={styles.ownerMeta}>
                  <Text style={styles.ownerName}>{post.authorName}</Text>
                  <Text style={styles.ownerAgo}>Posted {post.postedAgo}</Text>
                </View>
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={[styles.ownerBtn, styles.editBtn]}
                    onPress={() =>
                      router.push({
                        pathname: "/post/[id]",
                        params: { id: post.id, mode: "edit" },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ownerBtn, styles.archiveBtn]}
                    activeOpacity={0.85}
                    onPress={() =>
                      Alert.alert("Archive Post", "Archive this post?", [
                        { text: "Cancel" },
                        { text: "Archive", style: "destructive" },
                      ])
                    }
                  >
                    <Text style={styles.archiveBtnText}>Archive</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ── Comment Input ── */}
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment....."
            placeholderTextColor="#BDBDBD"
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !comment.trim() && styles.sendBtnDisabled]}
            onPress={handleSendComment}
            disabled={!comment.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={comment.trim() ? "#4ECBA4" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6FA",
  },

  /* Header */
  header: {
    backgroundColor: "#4ECBA4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  /* Post card */
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    lineHeight: 22,
    marginBottom: 10,
  },
  postMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
  },
  pesoSign: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
  },

  /* Map */
  mapPlaceholder: {
    backgroundColor: "#E8F5F0",
    borderRadius: 16,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#C5E8DC",
    borderStyle: "dashed",
  },
  mapIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(78,203,164,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapLabel: {
    fontSize: 13,
    color: "#4ECBA4",
    fontWeight: "600",
  },

  /* Sections */
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  /* Trust card */
  trustCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  trustButtons: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  trustBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  trustBtnAccurate: {
    borderColor: "#4ECBA4",
    backgroundColor: "rgba(78,203,164,0.06)",
  },
  trustBtnAccurateActive: {
    backgroundColor: "#4ECBA4",
    borderColor: "#4ECBA4",
  },
  trustBtnOutdated: {
    borderColor: "#E53935",
    backgroundColor: "rgba(229,57,53,0.06)",
  },
  trustBtnOutdatedActive: {
    backgroundColor: "#E53935",
    borderColor: "#E53935",
  },
  trustBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  repostBtn: {
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  repostBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  /* Comments */
  commentRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  commentBubble: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  commentText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
  },

  /* Owner row */
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    marginTop: 4,
  },
  ownerMeta: {
    flex: 1,
  },
  ownerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  ownerAgo: {
    fontSize: 11,
    color: "#999",
    marginTop: 1,
  },
  ownerActions: {
    flexDirection: "row",
    gap: 8,
  },
  ownerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  editBtn: {
    borderColor: "#1A1A1A",
    backgroundColor: "#fff",
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  archiveBtn: {
    borderColor: "#E53935",
    backgroundColor: "#fff",
  },
  archiveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E53935",
  },

  /* Comment input */
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: "#F5F6FA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
