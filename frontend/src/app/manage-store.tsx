import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router, Link } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function ManageStoreScreen() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    fetch(`${API_URL}/stores/by-owner/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("no store");
        return res.json();
      })
      .then((s) => {
        setStore(s);
        return fetch(`${API_URL}/stores/${s.id}/items`);
      })
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => setStore(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    load();
  }, [user]);

  const handleDelete = (itemId: number, title: string) => {
    Alert.alert("Delete item", `Remove "${title}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await fetch(`${API_URL}/items/${itemId}`, { method: "DELETE" });
          load();
        },
      },
    ]);
  };

  if (!user) return null;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.wine} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" }}>
        <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.md }}>
          You don't have a store yet.
        </Text>
        <Link href="/create-store" asChild>
          <TouchableOpacity style={{ backgroundColor: colors.wine, padding: 14, borderRadius: radius.sm }}>
            <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700" }}>Create a store</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 40 }}>{store.name}</Text>
      {store.description && (
        <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.xs, marginBottom: spacing.md }}>
          {store.description}
        </Text>
      )}

      <Link href="/create-item" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: colors.brass,
            padding: 14,
            borderRadius: radius.sm,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700" }}>+ Add new item</Text>
        </TouchableOpacity>
      </Link>

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
        Your items ({items.length})
      </Text>

      {items.length === 0 && (
        <Text style={{ ...type.body, color: colors.inkMuted }}>Nothing listed yet.</Text>
      )}

      {items.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.sm,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...type.h2, color: colors.ink }}>{item.title}</Text>
              <Text style={{ ...type.price, color: colors.brass }}>${item.price}</Text>
            </View>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: radius.sm,
                backgroundColor: item.is_sold ? colors.sage : colors.border,
              }}
            >
              <Text style={{ ...type.label, color: item.is_sold ? colors.white : colors.inkMuted }}>
                {item.is_sold ? "Sold" : "Active"}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <TouchableOpacity
              onPress={() => router.push(`/edit-item/${item.id}` as any)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.wine,
                borderRadius: radius.sm,
                padding: 8,
              }}
            >
              <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "700", fontSize: 13 }}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.title)}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#A32D2D",
                borderRadius: radius.sm,
                padding: 8,
              }}
            >
              <Text style={{ color: "#A32D2D", textAlign: "center", fontWeight: "700", fontSize: 13 }}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}