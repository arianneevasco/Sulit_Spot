// ...existing code from postService.js...
// ─────────────────────────────────────────────────────────────────────────────
// services/postService.js
// All Firestore operations for the posts collection
//
// Covers:
//   - Live feed with onSnapshot (Advanced Firebase requirement)
//   - Full CRUD: create, read, update, archive (soft delete)
//   - Trust system: Still Accurate / Outdated voting
//   - Report system: report a post, auto-hide handled by Cloud Function
//   - My Posts: fetch only the current user's posts
// ─────────────────────────────────────────────────────────────────────────────

import type { Timestamp } from "firebase/firestore";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ── Collection reference ──────────────────────────────────────────────────────
const postsRef = collection(db, "posts");

// ─────────────────────────────────────────────────────────────────────────────
// READ — LIVE FEED (onSnapshot)
// Satisfies: Advanced Firebase requirement (real-time updates)
//
// category: 'All' | 'Food' | 'Item' | 'Tip'
// callback: ({ data: Post[], error: string | null }) => void
// Returns : unsubscribe function — MUST be called in useEffect cleanup
// ─────────────────────────────────────────────────────────────────────────────
export interface Post {
  id: string;
  title: string;
  description: string;
  category: string;
  priceRange: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  photoURL: string | null;
  userId: string;
  userName: string;
  ratingAverage: number;
  ratingCount: number;
  accurateCount: number;
  outdatedCount: number;
  reportCount: number;
  isHidden: boolean;
  isArchived: boolean;
  isOutdated: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type FeedCallback = (result: {
  data: Post[];
  error: string | null;
}) => void;
export type PostCallback = (result: {
  data: Post | null;
  error: string | null;
}) => void;

export const subscribeToFeed = (
  callback: FeedCallback,
  category: "All" | "Food" | "Item" | "Tip" = "All",
) => {
  // Base query — always filter out archived and hidden posts
  let q;

  if (category === "All") {
    q = query(
      postsRef,
      where("isArchived", "==", false),
      where("isHidden", "==", false),
      orderBy("createdAt", "desc"),
    );
  } else {
    // Category filter requires composite index in Firestore
    q = query(
      postsRef,
      where("isArchived", "==", false),
      where("isHidden", "==", false),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: Post[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          description: data.description,
          category: data.category,
          priceRange: data.priceRange,
          locationText: data.locationText,
          latitude: data.latitude,
          longitude: data.longitude,
          photoURL: data.photoURL,
          userId: data.userId,
          userName: data.userName,
          ratingAverage: data.ratingAverage,
          ratingCount: data.ratingCount,
          accurateCount: data.accurateCount,
          outdatedCount: data.outdatedCount,
          reportCount: data.reportCount,
          isHidden: data.isHidden,
          isArchived: data.isArchived,
          isOutdated: data.isOutdated,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
      callback({ data: posts, error: null });
    },
    (error) => {
      callback({ data: [], error: error.message });
    },
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — SINGLE POST LIVE (onSnapshot)
// Used on DetailScreen — live count updates without manual refresh
//
// Returns: unsubscribe function
// ─────────────────────────────────────────────────────────────────────────────
export const subscribeToPost = (postId: string, callback: PostCallback) => {
  return onSnapshot(
    doc(db, "posts", postId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        callback({
          data: {
            id: snap.id,
            title: data.title,
            description: data.description,
            category: data.category,
            priceRange: data.priceRange,
            locationText: data.locationText,
            latitude: data.latitude,
            longitude: data.longitude,
            photoURL: data.photoURL,
            userId: data.userId,
            userName: data.userName,
            ratingAverage: data.ratingAverage,
            ratingCount: data.ratingCount,
            accurateCount: data.accurateCount,
            outdatedCount: data.outdatedCount,
            reportCount: data.reportCount,
            isHidden: data.isHidden,
            isArchived: data.isArchived,
            isOutdated: data.isOutdated,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          error: null,
        });
      } else {
        callback({ data: null, error: "Post not found." });
      }
    },
    (error) => callback({ data: null, error: error.message }),
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — SINGLE POST ONE-TIME
// Used when onSnapshot is overkill (e.g., pre-filling edit form)
// ─────────────────────────────────────────────────────────────────────────────
export const getPost = async (postId: string): Promise<Post> => {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) throw new Error("Post not found.");
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title,
    description: data.description,
    category: data.category,
    priceRange: data.priceRange,
    locationText: data.locationText,
    latitude: data.latitude,
    longitude: data.longitude,
    photoURL: data.photoURL,
    userId: data.userId,
    userName: data.userName,
    ratingAverage: data.ratingAverage,
    ratingCount: data.ratingCount,
    accurateCount: data.accurateCount,
    outdatedCount: data.outdatedCount,
    reportCount: data.reportCount,
    isHidden: data.isHidden,
    isArchived: data.isArchived,
    isOutdated: data.isOutdated,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// READ — MY POSTS (current user only)
// Used on MyPostsScreen — shows only active posts owned by the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
export const getMyPosts = async (userId: string): Promise<Post[]> => {
  const q = query(
    postsRef,
    where("userId", "==", userId),
    where("isArchived", "==", false),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title,
      description: data.description,
      category: data.category,
      priceRange: data.priceRange,
      locationText: data.locationText,
      latitude: data.latitude,
      longitude: data.longitude,
      photoURL: data.photoURL,
      userId: data.userId,
      userName: data.userName,
      ratingAverage: data.ratingAverage,
      ratingCount: data.ratingCount,
      accurateCount: data.accurateCount,
      outdatedCount: data.outdatedCount,
      reportCount: data.reportCount,
      isHidden: data.isHidden,
      isArchived: data.isArchived,
      isOutdated: data.isOutdated,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
};

// Used by useMyPosts for onSnapshot — returns ALL posts by this user
// (active + archived). The UI decides how to display each status.
// We intentionally omit the isArchived filter here so newly-archived posts
// stay visible in My Posts (with a badge) instead of disappearing entirely.
export const getMyPostsQuery = (userId: string) =>
  query(postsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));

// ─────────────────────────────────────────────────────────────────────────────
// CREATE POST
//
// All trust counters start at 0
// photoURL, latitude, longitude are nullable — fine if not provided
// Requires login — throws if no current user
// ─────────────────────────────────────────────────────────────────────────────
export const createPost = async ({
  title,
  description,
  category,
  priceRange,
  locationText,
  latitude = null,
  longitude = null,
  photoURL = null,
}: {
  title: string;
  description: string;
  category: "Food" | "Item" | "Tip";
  priceRange: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  photoURL?: string | null;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to post.");

  // Input validation
  if (!title || title.trim().length < 3)
    throw new Error("Title must be at least 3 characters.");
  if (!["Food", "Item", "Tip"].includes(category))
    throw new Error("Category must be Food, Item, or Tip.");
  if (!locationText || !locationText.trim())
    throw new Error("Location is required.");
  if (!description || !description.trim())
    throw new Error("Description is required.");

  const ref = await addDoc(postsRef, {
    title: title.trim(),
    description: description.trim(),
    category,
    priceRange: priceRange.trim(),
    locationText: locationText.trim(),
    latitude,
    longitude,
    photoURL,
    userId: user.uid,
    userName: user.displayName || "Anonymous",
    // Trust counters — all start at 0
    ratingAverage: 0,
    ratingCount: 0,
    accurateCount: 0,
    outdatedCount: 0,
    reportCount: 0,
    // Status flags — all start as false
    isHidden: false,
    isArchived: false,
    isOutdated: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE POST (owner only)
//
// Only pass the fields that changed — spread onto existing document
// Security rules enforce owner-only access on the Firestore side as well
// ─────────────────────────────────────────────────────────────────────────────
export const updatePost = async (postId: string, updates: Partial<Post>) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to edit.");

  // Explicitly pick only fields the user is allowed to change
  // Never allow client to overwrite trust counters, status flags, or ownership
  const safeUpdates: Partial<
    Pick<
      Post,
      | "title"
      | "description"
      | "category"
      | "priceRange"
      | "locationText"
      | "photoURL"
      | "latitude"
      | "longitude"
    >
  > = {};
  if (updates.title !== undefined) safeUpdates.title = updates.title;
  if (updates.description !== undefined)
    safeUpdates.description = updates.description;
  if (updates.category !== undefined) safeUpdates.category = updates.category;
  if (updates.priceRange !== undefined)
    safeUpdates.priceRange = updates.priceRange;
  if (updates.locationText !== undefined)
    safeUpdates.locationText = updates.locationText;
  if (updates.photoURL !== undefined) safeUpdates.photoURL = updates.photoURL;
  if (updates.latitude !== undefined) safeUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined)
    safeUpdates.longitude = updates.longitude;

  await updateDoc(doc(db, "posts", postId), {
    ...safeUpdates,
    updatedAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVE POST (soft delete, owner only)
//
// Sets isArchived: true — post disappears from all feeds
// Data is preserved in Firestore — owner can still see it if needed
// ─────────────────────────────────────────────────────────────────────────────
export const archivePost = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to archive.");

  await updateDoc(doc(db, "posts", postId), {
    isArchived: true,
    updatedAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM ACCURACY — Still Accurate / Outdated vote
//
// Document ID pattern: postId_userId
//   → Firestore rejects a second write because the document already exists
//   → No extra duplicate-check query needed
//
// vote: 'accurate' | 'outdated'
//
// Uses writeBatch so both writes (confirmation doc + counter increment)
// succeed or fail together — no partial data
// ─────────────────────────────────────────────────────────────────────────────
export const voteAccuracy = async (
  postId: string,
  vote: "accurate" | "outdated",
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required to vote.");
  if (!["accurate", "outdated"].includes(vote))
    throw new Error("Invalid vote type.");

  const voteDocId = `${postId}_${user.uid}`;
  const voteRef = doc(db, "confirmations", voteDocId);
  const postRef = doc(db, "posts", postId);

  // Use a transaction to atomically check + write — prevents duplicate votes
  // under concurrent requests (TOCTOU race condition)
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(voteRef);
    if (existing.exists())
      throw new Error("You have already voted on this post.");

    tx.set(voteRef, {
      postId,
      userId: user.uid,
      vote,
      createdAt: serverTimestamp(),
    });

    tx.update(postRef, {
      [vote === "accurate" ? "accurateCount" : "outdatedCount"]: increment(1),
      updatedAt: serverTimestamp(),
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY VOTE for a specific post
// Returns: 'accurate' | 'outdated' | null
// Used to show the correct button state (already voted / not voted)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyVote = async (
  postId: string,
): Promise<"accurate" | "outdated" | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "confirmations", `${postId}_${user.uid}`));
  return snap.exists() ? snap.data().vote : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORT POST
//
// Same document ID pattern: postId_userId → prevents duplicate reports
// Batch write: report doc + increment reportCount on post
//
// Cloud Function (functions/src/index.js) handles the auto-hide
// when reportCount reaches the threshold — not done here on the client
// ─────────────────────────────────────────────────────────────────────────────
export const reportPost = async (postId: string, reason = "") => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required to report.");

  const reportDocId = `${postId}_${user.uid}`;
  const reportRef = doc(db, "reports", reportDocId);
  const postRef = doc(db, "posts", postId);

  // FIX: Use a transaction instead of getDoc + writeBatch.
  // The previous read-then-write pattern had a TOCTOU race — two concurrent
  // requests from the same user could both pass the existence check before
  // either write committed, resulting in duplicate reports.
  // A transaction serializes the check and write atomically.
  await runTransaction(db, async (tx) => {
    const existing = await tx.get(reportRef);
    if (existing.exists())
      throw new Error("You have already reported this post.");

    tx.set(reportRef, {
      postId,
      userId: user.uid,
      reason: reason.trim(),
      createdAt: serverTimestamp(),
    });

    // Touch the post's updatedAt — reportCount increment is handled by
    // the onReportCreated Cloud Function to keep client logic minimal.
    tx.update(postRef, {
      updatedAt: serverTimestamp(),
    });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK IF USER ALREADY REPORTED
// Returns: true | false
// Used to disable the Report button after the user has already reported
// ─────────────────────────────────────────────────────────────────────────────
export const hasReported = async (postId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const snap = await getDoc(doc(db, "reports", `${postId}_${user.uid}`));
  return snap.exists();
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM POST IS STILL ACCURATE (owner action)
// Called when owner taps "Yes, still accurate" from the outdated notification
// Resets isOutdated flag and refreshes updatedAt timestamp
// ─────────────────────────────────────────────────────────────────────────────
export const confirmPostAccuracy = async (postId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required.");

  await updateDoc(doc(db, "posts", postId), {
    isOutdated: false,
    updatedAt: serverTimestamp(),
  });
};
