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
const GRAY_BG = "#F5F6FA";
const CATEGORIES = ["Food", "Items", "Tips"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

export default function AddPostScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [priceRange, setPriceRange] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!category) e.category = "Please select a category.";
    if (!location.trim()) e.location = "Location is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // TODO: await postService.createPost({ title, category, priceRange, location, description });
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert("Posted!", "Your find has been shared with the community.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not share post.");
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="e.g Siomai rice"
            placeholderTextColor="#BDBDBD"
            value={title}
            onChangeText={setTitle}
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
          {errors.category ? (
            <Text style={styles.errText}>{errors.category}</Text>
          ) : null}

          {/* Price + Location */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price range</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g 40-50"
                placeholderTextColor="#BDBDBD"
                value={priceRange}
                onChangeText={setPriceRange}
                keyboardType="default"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="e.g Near Gate 2"
                placeholderTextColor="#BDBDBD"
                value={location}
                onChangeText={setLocation}
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
            placeholder="Describe the find in detail..."
            placeholderTextColor="#BDBDBD"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Photo */}
          <Text style={styles.label}>
            Photo <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TouchableOpacity style={styles.photoBox} activeOpacity={0.8}>
            <View style={styles.photoIconBg}>
              <Ionicons name="camera-outline" size={26} color={PRIMARY} />
            </View>
            <Text style={styles.photoText}>Camera or Gallery</Text>
            <Text style={styles.photoSubText}>Tap to attach a photo</Text>
          </TouchableOpacity>

          {/* Map pin */}
          <Text style={styles.label}>
            Map pin <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TouchableOpacity style={styles.mapBox} activeOpacity={0.8}>
            <View style={styles.mapIconBg}>
              <Ionicons name="location-outline" size={26} color={PRIMARY} />
            </View>
            <Text style={styles.mapText}>Tap to drop a pin</Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={styles.submitText}>Share this find</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GRAY_BG },

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

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 7,
    marginTop: 18,
  },
  optional: { fontWeight: "400", color: "#aaa" },

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
  inputError: { borderColor: "#EF4444" },
  textArea: { height: 100, paddingTop: 12 },
  errText: { fontSize: 11, color: "#EF4444", marginTop: 4 },

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

  photoBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    paddingVertical: 24,
    alignItems: "center",
    gap: 6,
  },
  photoIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${PRIMARY}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: { fontSize: 14, fontWeight: "700", color: "#333" },
  photoSubText: { fontSize: 12, color: "#aaa" },

  mapBox: {
    backgroundColor: "#E8F5F0",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#C5E8DC",
    borderStyle: "dashed",
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  mapIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${PRIMARY}25`,
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: { fontSize: 14, fontWeight: "600", color: PRIMARY },

  submitBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
