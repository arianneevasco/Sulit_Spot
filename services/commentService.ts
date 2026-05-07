// ...existing code from commentService.js...
// ─────────────────────────────────────────────────────────────────────────────
// services/commentService.js
// Firestore subcollection: posts/{postId}/comments
// Final phase feature
//
// Guests can read comments (no login needed)
// Login required to post a comment
// Only the comment owner can delete their own comment
// ─────────────────────────────────────────────────────────────────────────────

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─────────────────────────────────────────────────────────────────────────────
// LIVE COMMENTS (onSnapshot)
// Returns: unsubscribe function — call in useEffect cleanup
// Ordered oldest first (asc) so the conversation reads top to bottom
// ─────────────────────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: any;
}

export type CommentsCallback = (result: {
  data: Comment[];
  error: string | null;
}) => void;

export const subscribeToComments = (
  postId: string,
  callback: CommentsCallback,
) => {
  const ref = collection(db, "posts", postId, "comments");
  const q = query(ref, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snap) => {
      const comments: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          userId: data.userId,
          userName: data.userName,
          createdAt: data.createdAt,
        };
      });
      callback({ data: comments, error: null });
    },
    (error) => callback({ data: [], error: error.message }),
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────────────────────────────────────────
export const addComment = async (postId: string, text: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required to comment.");
  if (!text || !text.trim()) throw new Error("Comment cannot be empty.");

  await addDoc(collection(db, "posts", postId, "comments"), {
    text: text.trim(),
    userId: user.uid,
    userName: user.displayName || "Anonymous",
    createdAt: serverTimestamp(),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE COMMENT (owner only)
// Note: Security rules also enforce owner-only delete on the server side
// ─────────────────────────────────────────────────────────────────────────────
export const deleteComment = async (postId: string, commentId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Login required.");

  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
};
