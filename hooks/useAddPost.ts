import { useEffect, useRef, useState } from "react";
import { suggestCategory } from "../services/aiService";
import { createPost } from "../services/postService";
import {
    pickImageFromCamera,
    pickImageFromLibrary,
    uploadPostPhoto,
} from "../services/storageService";

type Category = "Food" | "Item" | "Tip";

const DEBOUNCE_MS = 1000;

export const useAddPost = () => {
  // —— Form state ————————————————————————————————————————————————
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<Category | "">("");
  const [priceRange, setPriceRange] = useState<string>("");
  const [locationText, setLocationText] = useState<string>("");

  // —— Image state ————————————————————————————————————————————————
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState<string | null>(null);

  // —— AI suggestion state ————————————————————————————————————————
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(
    null,
  );
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  // —— Submission state ——————————————————————————————————————————
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // —— Debounce timer ref ————————————————————————————————————————
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ————————————————————————————————————————————————————————————————
  // AI CATEGORY SUGGESTION — fires 1 s after user stops typing in title
  // ————————————————————————————————————————————————————————————————
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (category) {
      setSuggestedCategory(null);
      return;
    }

    if (!title) {
      setSuggestedCategory(null);
      return;
    }

    setIsSuggesting(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const suggestion = await suggestCategory(title);
        setSuggestedCategory(suggestion);
      } catch {
        setSuggestedCategory(null);
      } finally {
        setIsSuggesting(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [title, category]);

  // —— Image handlers ————————————————————————————————————————————
  const handlePickFromLibrary = async () => {
    try {
      const uri = await pickImageFromLibrary();
      if (uri) setLocalImageUri(uri);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to pick image.");
    }
  };

  const handlePickFromCamera = async () => {
    try {
      const uri = await pickImageFromCamera();
      if (uri) setLocalImageUri(uri);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to open camera.");
    }
  };

  // —— Submit handler ————————————————————————————————————————————
  const handleSubmit = async () => {
    if (submitting) return;
    if (!category) {
      setError("Please select a category.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let photoURL: string | null = null;
      if (localImageUri) {
        photoURL = await uploadPostPhoto(localImageUri);
        setUploadedPhotoURL(photoURL); // ← sync state so UI can show the uploaded URL
      }
      await createPost({
        title,
        description,
        category: category as Category,
        priceRange,
        locationText,
        photoURL,
      });
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create post.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    priceRange,
    setPriceRange,
    locationText,
    setLocationText,
    localImageUri,
    uploadedPhotoURL,
    suggestedCategory,
    isSuggesting,
    submitting,
    error,
    success,
    handlePickFromLibrary,
    handlePickFromCamera,
    handleSubmit,
  };
};
