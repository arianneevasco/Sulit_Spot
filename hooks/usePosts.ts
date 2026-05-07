import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedCallback, Post } from "../services/postService";
import { subscribeToFeed } from "../services/postService";

type Category = "All" | "Food" | "Item" | "Tip";
type Unsubscribe = () => void;

type CachePayload = {
  data: Post[];
  timestamp: number;
  cachedCategory: Category;
};

const CACHE_KEY = "sulitspot:feed_cache";
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

export const usePosts = () => {
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Layer 1: Load from cache immediately
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw && isMounted) {
          const { data, timestamp, cachedCategory } = JSON.parse(
            raw,
          ) as CachePayload;
          const age = Date.now() - timestamp;
          if (
            age < CACHE_MAX_AGE &&
            data.length > 0 &&
            cachedCategory === category
          ) {
            setRawPosts(data);
            setLoading(false);
          }
        }
      } catch {
        // Non-fatal — cache miss, live query takes over
      }

      // Layer 2: Subscribe to Firestore live feed
      if (unsubRef.current) unsubRef.current();

      unsubRef.current = subscribeToFeed(
        (({ data, error: liveError }: Parameters<FeedCallback>[0]) => {
          if (!isMounted) return;
          setRawPosts(data);
          setLoading(false);
          setError(liveError);

          // Refresh cache with latest data
          if (!liveError) {
            AsyncStorage.setItem(
              CACHE_KEY,
              JSON.stringify({
                data,
                timestamp: Date.now(),
                cachedCategory: category,
              } satisfies CachePayload),
            );
          }
        }) as FeedCallback,
        category,
      );
    };

    setLoading(true);
    init();

    return () => {
      isMounted = false;
      if (unsubRef.current) unsubRef.current();
    };
  }, [category]);

  // Client-side search filter only — category filtering is done by Firestore
  const posts = useMemo(() => {
    if (!searchQuery.trim()) return rawPosts;

    const q = searchQuery.trim().toLowerCase();
    return rawPosts.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [rawPosts, searchQuery]);

  const invalidateCache = async () => {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
    } catch {
      // Non-fatal
    }
  };

  return {
    posts,
    loading,
    error,
    invalidateCache,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
  };
};
