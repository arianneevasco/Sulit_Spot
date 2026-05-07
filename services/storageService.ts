// ...existing code from storageService.js...
// services/storageService.js
// Photo upload via Cloudinary (free — no Firebase Storage plan needed)
// Flow: local URI → Cloudinary → returns download URL → saved as photoURL in Firestore
//
// NOTE: Photo DELETION is handled server-side by the onPostArchived Cloud Function
// in functions/src/index.js. When a post is archived (isArchived: true), the function
// triggers automatically, extracts the public_id from photoURL, and calls the Cloudinary
// Admin API using secrets stored in Firebase. The client never needs to call delete directly.

import * as ImagePicker from "expo-image-picker";
import { auth } from "./firebase";

const CLOUDINARY_CLOUD_NAME =
  process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

// ── Pick from gallery ────────────────────────────────────────────────────────
export const pickImageFromLibrary = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Gallery permission denied. Allow it in device settings.");
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
};

// ── Capture from camera ───────────────────────────────────────────────────────
export const pickImageFromCamera = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Camera permission denied. Allow it in device settings.");
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
};

// ── Upload to Cloudinary ──────────────────────────────────────────────────────
// Returns the public HTTPS download URL to save as photoURL in Firestore

export const uploadPostPhoto = async (
  localUri: string,
): Promise<string | null> => {
  if (!localUri) return null;

  const user = auth.currentUser;
  if (!user) throw new Error("Login required to upload photos.");

  const formData = new FormData();
  formData.append("file", {
    uri: localUri,
    type: "image/jpeg",
    name: `${Date.now()}.jpg`,
  } as any); // React Native FormData file object
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET ?? "");
  formData.append("folder", `sulitspot/posts/${user.uid}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!res.ok) throw new Error("Photo upload failed. Check Cloudinary config.");

  const data = await res.json();
  return data.secure_url;
};
