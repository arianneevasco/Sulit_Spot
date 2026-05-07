import { useEffect, useState } from "react";
import type { Post, PostCallback } from "../services/postService";
import { subscribeToPost } from "../services/postService";

export const usePostDetail = (postId: string | undefined) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToPost(
      postId,
      ({ data, error: err }: Parameters<PostCallback>[0]) => {
        setPost(data);
        setError(err);
        setLoading(false);
      },
    );

    return unsub;
  }, [postId]);

  return { post, loading, error };
};
