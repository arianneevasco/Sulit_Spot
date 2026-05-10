// hooks/usePhotoPicker.ts
//
// Reusable hook for picking a photo (camera or gallery) and uploading
// it to Cloudinary via storageService.ts (free — no Firebase Storage fee).
//
// Returns:
//   localUri          — local file URI for instant preview before upload
//   setLocalUri       — lets a screen pre-fill from an existing photoURL
//   uploading         — true while the Cloudinary upload is in progress
//   showActionSheet   — controls the camera/gallery bottom-sheet
//   setShowActionSheet
//   pickFromCamera    — open device camera
//   pickFromGallery   — open photo library
//   uploadPhoto(uri)  — upload to Cloudinary → resolves to download URL

import {
    pickImageFromCamera,
    pickImageFromLibrary,
    uploadPostPhoto,
} from "@/services/storageService";
import { useState } from "react";
import { Alert } from "react-native";

export type UsePhotoPickerReturn = {
  localUri: string | null;
  setLocalUri: (uri: string | null) => void;
  uploading: boolean;
  showActionSheet: boolean;
  setShowActionSheet: (v: boolean) => void;
  pickFromCamera: () => Promise<void>;
  pickFromGallery: () => Promise<void>;
  uploadPhoto: (uri: string) => Promise<string>;
};

export function usePhotoPicker(): UsePhotoPickerReturn {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const pickFromCamera = async () => {
    setShowActionSheet(false);
    try {
      const uri = await pickImageFromCamera();
      if (uri) setLocalUri(uri);
    } catch (e: any) {
      Alert.alert("Camera error", e.message || "Could not open camera.");
    }
  };

  const pickFromGallery = async () => {
    setShowActionSheet(false);
    try {
      const uri = await pickImageFromLibrary();
      if (uri) setLocalUri(uri);
    } catch (e: any) {
      Alert.alert("Gallery error", e.message || "Could not open gallery.");
    }
  };

  const uploadPhoto = async (uri: string): Promise<string> => {
    setUploading(true);
    try {
      const url = await uploadPostPhoto(uri);
      if (!url) throw new Error("Upload returned no URL.");
      return url;
    } finally {
      setUploading(false);
    }
  };

  return {
    localUri,
    setLocalUri,
    uploading,
    showActionSheet,
    setShowActionSheet,
    pickFromCamera,
    pickFromGallery,
    uploadPhoto,
  };
}
