import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#4ECBA4";
const GRAY_BG = "#F5F6FA";

// Mock user — replace with useAuth()
const MOCK_USER = {
  name: "Ariana Grande",
  email: "arianagrande@gmail.com",
  postsShared: 3,
  avgRating: 4.5,
  initial: "A",
};

type MenuRowProps = {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
};

function MenuRow({
  icon,
  label,
  onPress,
  danger = false,
  trailing,
}: MenuRowProps) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.menuIconBg, danger && styles.menuIconBgDanger]}>
        <Ionicons
          name={icon as any}
          size={18}
          color={danger ? "#EF4444" : PRIMARY}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>
        {label}
      </Text>
      <View style={styles.menuTrailing}>
        {trailing ?? <Ionicons name="chevron-forward" size={16} color="#CCC" />}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          // TODO: await authService.logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Avatar card ── */}
        <View style={styles.avatarSection}>
          {/* Avatar circle */}
          <View style={styles.avatarRing}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{MOCK_USER.initial}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{MOCK_USER.name}</Text>
          <Text style={styles.userEmail}>{MOCK_USER.email}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{MOCK_USER.postsShared}</Text>
              <Text style={styles.statLabel}>Posts shared</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statRatingRow}>
                <Ionicons name="star" size={14} color="#F6A94A" />
                <Text style={styles.statValue}>
                  {MOCK_USER.avgRating.toFixed(1)}
                </Text>
              </View>
              <Text style={styles.statLabel}>Avg rating</Text>
            </View>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>

          <View style={styles.menuCard}>
            <MenuRow
              icon="document-text-outline"
              label="My posts"
              onPress={() => router.push("/(tabs)/myposts")}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="person-outline"
              label="Edit profile"
              onPress={() => router.push("/profile")}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => {}}
              trailing={
                <Switch
                  value={notifEnabled}
                  onValueChange={setNotifEnabled}
                  trackColor={{ false: "#E5E5E5", true: `${PRIMARY}80` }}
                  thumbColor={notifEnabled ? PRIMARY : "#f4f3f4"}
                />
              }
            />
          </View>
        </View>

        {/* ── About ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>About</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="information-circle-outline"
              label="About Sulit Spot"
              onPress={() => {}}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* ── Log out ── */}
        <View style={[styles.menuSection, { marginTop: 4 }]}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.logoutRow}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <View style={styles.menuIconBgDanger}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App version */}
        <Text style={styles.version}>Sulit Spot v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GRAY_BG },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 60,
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

  /* Avatar section — overlaps header */
  avatarSection: {
    alignItems: "center",
    marginTop: -44,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatarRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 32, fontWeight: "800", color: "#fff" },

  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: "#888", marginBottom: 20 },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statDivider: { width: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  statRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1A1A1A" },
  statLabel: { fontSize: 12, color: "#888", fontWeight: "500" },

  /* Menu sections */
  menuSection: { paddingHorizontal: 16, marginBottom: 10 },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconBgDanger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
  menuLabelDanger: { color: "#EF4444" },
  menuTrailing: { alignItems: "center", justifyContent: "center" },
  menuDivider: { height: 1, backgroundColor: "#F5F5F5", marginLeft: 64 },

  /* Logout */
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#EF4444", flex: 1 },

  version: { textAlign: "center", fontSize: 12, color: "#CCC", marginTop: 8 },
});
