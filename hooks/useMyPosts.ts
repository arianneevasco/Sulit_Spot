import {
  DocumentData,
  onSnapshot,
  Query,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { getMyPostsQuery } from "../services/postService";

type MyPost = { id: string; [key: string]: any };

export const useMyPosts = (userId: string | undefined) => {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    unsubRef.current = onSnapshot(
      getMyPostsQuery(userId) as Query<DocumentData>,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!isMounted) return;
        setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        if (!isMounted) return;
        setError("Failed to load your posts.");
        setLoading(false);
        // Do NOT clear posts — keep showing cached data while offline
      },
    );

    return () => {
      isMounted = false;
      if (unsubRef.current) unsubRef.current();
    };
  }, [userId]);

  return { posts, loading, error };
};
