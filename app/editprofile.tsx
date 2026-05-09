import { updateUserProfile } from "@/services/authService";
import { auth } from "@/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
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

const PRIMARY = "#4ECBA4";

export default function EditProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    general?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required.";
    else if (name.trim().length < 2) e.name = "Name is too short.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const updates: { name?: string; email?: string } = {};
      if (name.trim() !== user?.displayName) updates.name = name.trim();
      if (email.trim().toLowerCase() !== user?.email)
        updates.email = email.trim();

      if (Object.keys(updates).length === 0) {
        router.back();
        return;
      }

      await updateUserProfile(updates);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-authentication required",
          "For security, please log out and log back in before changing your email.",
          [{ text: "OK" }],
        );
      } else {
        setErrors({ general: err.message || "Failed to update profile." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar display */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {name.trim().charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <Text style={styles.avatarHint}>
              Tap to change photo (coming soon)
            </Text>
          </View>

          {/* Error banner */}
          {errors.general ? (
            <View style={styles.generalError}>
              <Text style={styles.generalErrorText}>{errors.general}</Text>
            </View>
          ) : null}

          {/* Form fields */}
          <View style={styles.form}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Your name"
              placeholderTextColor="#BDBDBD"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setErrors((e) => ({ ...e, name: undefined }));
              }}
              autoCapitalize="words"
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="yourname@gmail.com"
              placeholderTextColor="#BDBDBD"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
            <Text style={styles.hint}>
              Changing email requires recent login. You may be asked to
              re-authenticate.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F6FA" },

  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 16,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    minWidth: 56,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  content: { paddingBottom: 40 },

  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarInitial: { fontSize: 32, fontWeight: "800", color: "#fff" },
  avatarHint: { fontSize: 12, color: "#aaa" },

  generalError: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  generalErrorText: { color: "#B91C1C", fontSize: 13, fontWeight: "500" },

  form: { paddingHorizontal: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#222",
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#E53935" },
  errorText: { fontSize: 11, color: "#E53935", marginTop: 4 },
  hint: { fontSize: 11, color: "#aaa", marginTop: 6, lineHeight: 16 },
});
