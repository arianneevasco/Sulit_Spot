import { useEffect, useState } from "react";
import { getMyRating, submitRating } from "../services/ratingService";

export const useRatings = (
  postId: string | undefined,
  userId: string | undefined,
) => {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId || !userId) {
      setLoading(false);
      return;
    }
    getMyRating(postId)
      .then((v: number | null) => {
        setUserRating(v);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId, userId]);

  const rate = async (value: number) => {
    if (!postId) return; // ← guard: postId must be defined before calling submitRating
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitRating(postId, value);
      setUserRating(value);
    } catch (e: unknown) {
      // ← unknown is safer than any
      setError(
        e instanceof Error ? e.message : "Failed to submit rating. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return { userRating, loading, submitting, error, rate };
};
