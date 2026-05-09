import { PRIMARY } from "@/constants/theme";
import { addComment } from "@/services/commentService";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type Props = { postId: string };

export default function CommentInput({ postId }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addComment(postId, text);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={s.wrap}>
      <TextInput
        style={s.input}
        value={text}
        onChangeText={setText}
        placeholder="Add a comment..."
        placeholderTextColor="#BDBDBD"
      />
      <TouchableOpacity style={s.send} onPress={handleSend} disabled={sending}>
        <Ionicons name="send" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    gap: 8,
    padding: 14,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E5",
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
});
