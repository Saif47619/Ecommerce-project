import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { router, Link } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";
import { formatPKR } from "../lib/currency";
import GradeBadge from "../components/grade-badge";

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
      const timeout = setTimeout(() => router.replace("/login"), 0);
      return () => clearTimeout(timeout);
    }
    load();
  }, [user]);

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`${API_URL}/items/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    load();
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
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
          <View style={{ width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.border, overflow: "hidden", marginRight: spacing.sm, position: "relative" }}>
            {item.image_url ? (
              <Image source={{ uri: `${API_URL}${item.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 9, color: colors.inkMuted }}>No photo</Text>
              </View>
            )}
            <View style={{ position: "absolute", top: 3, right: 3 }}>
              <GradeBadge
                compact
                inverted
                reloop_grade={item.reloop_grade}
                grade_status={item.grade_status}
                grade_label={item.grade_label}
              />
            </View>
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
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.brass, marginBottom: 6 }}>{formatPKR(item.price)}</Text>

            <View style={{ flexDirection: "row", gap: spacing.xs }}>
              <TouchableOpacity
                onPress={() => router.push(`/edit-item/${item.id}` as any)}
                style={{ borderWidth: 1, borderColor: colors.wine, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}
              >
                <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 12 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleteTarget({ id: item.id, title: item.title })}
                style={{ borderWidth: 1, borderColor: "#A32D2D", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}
              >
                <Text style={{ color: "#A32D2D", fontWeight: "700", fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      </ScrollView>

    {deleteTarget && (
      <View
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(34,26,28,0.5)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 50,
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            maxWidth: 360,
            width: "100%",
            ...cardShadow,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginBottom: 6 }}>
            Delete item
          </Text>
          <Text style={{ fontSize: 14, color: colors.inkMuted, marginBottom: spacing.lg }}>
            Remove "{deleteTarget.title}"? This can't be undone.
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setDeleteTarget(null)}
              style={{ flex: 1, padding: 13, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
            >
              <Text style={{ color: colors.ink, textAlign: "center", fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDelete}
              style={{ flex: 1, padding: 13, borderRadius: 999, backgroundColor: "#A32D2D" }}
            >
              <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )}
    </View>
  );
}