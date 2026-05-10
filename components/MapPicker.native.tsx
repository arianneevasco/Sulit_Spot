// MapPicker.native.tsx  — used on iOS & Android only
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

const PRIMARY = "#4ECBA4";

const DEFAULT_REGION: Region = {
  latitude: 14.6537,
  longitude: 121.0685,
  latitudeDelta: 0.008,
  longitudeDelta: 0.008,
};

export type Coord = { latitude: number; longitude: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (coord: Coord, address: string) => void;
  initialCoord?: Coord | null;
};

export default function MapPicker({
  visible,
  onClose,
  onConfirm,
  initialCoord,
}: Props) {
  const [markerCoord, setMarkerCoord] = useState<Coord | null>(
    initialCoord ?? null,
  );
  const [mapRegion, setMapRegion] = useState<Region>(
    initialCoord
      ? { ...initialCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      : DEFAULT_REGION,
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<MapView>(null);

  const flyToCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMarkerCoord({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
        });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coord: Coord = {
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
    } catch {
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleConfirm = async () => {
    if (!markerCoord) return;
    let address = `${markerCoord.latitude.toFixed(5)}, ${markerCoord.longitude.toFixed(5)}`;
    try {
      const results = await Location.reverseGeocodeAsync(markerCoord);
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city].filter(Boolean);
        if (parts.length > 0) address = parts.join(", ");
      }
    } catch {}
    onConfirm(markerCoord, address);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Drop a pin</Text>
          <View style={{ width: 64 }} />
        </View>

        <Text style={styles.hint}>
          Tap the map or drag the pin to set the exact location
        </Text>

        {/* Map */}
        <View style={styles.mapWrap}>
          {loadingLocation && (
            <View style={styles.overlay}>
              <ActivityIndicator color={PRIMARY} size="large" />
              <Text style={styles.overlayText}>Finding your location…</Text>
            </View>
          )}
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={mapRegion}
            onPress={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {markerCoord && (
              <Marker
                coordinate={markerCoord}
                draggable
                onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
                pinColor={PRIMARY}
              />
            )}
          </MapView>

          {/* Locate me button */}
          <TouchableOpacity
            style={styles.locateBtn}
            onPress={flyToCurrentLocation}
          >
            <Ionicons name="locate" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
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
            onPress={handleConfirm}
            disabled={!markerCoord}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Native mini-map thumbnail shown after pin is confirmed
export function MapThumbnail({ coord }: { coord: Coord }) {
  return (
    <MapView
      style={styles.miniMap}
      region={{ ...coord, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      pointerEvents="none"
    >
      <Marker coordinate={coord} pinColor={PRIMARY} />
    </MapView>
  );
}

// Native map preview on detail screen
export function MapPreview({
  coord,
  onDirections,
}: {
  coord: Coord;
  onDirections: () => void;
}) {
  return (
    <View style={styles.previewWrap}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        region={{ ...coord, latitudeDelta: 0.003, longitudeDelta: 0.003 }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <Marker coordinate={coord} pinColor={PRIMARY} />
      </MapView>
      <TouchableOpacity style={styles.directionsBtn} onPress={onDirections}>
        <Ionicons name="navigate-outline" size={13} color="#fff" />
        <Text style={styles.directionsBtnText}>Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 14, color: "#666", fontWeight: "600" },
  title: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  mapWrap: { flex: 1, position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    gap: 12,
  },
  overlayText: { fontSize: 13, color: "#666" },
  locateBtn: {
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
  footer: {
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
  miniMap: { height: 140, width: "100%" },
  previewWrap: { height: 160, position: "relative" },
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
  },
  directionsBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
