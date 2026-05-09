import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
const DANGER = "#EF4444";
const WARNING_BG = "#FFF8E7";
const WARNING_BD = "#F6A94A";
const CATEGORIES = ["Food", "Items", "Tips"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// Mock existing post data — replace with real fetch using id
const MOCK_POST = {
  title: "Siomai rice",
  category: "Food" as Category,
  priceRange: "40 - 60 Pesos",
  locationText: "Labella Luna Hotel side",
  description: "Busog na busog ang portion - sulit talaga",
  isOlderThan7Days: true,
};

export default function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [title, setTitle] = useState(MOCK_POST.title);
  const [category, setCategory] = useState<Category>(MOCK_POST.category);
  const [priceRange, setPriceRange] = useState(MOCK_POST.priceRange);
  const [location, setLocation] = useState(MOCK_POST.locationText);
  const [description, setDescription] = useState(MOCK_POST.description);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showWarning = MOCK_POST.isOlderThan7Days && !dismissed;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!location.trim()) e.location = "Location is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: await postService.updatePost(id, { title, category, priceRange, location, description });
      await new Promise((r) => setTimeout(r, 700));
      Alert.alert("Saved!", "Your post has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = () => {
    Alert.alert(
      "Archive Post",
      "This will hide your post from the feed. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            // TODO: await postService.archivePost(id);
            router.replace("/(tabs)/myposts");
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Post</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Accuracy warning banner */}
          {showWarning && (
            <View style={styles.warningCard}>
              <View style={styles.warningTop}>
                <Ionicons name="warning-outline" size={18} color={WARNING_BD} />
                <Text style={styles.warningTitle}>Is this still accurate?</Text>
              </View>
              <Text style={styles.warningBody}>
                This post is 7+ days old. Confirm it is still correct or archive
                it.
              </Text>
              <View style={styles.warningActions}>
                <TouchableOpacity
                  style={styles.stillAccurateBtn}
                  onPress={() => setDismissed(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.stillAccurateTxt}>Still accurate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.archiveInsteadBtn}
                  onPress={handleArchive}
                  activeOpacity={0.85}
                >
                  <Ionicons name="archive-outline" size={14} color={DANGER} />
                  <Text style={styles.archiveInsteadTxt}>Archive instead</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Post title"
            placeholderTextColor="#BDBDBD"
          />
          {errors.title ? (
            <Text style={styles.errText}>{errors.title}</Text>
          ) : null}

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catBtn,
                  category === cat && {
                    backgroundColor: CATEGORY_COLORS[cat],
                    borderColor: CATEGORY_COLORS[cat],
                  },
                ]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.catText,
                    category === cat && { color: "#fff" },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price + Location */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price range</Text>
              <TextInput
                style={styles.input}
                value={priceRange}
                onChangeText={setPriceRange}
                placeholder="e.g 40-50"
                placeholderTextColor="#BDBDBD"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g Near Gate 2"
                placeholderTextColor="#BDBDBD"
              />
              {errors.location ? (
                <Text style={styles.errText}>{errors.location}</Text>
              ) : null}
            </View>
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the find in detail..."
            placeholderTextColor="#BDBDBD"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#1A1A1A"
                />
                <Text style={styles.saveTxt}>Save changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Archive */}
          <TouchableOpacity
            style={styles.archiveBtn}
            onPress={handleArchive}
            activeOpacity={0.85}
          >
            <Ionicons name="archive-outline" size={16} color={DANGER} />
            <Text style={styles.archiveTxt}>Archive post</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  content: { padding: 20 },

  /* Warning banner */
  warningCard: {
    backgroundColor: WARNING_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: WARNING_BD,
    padding: 16,
    marginBottom: 8,
  },
  warningTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  warningTitle: { fontSize: 14, fontWeight: "800", color: "#B45309" },
  warningBody: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
    marginBottom: 12,
  },
  warningActions: { flexDirection: "row", gap: 10 },
  stillAccurateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PRIMARY,
  },
  stillAccurateTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
  archiveInsteadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DANGER,
    backgroundColor: "#FFF",
  },
  archiveInsteadTxt: { color: DANGER, fontWeight: "700", fontSize: 13 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 7,
    marginTop: 18,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#222",
  },
  inputError: { borderColor: DANGER },
  textArea: { height: 100, paddingTop: 12 },
  errText: { fontSize: 11, color: DANGER, marginTop: 4 },

  catRow: { flexDirection: "row", gap: 10 },
  catBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  catText: { fontSize: 13, fontWeight: "700", color: "#888" },

  row2: { flexDirection: "row", gap: 12 },

  saveBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  saveTxt: { color: "#1A1A1A", fontSize: 15, fontWeight: "800" },

  archiveBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: DANGER,
    backgroundColor: "#FFF5F5",
  },
  archiveTxt: { color: DANGER, fontSize: 15, fontWeight: "700" },
});
