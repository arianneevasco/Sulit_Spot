import { useComments } from "@/hooks/useComments";
import { StyleSheet, Text, View } from "react-native";

type Props = { postId: string };

export default function CommentList({ postId }: Props) {
  const { comments, loading } = useComments(postId);

  if (loading || comments.length === 0) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Comments ({comments.length})</Text>
      {comments.map((c) => (
        <View key={c.id} style={s.comment}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{c.userName[0]}</Text>
          </View>
          <View style={s.body}>
            <Text style={s.name}>{c.userName}</Text>
            <Text style={s.text}>{c.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#444", marginBottom: 12 },
  comment: { flexDirection: "row", gap: 10, marginBottom: 12 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4ECBA4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  body: { flex: 1 },
  name: { fontSize: 13, fontWeight: "600", color: "#222", marginBottom: 2 },
  text: { fontSize: 13, color: "#555", lineHeight: 18 },
});
