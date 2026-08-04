import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function InboxScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/users/${user.id}/conversations`)
      .then((res) => res.json())
      .then((data) => setConversations(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingTop: 60 }}>
        <Text style={{ ...type.brand, color: colors.ink }}>Messages</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        {loading ? (
          <ActivityIndicator color={colors.wine} />
        ) : conversations.length === 0 ? (
          <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center", marginTop: spacing.xl }}>
            No conversations yet.
          </Text>
        ) : (
          conversations.map((c) => (
            <Link key={c.user_id} href={`/chat/${c.user_id}` as any} asChild>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ ...type.h2, color: colors.ink }}>{c.name}</Text>
                <Text style={{ ...type.body, color: colors.inkMuted, marginTop: 4 }} numberOfLines={1}>
                  {c.last_message}
                </Text>
              </TouchableOpacity>
            </Link>
          ))
        )}
      </ScrollView>
    </View>
  );
}