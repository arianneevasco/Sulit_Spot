import { useEffect, useState } from "react";
import type { Comment, CommentsCallback } from "../services/commentService";
import { subscribeToComments } from "../services/commentService";

export const useComments = (postId: string | undefined) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToComments(postId, (({
      data,
      error: err,
    }: Parameters<CommentsCallback>[0]) => {
      setComments(data);
      setLoading(false);
      setError(err);
    }) as CommentsCallback);

    // Detach listener on unmount
    return unsubscribe;
  }, [postId]);

  return { comments, loading, error };
};
