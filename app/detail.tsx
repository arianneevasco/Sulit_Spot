import { MapPreview } from "@/components/MapPicker";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { usePostDetail } from "@/hooks/usePostDetails";
import { useRatings } from "@/hooks/useRatings";
import { addComment } from "@/services/commentService";
import { reportPost, voteAccuracy } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#4ECBA4";
const DANGER = "#EF4444";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <View style={sk.wrap}>
      <View style={[sk.block, { height: 180 }]} />
      <View style={sk.body}>
        <View style={[sk.line, { width: "40%", height: 14 }]} />
        <View style={[sk.line, { width: "90%", height: 22, marginTop: 8 }]} />
        <View style={[sk.line, { width: "60%", height: 14, marginTop: 10 }]} />
        <View
          style={[
            sk.line,
            { width: "100%", height: 80, marginTop: 20, borderRadius: 12 },
          ]}
        />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F5F6FA" },
  body: { padding: 20, gap: 6 },
  block: { backgroundColor: "#E5E5E5" },
  line: { backgroundColor: "#EBEBEB", borderRadius: 6 },
});

export default function DetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user } = useAuth();

  const { post, loading, error } = usePostDetail(postId);
  const { comments } = useComments(postId);
  const { userRating, rate } = useRatings(postId, user?.uid);

  const [myVote, setMyVote] = useState<"accurate" | "outdated" | null>(null);
  const [accCount, setAccCount] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [reported, setReported] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  // Sync counts from post once loaded
  React.useEffect(() => {
    if (post) {
      setAccCount(post.accurateCount ?? 0);
      setOutCount(post.outdatedCount ?? 0);
    }
  }, [post]);

  // ── Guard — need a postId ───────────────────────────────────────────────────
  if (!postId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>No post found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: PRIMARY, marginTop: 12, fontWeight: "700" }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return <Skeleton />;

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#ddd" />
          <Text style={styles.errorText}>{error ?? "Post not found."}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: PRIMARY, marginTop: 12, fontWeight: "700" }}>
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = user?.uid === post.userId;
  const badgeColor = CATEGORY_COLORS[post.category] ?? "#aaa";

  // ── Trust actions ────────────────────────────────────────────────────────────
  const handleVote = async (type: "accurate" | "outdated") => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (myVote) {
      Alert.alert("Already voted", "You have already voted on this post.");
      return;
    }
    try {
      await voteAccuracy(post.id, type);
      setMyVote(type);
      if (type === "accurate") setAccCount((c) => c + 1);
      else setOutCount((c) => c + 1);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleReport = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (reported) {
      Alert.alert("Already reported", "You have already reported this post.");
      return;
    }
    Alert.alert(
      "Report post",
      "Report this post as inaccurate or misleading?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              await reportPost(post.id);
              setReported(true);
              Alert.alert(
                "Reported",
                "Thank you for helping keep Sulit Spot accurate.",
              );
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ],
    );
  };

  const handleSendComment = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!commentText.trim() || sending) return;
    setSending(true);
    try {
      await addComment(post.id, commentText.trim());
      setCommentText("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Detail</Text>
          {isOwner ? (
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() =>
                router.push({ pathname: "/edit", params: { id: post.id } })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── Hero image or gradient banner ── */}
          {post.photoURL ? (
            <Image source={{ uri: post.photoURL }} style={styles.heroImage} />
          ) : (
            <View
              style={[
                styles.heroBanner,
                { backgroundColor: badgeColor + "22" },
              ]}
            >
              <Ionicons
                name={
                  post.category === "Food"
                    ? "fast-food-outline"
                    : post.category === "Items"
                      ? "bag-outline"
                      : "bulb-outline"
                }
                size={48}
                color={badgeColor}
              />
            </View>
          )}

          <View style={styles.body}>
            {/* ── Category badge ── */}
            <View style={styles.topRow}>
              <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={styles.badgeText}>{post.category}</Text>
              </View>
              {post.isOutdated && (
                <View style={styles.outdatedBadge}>
                  <Ionicons name="warning-outline" size={12} color="#92400E" />
                  <Text style={styles.outdatedText}>May be outdated</Text>
                </View>
              )}
            </View>

            {/* ── Title ── */}
            <Text style={styles.title}>{post.title}</Text>

            {/* ── Meta row ── */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={PRIMARY} />
                <Text style={styles.metaText}>{post.locationText}</Text>
              </View>
              {post.priceRange ? (
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={15} color={PRIMARY} />
                  <Text style={styles.metaText}>₱ {post.priceRange}</Text>
                </View>
              ) : null}
            </View>

            {/* ── Rating display ── */}
            {(post.ratingAverage ?? 0) > 0 && (
              <View style={styles.ratingDisplay}>
                <StarRating
                  value={null}
                  average={post.ratingAverage}
                  count={post.ratingCount}
                  size={18}
                />
              </View>
            )}

            {/* ── Description ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Description</Text>
              <Text style={styles.description}>{post.description}</Text>
            </View>

            {/* ── Map pin (real MapView) ── */}
            {post.latitude && post.longitude && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Location</Text>
                <View style={styles.mapBox}>
                  <MapPreview
                    coord={{
                      latitude: post.latitude,
                      longitude: post.longitude,
                    }}
                    onDirections={() => {
                      const url = `https://maps.google.com/?q=${post.latitude},${post.longitude}`;
                      import("react-native").then(({ Linking }) =>
                        Linking.openURL(url),
                      );
                    }}
                  />
                </View>
              </View>
            )}

            {/* ── Trust section ── */}
            <View style={styles.trustCard}>
              <Text style={styles.sectionLabel}>Community trust</Text>

              {/* Accurate / Outdated */}
              <View style={styles.trustRow}>
                <TouchableOpacity
                  style={[
                    styles.trustBtn,
                    myVote === "accurate" && styles.trustBtnActive,
                  ]}
                  onPress={() => handleVote("accurate")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={15}
                    color={myVote === "accurate" ? "#fff" : PRIMARY}
                  />
                  <Text
                    style={[
                      styles.trustBtnText,
                      { color: myVote === "accurate" ? "#fff" : PRIMARY },
                    ]}
                  >
                    Still accurate ({accCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.trustBtn,
                    styles.trustBtnOutdated,
                    myVote === "outdated" && styles.trustBtnOutdatedActive,
                  ]}
                  onPress={() => handleVote("outdated")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={15}
                    color={myVote === "outdated" ? "#fff" : DANGER}
                  />
                  <Text
                    style={[
                      styles.trustBtnText,
                      { color: myVote === "outdated" ? "#fff" : DANGER },
                    ]}
                  >
                    Outdated ({outCount})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Star rating */}
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Rate this find:</Text>
                <StarRating
                  value={userRating}
                  onRate={user ? rate : () => router.push("/login")}
                  size={24}
                />
              </View>

              {/* Report */}
              <TouchableOpacity
                style={[styles.reportBtn, reported && styles.reportedBtn]}
                onPress={handleReport}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="flag-outline"
                  size={13}
                  color={reported ? "#aaa" : "#888"}
                />
                <Text
                  style={[styles.reportText, reported && { color: "#aaa" }]}
                >
                  {reported ? "Reported" : "Report post"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Posted by ── */}
            <View style={styles.postedBy}>
              <View style={styles.posterAvatar}>
                <Text style={styles.posterInitial}>
                  {(post.userName ?? "U")[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.posterName}>{post.userName}</Text>
                <Text style={styles.posterDate}>
                  {post.createdAt?.toDate
                    ? new Intl.DateTimeFormat("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(post.createdAt.toDate())
                    : "Recently posted"}
                </Text>
              </View>

              {/* Owner actions */}
              {isOwner && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.ownerBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/edit",
                        params: { id: post.id },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ownerBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* ── Comments ── */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Comments ({comments.length})
              </Text>

              {comments.length === 0 ? (
                <Text style={styles.noComments}>
                  No comments yet. Be the first!
                </Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.comment}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentInitial}>
                        {c.userName[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBody}>
                      <Text style={styles.commentName}>{c.userName}</Text>
                      <Text style={styles.commentText}>{c.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* ── Comment input ── */}
        <View style={styles.commentInput}>
          <View style={styles.commentInputInner}>
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color="#bbb"
              style={{ marginRight: 4 }}
            />
            <View style={{ flex: 1 }} onStartShouldSetResponder={() => true}>
              <Text
                style={styles.commentPlaceholder}
                onPress={() => {
                  if (!user) router.push("/login");
                }}
              >
                {commentText ||
                  (user ? "Add a comment..." : "Login to comment")}
              </Text>
            </View>
          </View>
          {user && (
            <View style={styles.commentInputRow}>
              <View
                style={styles.commentTextInputWrap}
                pointerEvents="box-none"
              >
                <Ionicons name="chatbubble-outline" size={16} color="#bbb" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.commentPlaceholder,
                      commentText && { color: "#222" },
                    ]}
                  >
                    {commentText || "Add a comment..."}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                onPress={handleSendComment}
                disabled={sending}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={15} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: "#bbb",
    marginTop: 12,
    textAlign: "center",
  },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Hero */
  heroImage: { width: "100%", height: 200, resizeMode: "cover" },
  heroBanner: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Body */
  body: { padding: 20 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  outdatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outdatedText: { fontSize: 11, color: "#92400E", fontWeight: "600" },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    lineHeight: 26,
    marginBottom: 12,
  },

  metaRow: { flexDirection: "row", gap: 16, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13, color: "#555", fontWeight: "500" },

  ratingDisplay: { marginBottom: 14 },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  description: { fontSize: 14, color: "#444", lineHeight: 22 },

  /* Map box */
  mapBox: {
    borderRadius: 14,
    overflow: "hidden",
  },

  /* Trust */
  trustCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  trustRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  trustBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}10`,
  },
  trustBtnActive: { backgroundColor: PRIMARY },
  trustBtnOutdated: { borderColor: DANGER, backgroundColor: `${DANGER}0D` },
  trustBtnOutdatedActive: { backgroundColor: DANGER },
  trustBtnText: { fontSize: 12, fontWeight: "700" },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  rateLabel: { fontSize: 13, color: "#555", fontWeight: "600" },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  reportedBtn: { borderColor: "#E5E5E5" },
  reportText: { fontSize: 12, color: "#888" },

  /* Posted by */
  postedBy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  posterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  posterInitial: { color: "#fff", fontWeight: "800", fontSize: 16 },
  posterName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  posterDate: { fontSize: 12, color: "#aaa", marginTop: 1 },
  ownerActions: { marginLeft: "auto" },
  ownerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  ownerBtnText: { fontSize: 12, fontWeight: "700", color: PRIMARY },

  /* Comments */
  noComments: {
    fontSize: 13,
    color: "#ccc",
    textAlign: "center",
    paddingVertical: 12,
  },
  comment: { flexDirection: "row", gap: 10, marginBottom: 14 },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${PRIMARY}30`,
    alignItems: "center",
    justifyContent: "center",
  },
  commentInitial: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  commentBody: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
  },
  commentName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  commentText: { fontSize: 13, color: "#555", lineHeight: 18 },

  /* Comment input */
  commentInput: {
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#fff",
    padding: 12,
  },
  commentInputInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F6FA",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentPlaceholder: { flex: 1, fontSize: 14, color: "#bbb" },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentTextInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F6FA",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
});
