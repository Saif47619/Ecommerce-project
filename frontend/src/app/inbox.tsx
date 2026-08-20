import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

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
      <View style={{ padding: spacing.lg, paddingTop: 56 }}>
        <TouchableOpacity onPress={() => router.push("/")} style={{ marginBottom: spacing.sm, alignSelf: "flex-start" }}>
          <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 14 }}>← Home</Text>
        </TouchableOpacity>
        <Text style={{ ...type.brand, color: colors.ink }}>Messages</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, maxWidth: 700, width: "100%", alignSelf: "center" }}>
        {loading ? (
          <ActivityIndicator color={colors.wine} style={{ marginTop: spacing.xl }} />
        ) : conversations.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
            <Text style={{ fontSize: 36, marginBottom: spacing.sm }}>✉️</Text>
            <Text style={{ ...type.h2, color: colors.ink, marginBottom: 4 }}>No messages yet</Text>
            <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
              Conversations with buyers and sellers will show up here.
            </Text>
          </View>
        ) : (
          conversations.map((c) => (
            <Link key={c.user_id} href={`/chat/${c.user_id}` as any} asChild>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  ...cardShadow,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.wine,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>
                    {c.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.ink }}>{c.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.inkMuted, marginTop: 2 }} numberOfLines={1}>
                    {c.last_message}
                  </Text>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        )}
      </ScrollView>
    </View>
  );
}