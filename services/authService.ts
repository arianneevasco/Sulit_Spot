// ...existing code from authService.js...
// ─────────────────────────────────────────────────────────────────────────────
// services/authService.js
// Firebase Authentication — Register, Login, Logout
//
// On Register : creates Auth account → sets displayName → writes users/{uid} doc
//               → saves FCM push token to Firestore
// On Login    : signs in → refreshes FCM token (token can change after reinstall)
// On Logout   : clears FCM token so no notifications fire to this device after logout
// ─────────────────────────────────────────────────────────────────────────────

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateEmail,
    updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getFCMToken } from "./notificationService";

// ── REGISTER ──────────────────────────────────────────────────────────────────
// Creates a new Firebase Auth user + Firestore user document
// Returns { user } on success | throws Error on failure
export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  // 1. Create Firebase Auth account
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.toLowerCase().trim(),
    password,
  );
  const user = credential.user;

  // 2. Set display name on Auth profile (used throughout the app as userName)
  await updateProfile(user, { displayName: name.trim() });

  // 3. Get device push notification token (null if permission denied)
  const fcmToken = await getFCMToken();

  // 4. Write user document to Firestore
  await setDoc(doc(db, "users", user.uid), {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    fcmToken: fcmToken || null,
    createdAt: serverTimestamp(),
  });

  return { user };
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// Returns { user } on success | throws Error on failure
export const loginUser = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.toLowerCase().trim(),
    password,
  );
  const user = credential.user;

  // Refresh FCM token on every login — token can change after reinstalling the app
  const fcmToken = await getFCMToken();
  if (fcmToken) {
    await updateDoc(doc(db, "users", user.uid), { fcmToken });
  }

  return { user };
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
// Clears FCM token first so push notifications stop going to this device
export const logoutUser = async () => {
  const user = auth.currentUser;
  if (user) {
    // Remove token — notifications won't fire to logged-out users
    await updateDoc(doc(db, "users", user.uid), { fcmToken: null });
  }
  await signOut(auth);
};

// ── UPDATE USER PROFILE ─────────────────────────────────────────────────────
// Updates Firebase Auth displayName and Firestore user document
// Accepts: { name, email } (email optional, only updates if provided)
export const updateUserProfile = async ({
  name,
  email,
}: {
  name?: string;
  email?: string;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  // Update displayName in Firebase Auth
  if (name) {
    await updateProfile(user, { displayName: name.trim() });
  }

  // FIX: Also update the email on the Firebase Auth account, not just Firestore.
  // Previously, only the Firestore doc was updated, leaving the Auth email
  // stale — meaning the user couldn't log in with the new email.
  // Note: Firebase may require recent re-authentication before allowing email
  // changes (throws auth/requires-recent-login). Surface that to the user.
  if (email) {
    await updateEmail(user, email.toLowerCase().trim());
  }

  // Update Firestore user document
  const updates: { name?: string; email?: string } = {};
  if (name) updates.name = name.trim();
  if (email) updates.email = email.toLowerCase().trim();
  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, "users", user.uid), updates);
  }

  return { user };
};
