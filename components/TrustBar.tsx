import { DANGER, PRIMARY } from "@/constants/theme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  postId: string;
  accurateCount: number;
  outdatedCount: number;
  isLoggedIn: boolean;
  onLoginRequired: () => void;
};

export default function TrustBar({
  postId,
  accurateCount,
  outdatedCount,
  isLoggedIn,
  onLoginRequired,
}: Props) {
  const handleVote = (type: "accurate" | "outdated") => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    // call trustService.voteAccuracy(postId, type)
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Community trust</Text>
      <View style={s.row}>
        <TouchableOpacity
          style={s.accurate}
          onPress={() => handleVote("accurate")}
        >
          <Text style={s.accurateText}>✓ Still accurate ({accurateCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.outdated}
          onPress={() => handleVote("outdated")}
        >
          <Text style={s.outdatedText}>✗ Outdated ({outdatedCount})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "#F5F6FA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 8 },
  accurate: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: "center",
  },
  accurateText: { fontSize: 12, fontWeight: "600", color: PRIMARY },
  outdated: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    alignItems: "center",
  },
  outdatedText: { fontSize: 12, fontWeight: "600", color: DANGER },
});
