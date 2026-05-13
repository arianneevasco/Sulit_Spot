import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
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

// ── Nominatim reverse geocoding ──────────────────────────────────────────────
async function reverseGeocode(coord: Coord): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coord.latitude}&lon=${coord.longitude}&format=json`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};
    const parts = [
      a.road ?? a.pedestrian ?? a.footway,
      a.neighbourhood ?? a.suburb ?? a.village ?? a.hamlet,
      a.city ?? a.town ?? a.municipality ?? a.county,
      a.state ?? a.region,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : (data.display_name ?? null);
  } catch {
    return null;
  }
}

// ── Leaflet HTML (with search bar) ──────────────────────────────────────────
function buildLeafletHTML(
  lat: number,
  lng: number,
  hasInitial: boolean,
): string {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, sans-serif; }
    body { width: 100%; height: 100vh; overflow: hidden; }
    #map { width: 100%; height: 100%; }

    #searchBox {
      position: absolute; top: 10px; left: 10px; right: 10px;
      z-index: 1000; display: flex; gap: 6px;
    }
    #searchInput {
      flex: 1; height: 40px; border-radius: 20px;
      border: none; padding: 0 16px;
      font-size: 14px; color: #222;
      box-shadow: 0 2px 10px rgba(0,0,0,0.18);
      outline: none;
    }
    #searchInput::placeholder { color: #bbb; }
    #searchBtn {
      width: 40px; height: 40px; border-radius: 20px;
      background: #4ECBA4; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18); flex-shrink: 0;
      font-size: 17px;
    }
    #searchBtn:active { opacity: 0.8; }

    #results {
      position: absolute; top: 58px; left: 10px; right: 10px;
      z-index: 1001; background: #fff; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      max-height: 220px; overflow-y: auto; display: none;
    }
    .result-item {
      padding: 11px 16px; font-size: 13px; color: #333;
      cursor: pointer; border-bottom: 1px solid #F0F0F0; line-height: 1.4;
    }
    .result-item:last-child { border-bottom: none; }
    .result-item:hover { background: #F5FEFA; }
    .place-name { font-weight: 600; color: #1a1a1a; }
    .place-sub { color: #888; font-size: 12px; margin-top: 2px; }

    .locate-btn {
      position: absolute; bottom: 16px; right: 16px; z-index: 999;
      width: 44px; height: 44px; background: #fff; border-radius: 22px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: none; font-size: 18px;
    }

    .spinner-wrap {
      position: absolute; top: 18px; right: 58px; z-index: 1002;
      display: none; align-items: center; justify-content: center;
    }
    .spinner {
      width: 18px; height: 18px;
      border: 2px solid #ddd; border-top-color: #4ECBA4;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="searchBox">
    <input id="searchInput" type="text" placeholder="Search a place..." autocomplete="off"/>
    <button id="searchBtn">&#128269;</button>
  </div>
  <div class="spinner-wrap" id="spinner"><div class="spinner"></div></div>
  <div id="results"></div>
  <button class="locate-btn" id="locateBtn" title="My location">&#128205;</button>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">Leaflet</a> &copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    var greenIcon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:#4ECBA4;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
      iconSize: [28,28], iconAnchor: [14,28], className: ''
    });

    var marker = ${hasInitial ? `L.marker([${lat},${lng}], {icon: greenIcon, draggable: true}).addTo(map)` : "null"};

    function sendCoord(lat, lng) {
      window.parent.postMessage(JSON.stringify({type:'coord',lat:lat,lng:lng}), '*');
    }

    function placeMarker(latlng) {
      if (marker) map.removeLayer(marker);
      marker = L.marker(latlng, {icon: greenIcon, draggable: true}).addTo(map);
      marker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        sendCoord(pos.lat, pos.lng);
      });
      sendCoord(latlng.lat, latlng.lng);
    }

    if (marker) {
      sendCoord(${lat}, ${lng});
      marker.on('dragend', function(e) {
        var pos = e.target.getLatLng();
        sendCoord(pos.lat, pos.lng);
      });
    }

    map.on('click', function(e) { placeMarker(e.latlng); hideResults(); });

    // ── Search ───────────────────────────────────────────────────────────────
    var searchInput = document.getElementById('searchInput');
    var searchBtn   = document.getElementById('searchBtn');
    var resultsBox  = document.getElementById('results');
    var spinner     = document.getElementById('spinner');
    var searchTimer = null;

    function showSpinner() { spinner.style.display = 'flex'; }
    function hideSpinner() { spinner.style.display = 'none'; }
    function hideResults() { resultsBox.style.display = 'none'; resultsBox.innerHTML = ''; }

    function doSearch() {
      var q = searchInput.value.trim();
      if (!q) { hideResults(); return; }
      showSpinner();
      fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=6&addressdetails=1', {
        headers: { 'Accept-Language': 'en' }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        hideSpinner();
        if (!data || data.length === 0) {
          resultsBox.innerHTML = '<div class="result-item" style="color:#aaa;text-align:center">No results found</div>';
          resultsBox.style.display = 'block';
          return;
        }
        resultsBox.innerHTML = '';
        data.forEach(function(item) {
          var a = item.address || {};
          var name = a.road || a.pedestrian || a.neighbourhood || a.suburb || a.village || item.name || '';
          var sub  = [a.city || a.town || a.municipality || a.county, a.state, a.country].filter(Boolean).join(', ');
          var div  = document.createElement('div');
          div.className = 'result-item';
          div.innerHTML = '<div class="place-name">' + (name || sub) + '</div>'
                        + (sub && name ? '<div class="place-sub">' + sub + '</div>' : '');
          div.addEventListener('click', function() {
            var latlng = L.latLng(parseFloat(item.lat), parseFloat(item.lon));
            map.setView(latlng, 17);
            placeMarker(latlng);
            searchInput.value = name || sub;
            hideResults();
          });
          resultsBox.appendChild(div);
        });
        resultsBox.style.display = 'block';
      })
      .catch(function() { hideSpinner(); hideResults(); });
    }

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch(); });
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimer);
      if (!searchInput.value.trim()) { hideResults(); return; }
      searchTimer = setTimeout(doSearch, 500);
    });

    // ── Locate me ────────────────────────────────────────────────────────────
    document.getElementById('locateBtn').addEventListener('click', function() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(function(pos) {
        var latlng = L.latLng(pos.coords.latitude, pos.coords.longitude);
        map.setView(latlng, 17);
        placeMarker(latlng);
      });
    });
  </script>
</body>
</html>`;
  return "data:text/html;charset=utf-8," + encodeURIComponent(html);
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MapPicker({
  visible,
  onClose,
  onConfirm,
  initialCoord,
}: Props) {
  const defaultLat = initialCoord?.latitude ?? 14.6537;
  const defaultLng = initialCoord?.longitude ?? 121.0685;
  const [pickedCoord, setPickedCoord] = useState<Coord | null>(
    initialCoord ?? null,
  );
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const iframeRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "coord") {
          const coord: Coord = { latitude: data.lat, longitude: data.lng };
          setPickedCoord(coord);
          setAddress(null);
          setLoadingAddress(true);
          reverseGeocode(coord).then((name) => {
            setAddress(name);
            setLoadingAddress(false);
          });
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (visible) {
      setPickedCoord(initialCoord ?? null);
      setAddress(null);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!pickedCoord) return;
    const finalAddress =
      address ??
      `${pickedCoord.latitude.toFixed(5)}, ${pickedCoord.longitude.toFixed(5)}`;
    onConfirm(pickedCoord, finalAddress);
  };

  const mapSrc = buildLeafletHTML(defaultLat, defaultLng, !!initialCoord);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Drop a pin</Text>
          <View style={{ width: 70 }} />
        </View>

        <Text style={styles.hint}>
          Tap the map or drag the pin to set the exact location
        </Text>

        {/* Map */}
        <View style={styles.mapWrap}>
          {Platform.OS === "web"
            ? ((
                <iframe
                  ref={iframeRef}
                  src={mapSrc}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="map picker"
                />
              ) as any)
            : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {pickedCoord ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={PRIMARY} />
              {loadingAddress ? (
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                  style={{ marginLeft: 4 }}
                />
              ) : (
                <Text style={styles.locationText} numberOfLines={2}>
                  {address ??
                    `${pickedCoord.latitude.toFixed(5)}° N, ${pickedCoord.longitude.toFixed(5)}° E`}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.locationHint}>Tap anywhere on the map</Text>
          )}
          <TouchableOpacity
            style={[
              styles.confirmBtn,
              !pickedCoord && styles.confirmBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!pickedCoord}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── MapThumbnail ──────────────────────────────────────────────────────────────
export function MapThumbnail({ coord }: { coord: Coord }) {
  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>*{margin:0;padding:0}body,#map{width:100%;height:100vh;}</style>
  </head><body><div id="map"></div><script>
    var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false}).setView([${coord.latitude},${coord.longitude}],16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var icon=L.divIcon({html:'<div style="width:22px;height:22px;background:#4ECBA4;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',iconSize:[22,22],iconAnchor:[11,22],className:''});
    L.marker([${coord.latitude},${coord.longitude}],{icon:icon}).addTo(map);
  </script></body></html>`;
  const src = "data:text/html;charset=utf-8," + encodeURIComponent(html);
  if (Platform.OS === "web") {
    return (
      <iframe
        src={src}
        style={{ width: "100%", height: 140, border: "none" }}
        title="map thumbnail"
      />
    ) as any;
  }
  return null;
}

// ── MapPreview ────────────────────────────────────────────────────────────────
export function MapPreview({
  coord,
  onDirections,
}: {
  coord: Coord;
  onDirections: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoords = () => {
    const text = `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
    try {
      Clipboard.setString(text);
    } catch {}
    if (Platform.OS === "web") {
      try {
        (navigator as any).clipboard?.writeText(text);
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const html = `<!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>*{margin:0;padding:0}body,#map{width:100%;height:100vh;}</style>
  </head><body><div id="map"></div><script>
    var map=L.map('map',{zoomControl:false,attributionControl:false,dragging:true,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:true}).setView([${coord.latitude},${coord.longitude}],16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var icon=L.divIcon({html:'<div style="width:26px;height:26px;background:#4ECBA4;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',iconSize:[26,26],iconAnchor:[13,26],className:''});
    L.marker([${coord.latitude},${coord.longitude}],{icon:icon}).addTo(map);
  </script></body></html>`;
  const src = "data:text/html;charset=utf-8," + encodeURIComponent(html);

  return (
    <View style={styles.previewWrap}>
      {Platform.OS === "web"
        ? ((
            <iframe
              src={src}
              style={{ width: "100%", height: "100%", border: "none" }}
              title="location map"
            />
          ) as any)
        : null}
      <View style={styles.mapBtnRow}>
        <TouchableOpacity style={styles.mapActionBtn} onPress={onDirections}>
          <Ionicons name="navigate-outline" size={14} color="#fff" />
          <Text style={styles.mapActionBtnText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapActionBtn, styles.mapActionBtnSecondary]}
          onPress={handleCopyCoords}
        >
          <Ionicons
            name={copied ? "checkmark-outline" : "copy-outline"}
            size={14}
            color={copied ? PRIMARY : "#333"}
          />
          <Text
            style={[
              styles.mapActionBtnText,
              styles.mapActionBtnTextSecondary,
              copied && { color: PRIMARY },
            ]}
          >
            {copied ? "Copied!" : "Copy coords"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 14,
  },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  cancelText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  hint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  mapWrap: { flex: 1, backgroundColor: "#E8EAE6" },
  footer: {
    padding: 16,
    paddingBottom: 24,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  locationRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  locationText: { fontSize: 13, fontWeight: "600", color: "#444", flex: 1 },
  locationHint: { fontSize: 13, color: "#aaa", textAlign: "center" },
  confirmBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  previewWrap: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E8EAE6",
  },
  mapBtnRow: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  mapActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(26,26,26,0.82)",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  mapActionBtnSecondary: { backgroundColor: "rgba(255,255,255,0.92)" },
  mapActionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  mapActionBtnTextSecondary: { color: "#333" },
});
