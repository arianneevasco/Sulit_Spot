import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/services/authService";
import { db } from "@/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#4ECBA4";

type UserStats = { postsCount: number; avgRating: number };

async function fetchUserStats(uid: string): Promise<UserStats> {
  try {
    // Only count active (non-archived) posts for profile stats
    const postsQ = query(
      collection(db, "posts"),
      where("userId", "==", uid),
      where("isArchived", "==", false),
    );
    const countSnap = await getCountFromServer(postsQ);
    const postsCount = countSnap.data().count;

    const docsSnap = await getDocs(postsQ);
    let totalRating = 0;
    let ratingCount = 0;
    docsSnap.forEach((doc) => {
      const d = doc.data();
      if (typeof d.avgRating === "number" && d.ratingCount > 0) {
        totalRating += d.avgRating * d.ratingCount;
        ratingCount += d.ratingCount;
      }
    });

    return {
      postsCount,
      avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    };
  } catch {
    return { postsCount: 0, avgRating: 0 };
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const displayName = user?.displayName ?? "User";
  const email = user?.email ?? "";

  const [stats, setStats] = useState<UserStats>({
    postsCount: 0,
    avgRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchUserStats(user.uid).then((s) => {
      setStats(s);
      setStatsLoading(false);
    });
  }, [user?.uid]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to log out.");
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Green banner ── */}
        <View style={styles.banner}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Avatar (overlapping banner) ── */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={44} color="#aaa" />
            </View>
          </View>
        </View>

        {/* ── Name & email ── */}
        <View style={styles.nameSection}>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {statsLoading ? "—" : stats.postsCount}
            </Text>
            <Text style={styles.statLabel}>Posts shared</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F6A94A" />
              <Text style={styles.statValue}>
                {statsLoading
                  ? "—"
                  : stats.avgRating > 0
                    ? stats.avgRating.toFixed(1)
                    : "N/A"}
              </Text>
            </View>
            <Text style={styles.statLabel}>Avg rating</Text>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/(tabs)/myposts")}
            activeOpacity={0.75}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="document-text-outline" size={20} color="#555" />
            </View>
            <Text style={styles.menuLabel}>My posts</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/editprofile")}
            activeOpacity={0.75}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="person-outline" size={20} color="#555" />
            </View>
            <Text style={styles.menuLabel}>Edit profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {}}
            activeOpacity={0.75}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="notifications-outline" size={20} color="#555" />
            </View>
            <Text style={styles.menuLabel}>Notification</Text>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* ── Log out button ── */}
        {!confirmingLogout ? (
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => setConfirmingLogout(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoutConfirm}>
            <Text style={styles.logoutConfirmText}>Are you sure?</Text>
            <View style={styles.logoutConfirmRow}>
              <TouchableOpacity
                style={styles.logoutCancelBtn}
                onPress={() => setConfirmingLogout(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.logoutConfirmBtn,
                  loggingOut && { opacity: 0.6 },
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
                activeOpacity={0.85}
              >
                <Text style={styles.logoutConfirmBtnText}>
                  {loggingOut ? "Logging out…" : "Yes, log out"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F5" },

  /* Green banner */
  banner: {
    backgroundColor: PRIMARY,
    height: 120,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Avatar */
  avatarWrap: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: 12,
  },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Name */
  nameSection: { alignItems: "center", marginBottom: 20 },
  displayName: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  emailText: { fontSize: 13, color: "#888", marginTop: 3 },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  statLabel: { fontSize: 12, color: "#888" },

  /* Menu */
  menu: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F3F3",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#1A1A1A" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 64 },

  /* Logout */
  logoutBtn: {
    marginHorizontal: 20,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  logoutConfirm: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
    padding: 16,
    gap: 12,
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  logoutConfirmRow: { flexDirection: "row", gap: 10 },
  logoutCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#DDD",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutCancelText: { fontSize: 14, fontWeight: "600", color: "#555" },
  logoutConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutConfirmBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
