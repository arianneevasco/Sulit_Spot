import { createPost } from "@/services/postService";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import type { Region } from "react-native-maps";
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  // Static import for native only
  // @ts-ignore
  MapView = require("react-native-maps").default;
  // @ts-ignore
  Marker = require("react-native-maps").Marker;
}

const PRIMARY = "#4ECBA4";
const GRAY_BG = "#F5F6FA";
const CATEGORIES = ["Food", "Items", "Tips"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "#4ECBA4",
  Items: "#5B9CF6",
  Tips: "#F6A94A",
};

// Default region: University of the Philippines Diliman
const DEFAULT_REGION: Region = {
  latitude: 14.6537,
  longitude: 121.0685,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
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

  // Map state
  const [showMap, setShowMap] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [markerCoord, setMarkerCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [pinnedCoord, setPinnedCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

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
    const postCategory: "Food" | "Item" | "Tip" =
      category === "Items" ? "Item" : category === "Tips" ? "Tip" : "Food";
    setLoading(true);
    try {
      await createPost({
        title,
        description,
        category: postCategory,
        priceRange,
        locationText: location,
        photoURL: null,
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

  const openMapPicker = async () => {
    setShowMap(true);
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coord = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        const region: Region = {
          ...coord,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMarkerCoord(coord);
        setMapRegion(region);
        mapRef.current?.animateToRegion(region, 600);
      } else {
        setMarkerCoord({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
        });
      }
    } catch {
      setMarkerCoord({
        latitude: DEFAULT_REGION.latitude,
        longitude: DEFAULT_REGION.longitude,
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (e: any) => {
    setMarkerCoord(e.nativeEvent.coordinate);
  };

  const handleMarkerDragEnd = (e: any) => {
    setMarkerCoord(e.nativeEvent.coordinate);
  };

  const confirmPin = async () => {
    if (!markerCoord) return;
    setPinnedCoord(markerCoord);
    try {
      const results = await Location.reverseGeocodeAsync(markerCoord);
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city].filter(Boolean);
        const addr =
          parts.join(", ") || r.formattedAddress || "Selected location";
        setPinnedAddress(addr);
        if (!location.trim()) setLocation(addr);
      }
    } catch {
      setPinnedAddress(
        `${markerCoord.latitude.toFixed(5)}, ${markerCoord.longitude.toFixed(5)}`,
      );
    }
    setShowMap(false);
  };

  const removePin = () => {
    setPinnedCoord(null);
    setPinnedAddress(null);
    setMarkerCoord(null);
  };

  const recenterToMyLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const coord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const region: Region = {
        ...coord,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
      setMarkerCoord(coord);
      mapRef.current?.animateToRegion(region, 500);
    } catch {
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Price range</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g 40-50"
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
                onChangeText={setLocation}
              />
              {errors.location ? (
                <Text style={styles.errText}>{errors.location}</Text>
              ) : null}
            </View>
          </View>

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

          {pinnedCoord ? (
            <View style={styles.pinnedBox}>
              {Platform.OS !== "web" && MapView && Marker ? (
                <MapView
                  style={styles.miniMap}
                  region={{
                    latitude: pinnedCoord.latitude,
                    longitude: pinnedCoord.longitude,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                >
                  <Marker coordinate={pinnedCoord} pinColor={PRIMARY} />
                </MapView>
              ) : (
                <View
                  style={[
                    styles.miniMap,
                    { alignItems: "center", justifyContent: "center" },
                  ]}
                >
                  <Text>Map preview not available on web</Text>
                </View>
              )}
              <View style={styles.pinnedFooter}>
                <Ionicons name="location" size={14} color={PRIMARY} />
                <Text style={styles.pinnedAddr} numberOfLines={1}>
                  {pinnedAddress ??
                    `${pinnedCoord.latitude.toFixed(5)}, ${pinnedCoord.longitude.toFixed(5)}`}
                </Text>
                <TouchableOpacity
                  onPress={openMapPicker}
                  style={styles.pinnedEdit}
                >
                  <Text style={styles.pinnedEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={removePin}
                  style={styles.pinnedRemove}
                >
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.mapBox}
              activeOpacity={0.8}
              onPress={openMapPicker}
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

      {/* Map picker modal */}
      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMap(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowMap(false)}
              style={styles.modalCancelBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Drop a pin</Text>
            <View style={{ width: 64 }} />
          </View>

          <Text style={styles.modalHint}>
            Tap the map or drag the pin to set the exact location
          </Text>

          <View style={styles.mapContainer}>
            {Platform.OS !== "web" && MapView && Marker ? (
              <>
                {loadingLocation && (
                  <View style={styles.mapOverlay}>
                    <ActivityIndicator color={PRIMARY} size="large" />
                    <Text style={styles.mapOverlayText}>
                      Finding your location…
                    </Text>
                  </View>
                )}
                <MapView
                  ref={mapRef}
                  style={StyleSheet.absoluteFillObject}
                  initialRegion={mapRegion}
                  onPress={handleMapPress}
                  showsUserLocation
                  showsMyLocationButton={false}
                >
                  {markerCoord && (
                    <Marker
                      coordinate={markerCoord}
                      draggable
                      onDragEnd={handleMarkerDragEnd}
                      pinColor={PRIMARY}
                    />
                  )}
                </MapView>

                <TouchableOpacity
                  style={styles.myLocBtn}
                  onPress={recenterToMyLocation}
                  activeOpacity={0.85}
                >
                  <Ionicons name="locate" size={20} color={PRIMARY} />
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={[
                  styles.mapOverlay,
                  { alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Text>Map picker not available on web</Text>
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            {markerCoord ? (
              <View style={styles.coordRow}>
                <Ionicons name="location" size={16} color={PRIMARY} />
                <Text style={styles.coordText}>
                  {markerCoord.latitude.toFixed(5)}° N,{" "}
                  {markerCoord.longitude.toFixed(5)}° E
                </Text>
              </View>
            ) : (
              <Text style={styles.coordHint}>Tap anywhere on the map</Text>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !markerCoord && styles.confirmBtnDisabled,
              ]}
              onPress={confirmPin}
              disabled={!markerCoord}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.confirmBtnText}>Confirm location</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  mapText: { fontSize: 14, fontWeight: "700", color: PRIMARY },
  mapSubText: { fontSize: 12, color: "#88BBAA" },
  pinnedBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  miniMap: { height: 140, width: "100%" },
  pinnedFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#fff",
  },
  pinnedAddr: { flex: 1, fontSize: 12, fontWeight: "600", color: "#333" },
  pinnedEdit: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${PRIMARY}15`,
    borderRadius: 8,
  },
  pinnedEditText: { fontSize: 11, fontWeight: "700", color: PRIMARY },
  pinnedRemove: { padding: 2 },
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
  modalSafe: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalCancelBtn: { padding: 4 },
  modalCancelText: { fontSize: 14, color: "#666", fontWeight: "600" },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  modalHint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  mapContainer: { flex: 1, position: "relative" },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  mapOverlayText: { fontSize: 13, color: "#666" },
  myLocBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 10,
  },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coordText: { fontSize: 13, fontWeight: "600", color: "#444" },
  coordHint: { fontSize: 13, color: "#aaa", textAlign: "center" },
  confirmBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
