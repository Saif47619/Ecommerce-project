import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router, Link } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

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
          <TouchableOpacity style={{ backgroundColor: colors.wine, padding: 15, borderRadius: 999 }}>
            <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700" }}>Create a store</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  const activeCount = items.filter((i) => !i.is_sold).length;
  const soldCount = items.filter((i) => i.is_sold).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
      <Link href="/" asChild>
        <TouchableOpacity style={{ marginTop: 40, marginBottom: spacing.sm, alignSelf: "flex-start" }}>
          <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 14 }}>← Home</Text>
        </TouchableOpacity>
      </Link>
      <Text style={{ ...type.brand, color: colors.ink, marginBottom: 2 }}>{store.name}</Text>
      {store.description && (
        <Text style={{ ...type.body, color: colors.inkMuted, marginBottom: spacing.md }}>
          {store.description}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...cardShadow }}>
          <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: "600" }}>ACTIVE</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{activeCount}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...cardShadow }}>
          <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: "600" }}>SOLD</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{soldCount}</Text>
        </View>
      </View>

      <Link href="/create-item" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: colors.wine,
            padding: 15,
            borderRadius: 999,
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
            flexDirection: "row",
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.sm,
            marginBottom: spacing.sm,
            ...cardShadow,
          }}
        >
          <View style={{ width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.border, overflow: "hidden", marginRight: spacing.sm }}>
            {item.image_url ? (
              <Image source={{ uri: `${API_URL}${item.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 9, color: colors.inkMuted }}>No photo</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink, flex: 1 }} numberOfLines={1}>
                {item.title}
              </Text>
              <View
                style={{
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  borderRadius: 999,
                  backgroundColor: item.is_sold ? colors.sage : colors.background,
                  marginLeft: 6,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: item.is_sold ? colors.white : colors.inkMuted }}>
                  {item.is_sold ? "Sold" : "Active"}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.brass, marginBottom: 6 }}>${item.price}</Text>

            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              <TouchableOpacity
                onPress={() => router.push(`/edit-item/${item.id}` as any)}
                style={{ borderWidth: 1, borderColor: colors.wine, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}
              >
                <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 12 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.title)}
                style={{ borderWidth: 1, borderColor: "#A32D2D", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}
              >
                <Text style={{ color: "#A32D2D", fontWeight: "700", fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}