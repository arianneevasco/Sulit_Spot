// MapPicker.web.tsx  — used on Web only (react-native-maps is NOT imported here)
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY = "#4ECBA4";

export type Coord = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coord: Coord, address: string) => void;
  initialCoord?: Coord | null;
};

// Simple web fallback: user types coordinates or an address manually.
// The map itself isn't rendered on web since react-native-maps is native-only.
export default function MapPicker({
  visible,
  onClose,
  onConfirm,
  initialCoord,
}: Props) {
  const [lat, setLat] = useState(
    initialCoord ? String(initialCoord.latitude) : "",
  );
  const [lng, setLng] = useState(
    initialCoord ? String(initialCoord.longitude) : "",
  );
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      setError("Please enter valid latitude and longitude values.");
      return;
    }
    if (latitude < -90 || latitude > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (longitude < -180 || longitude > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }
    setError("");
    onConfirm(
      { latitude, longitude },
      address.trim() || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Set location</Text>
            <View style={{ width: 52 }} />
          </View>

          {/* Notice */}
          <View style={styles.noticeBanner}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#5B9CF6"
            />
            <Text style={styles.noticeText}>
              Interactive maps require the mobile app. Enter coordinates
              manually or use the app to drop a pin.
            </Text>
          </View>

          {/* Coordinate inputs */}
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="e.g. 14.6537"
            placeholderTextColor="#BDBDBD"
            value={lat}
            onChangeText={(t) => {
              setLat(t);
              setError("");
            }}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="e.g. 121.0685"
            placeholderTextColor="#BDBDBD"
            value={lng}
            onChangeText={(t) => {
              setLng(t);
              setError("");
            }}
            keyboardType="numeric"
          />

          <Text style={styles.label}>
            Address label <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Near Gate 2, UP Diliman"
            placeholderTextColor="#BDBDBD"
            value={address}
            onChangeText={setAddress}
          />

          {/* Helper link */}
          <Text style={styles.helperText}>
            💡 Tip: Open <Text style={styles.helperLink}>maps.google.com</Text>,
            right-click your spot, and copy the coordinates shown at the top of
            the menu.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Web thumbnail — shows a static Google Maps embed via iframe
export function MapThumbnail({ coord }: { coord: Coord }) {
  const src = `https://maps.google.com/maps?q=${coord.latitude},${coord.longitude}&z=16&output=embed`;
  if (Platform.OS === "web") {
    return (
      <iframe
        src={src}
        style={{ width: "100%", height: 140, border: "none" }}
        loading="lazy"
        title="map"
      />
    ) as any;
  }
  return null;
}

// Web map preview on detail screen — static embed
export function MapPreview({
  coord,
  onDirections,
}: {
  coord: Coord;
  onDirections: () => void;
}) {
  const src = `https://maps.google.com/maps?q=${coord.latitude},${coord.longitude}&z=16&output=embed`;
  return (
    <View style={styles.previewWrap}>
      {Platform.OS === "web"
        ? ((
            <iframe
              src={src}
              style={{ width: "100%", height: 160, border: "none" }}
              loading="lazy"
              title="location map"
            />
          ) as any)
        : null}
      <TouchableOpacity style={styles.directionsBtn} onPress={onDirections}>
        <Ionicons name="navigate-outline" size={13} color="#fff" />
        <Text style={styles.directionsBtnText}>Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cancelText: { fontSize: 14, color: "#666", fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, color: "#1D4ED8", lineHeight: 18 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    marginBottom: 6,
    marginTop: 12,
  },
  optional: { fontWeight: "400", color: "#aaa" },
  input: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: "#222",
  },
  inputError: { borderColor: "#EF4444" },
  helperText: {
    fontSize: 11,
    color: "#888",
    marginTop: 12,
    lineHeight: 16,
  },
  helperLink: { color: "#5B9CF6", textDecorationLine: "underline" },
  errorText: { fontSize: 12, color: "#EF4444", marginTop: 8 },
  confirmBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  previewWrap: {
    height: 160,
    position: "relative",
    backgroundColor: "#E8EAE6",
  },
  directionsBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(26,26,26,0.8)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
  },
  directionsBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
