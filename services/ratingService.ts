// services/ratingService.ts
// Firestore subcollection: posts/{postId}/ratings/{userId}
//
// Document ID = userId → enforces exactly one rating per user per post
// ratingAverage and ratingCount stored on the parent post document,
// recalculated inside a transaction to prevent race conditions.

import {
    collection,
    doc,
    getDoc,
    getDocs,
    runTransaction,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT OR UPDATE RATING
//
// FIX: The entire flow (write rating + recalculate average) is wrapped in a
// single transaction. Previously, getDocs() was called inside the transaction
// but getDocs is NOT a transactional read — only tx.get(docRef) is. This
// caused a race condition where two concurrent raters could both read the
// same stale snapshot, producing an incorrect average.
//
// New approach:
//   1. Fetch all existing rating doc refs (one-time, outside transaction)
//   2. Inside the transaction, tx.get() each ref so Firestore tracks them
//   3. Write the new rating and update the post average — all atomically
// ─────────────────────────────────────────────────────────────────────────────
export const submitRating = async (
  postId: string,
  value: number,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required to rate.");
  if (!value || value < 1 || value > 5)
    throw new Error("Rating must be between 1 and 5.");

  const ratingRef = doc(db, "posts", postId, "ratings", user.uid);
  const postRef = doc(db, "posts", postId);
  const ratingsCol = collection(db, "posts", postId, "ratings");

  // Fetch the list of existing rating document refs once, outside the
  // transaction. We only need the refs (IDs) so we can tx.get() each one
  // inside the transaction. Firestore will retry the transaction if any
  // of those docs change before it commits.
  const existingSnap = await getDocs(ratingsCol);
  const ratingDocRefs = existingSnap.docs.map((d) => d.ref);

  await runTransaction(db, async (tx) => {
    // Transactionally read every existing rating doc
    const ratingSnaps = await Promise.all(
      ratingDocRefs.map((ref) => tx.get(ref)),
    );

    // Also read the current user's rating doc (may or may not exist yet)
    const myRatingSnap = await tx.get(ratingRef);

    // Build values array — skip current user's old value (replaced below)
    const values: number[] = [];
    for (const snap of ratingSnaps) {
      if (snap.id === user.uid) continue; // will be replaced with new value
      if (snap.exists()) {
        values.push(snap.data().value as number);
      }
    }
    values.push(value); // add/replace current user's rating

    const count = values.length;
    const average =
      count > 0 ? values.reduce((sum, v) => sum + v, 0) / count : 0;

    // Write the individual rating (set overwrites on update)
    tx.set(ratingRef, {
      value,
      userId: user.uid,
      // Preserve original createdAt on update; set it fresh on first rating
      createdAt: myRatingSnap.exists()
        ? myRatingSnap.data().createdAt
        : serverTimestamp(),
    });

    // Update the post's denormalized average
    tx.update(postRef, {
      ratingAverage: parseFloat(average.toFixed(1)),
      ratingCount: count,
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER'S RATING for a post
// Returns: number (1–5) or null if not yet rated
// ─────────────────────────────────────────────────────────────────────────────
export const getMyRating = async (postId: string): Promise<number | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "posts", postId, "ratings", user.uid));
  return snap.exists() ? (snap.data().value as number) : null;
};
