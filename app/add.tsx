import MapPicker, { Coord, MapThumbnail } from "@/components/MapPicker";
import { usePhotoPicker } from "@/hooks/usePhotoPicker";
import { createPost } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
  Tips: "#9B5DE5",
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

  // Photo
  const {
    localUri,
    setLocalUri,
    uploading,
    showActionSheet,
    setShowActionSheet,
    pickFromCamera,
    pickFromGallery,
    uploadPhoto,
  } = usePhotoPicker();

  // Map
  const [showMap, setShowMap] = useState(false);
  const [pinnedCoord, setPinnedCoord] = useState<Coord | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!category) e.category = "Please select a category.";
    if (!location.trim()) e.location = "Location is required.";
    if (!description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Upload photo first if one was picked
      let photoURL: string | null = null;
      if (localUri) {
        photoURL = await uploadPhoto(localUri);
      }

      await createPost({
        title,
        description,
        category:
          category === "Items" ? "Item" : category === "Tips" ? "Tip" : "Food",
        priceRange,
        locationText: location,
        photoURL,
        latitude: pinnedCoord?.latitude ?? null,
        longitude: pinnedCoord?.longitude ?? null,
      });

      Alert.alert("Posted!", "Your find has been shared with the community.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not share post.");
    } finally {
      setLoading(false);
    }
  };

  const handlePinConfirm = (coord: Coord, address: string) => {
    setPinnedCoord(coord);
    setPinnedAddress(address);
    if (!location.trim()) setLocation(address);
    setShowMap(false);
  };

  const removePin = () => {
    setPinnedCoord(null);
    setPinnedAddress(null);
  };

  const removePhoto = () => {
    Alert.alert("Remove photo", "Remove the attached photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setLocalUri(null),
      },
    ]);
  };

  const isSubmitting = loading || uploading;

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
            placeholder="e.g Siomai rice for 39 pesos"
            placeholderTextColor="#BDBDBD"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setErrors((e) => ({ ...e, title: undefined! }));
            }}
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
                placeholder="e.g ₱35–₱50"
                placeholderTextColor="#BDBDBD"
                value={priceRange}
                onChangeText={setPriceRange}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="e.g Near Gate 2"
                placeholderTextColor="#BDBDBD"
                value={location}
                onChangeText={(t) => {
                  setLocation(t);
                  setErrors((e) => ({ ...e, location: undefined! }));
                }}
              />
              {errors.location ? (
                <Text style={styles.errText}>{errors.location}</Text>
              ) : null}
            </View>
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              errors.description && styles.inputError,
            ]}
            placeholder="Describe the find — hours, quantity, where exactly..."
            placeholderTextColor="#BDBDBD"
            value={description}
            onChangeText={(t) => {
              setDescription(t);
              setErrors((e) => ({ ...e, description: undefined! }));
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description ? (
            <Text style={styles.errText}>{errors.description}</Text>
          ) : null}

          {/* ── Photo ── */}
          <Text style={styles.label}>
            Photo <Text style={styles.optional}>(Optional)</Text>
          </Text>

          {localUri ? (
            // Preview of picked image
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: localUri }}
                style={styles.previewImg}
                resizeMode="cover"
              />
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                  <Text style={styles.uploadPct}>Uploading…</Text>
                </View>
              )}
              {!uploading && (
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={removePhoto}
                >
                  <Ionicons name="close-circle" size={26} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={() => setShowActionSheet(true)}
              >
                <Ionicons name="camera-outline" size={14} color="#fff" />
                <Text style={styles.changePhotoBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Pick button
            <TouchableOpacity
              style={styles.photoBox}
              activeOpacity={0.8}
              onPress={() => setShowActionSheet(true)}
            >
              <View style={styles.photoIconBg}>
                <Ionicons name="camera-outline" size={26} color={PRIMARY} />
              </View>
              <Text style={styles.photoText}>Camera or Gallery</Text>
              <Text style={styles.photoSubText}>Tap to attach a photo</Text>
            </TouchableOpacity>
          )}

          {/* ── Map pin ── */}
          <Text style={styles.label}>
            Map pin <Text style={styles.optional}>(Optional)</Text>
          </Text>

          {pinnedCoord ? (
            <View style={styles.pinnedBox}>
              <MapThumbnail coord={pinnedCoord} />
              <View style={styles.pinnedFooter}>
                <Ionicons name="location" size={14} color={PRIMARY} />
                <Text style={styles.pinnedAddr} numberOfLines={1}>
                  {pinnedAddress ??
                    `${pinnedCoord.latitude.toFixed(5)}, ${pinnedCoord.longitude.toFixed(5)}`}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMap(true)}
                  style={styles.pinnedEdit}
                >
                  <Text style={styles.pinnedEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={removePin}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mapBox}
              activeOpacity={0.8}
              onPress={() => setShowMap(true)}
            >
              <View style={styles.mapIconBg}>
                <Ionicons name="location-outline" size={26} color={PRIMARY} />
              </View>
              <Text style={styles.mapText}>Tap to drop a pin</Text>
              <Text style={styles.mapSubText}>
                Helps others find this exact spot
              </Text>
            </TouchableOpacity>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
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

      {/* ── Photo action sheet ── */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a photo</Text>

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={pickFromCamera}
              activeOpacity={0.8}
            >
              <View style={styles.sheetIconBg}>
                <Ionicons name="camera-outline" size={22} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.sheetBtnLabel}>Take a photo</Text>
                <Text style={styles.sheetBtnSub}>Use your camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetBtn}
              onPress={pickFromGallery}
              activeOpacity={0.8}
            >
              <View style={styles.sheetIconBg}>
                <Ionicons name="images-outline" size={22} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.sheetBtnLabel}>Choose from gallery</Text>
                <Text style={styles.sheetBtnSub}>Pick from your photos</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetBtn, styles.sheetCancelBtn]}
              onPress={() => setShowActionSheet(false)}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Map picker ── */}
      <MapPicker
        visible={showMap}
        onClose={() => setShowMap(false)}
        onConfirm={handlePinConfirm}
        initialCoord={pinnedCoord}
      />
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

  /* Photo */
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
  photoPreview: {
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: PRIMARY,
    position: "relative",
  },
  previewImg: { width: "100%", height: "100%" },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadPct: { color: "#fff", fontWeight: "700", fontSize: 16 },
  removePhotoBtn: { position: "absolute", top: 8, right: 8 },
  changePhotoBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  changePhotoBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  /* Map */
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
  mapText: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  mapSubText: { fontSize: 12, color: "#88BBAA" },
  pinnedBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  pinnedFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  pinnedAddr: { flex: 1, fontSize: 12, fontWeight: "600", color: "#333" },
  pinnedEdit: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${PRIMARY}15`,
    borderRadius: 8,
  },
  pinnedEditText: { fontSize: 11, fontWeight: "700", color: PRIMARY },

  /* Submit */
  submitBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    elevation: 6,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  /* Action sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E0E0E0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  sheetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  sheetIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnLabel: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  sheetBtnSub: { fontSize: 12, color: "#888", marginTop: 2 },
  sheetCancelBtn: {
    borderBottomWidth: 0,
    justifyContent: "center",
    marginTop: 4,
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    textAlign: "center",
    flex: 1,
  },
});
