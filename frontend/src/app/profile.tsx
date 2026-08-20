import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  const loadData = useCallback(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/users/${user.id}/purchases`)
      .then((res) => res.json())
      .then((data) => setPurchases(data))
      .catch(() => {});

    fetch(`${API_URL}/stores/by-owner/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("no store");
        return res.json();
      })
      .then((store) => {
        setHasStore(true);
        return fetch(`${API_URL}/stores/${store.id}/items`);
      })
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => setHasStore(false))
      .finally(() => setLoading(false));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (!user) return null;

  const soldItems = items.filter((i) => i.is_sold);
  const activeItems = items.filter((i) => !i.is_sold);
  const totalEarnings = soldItems.reduce((sum, i) => sum + i.price, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
      <TouchableOpacity onPress={() => router.push("/")} style={{ marginTop: 40, marginBottom: spacing.sm, alignSelf: "flex-start" }}>
        <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 14 }}>← Home</Text>
      </TouchableOpacity>

      <Text style={{ ...type.brand, color: colors.ink, marginBottom: spacing.lg }}>Profile</Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.lg,
          ...cardShadow,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.wine,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "700", fontSize: 22 }}>
            {user.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{user.name}</Text>
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: "600", marginTop: 2 }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.wine} style={{ marginTop: spacing.lg }} />
      ) : !hasStore ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            ...cardShadow,
          }}
        >
          <Text style={{ ...type.body, color: colors.inkMuted }}>
            You haven't created a store yet.
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
            Dashboard
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...cardShadow }}>
              <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: "600" }}>ACTIVE</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{activeItems.length}</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, ...cardShadow }}>
              <Text style={{ fontSize: 11, color: colors.inkMuted, fontWeight: "600" }}>SOLD</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.ink }}>{soldItems.length}</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.brass, borderRadius: radius.md, padding: spacing.sm }}>
              <Text style={{ fontSize: 11, color: colors.white, fontWeight: "600" }}>EARNED</Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: colors.white }}>${totalEarnings.toFixed(2)}</Text>
            </View>
          </View>

          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
            Your listings
          </Text>

          {items.length === 0 && (
            <Text style={{ ...type.body, color: colors.inkMuted, marginBottom: spacing.lg }}>
              No items listed yet.
            </Text>
          )}

          {items.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                padding: spacing.sm,
                marginBottom: spacing.xs,
                ...cardShadow,
              }}
            >
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{item.title}</Text>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.brass }}>${item.price}</Text>
              </View>

              <View
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: item.is_sold ? colors.sage : colors.background,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: item.is_sold ? colors.white : colors.inkMuted }}>
                  {item.is_sold ? "Sold" : "Active"}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={{ ...type.label, color: colors.inkMuted, marginTop: spacing.lg, marginBottom: spacing.sm }}>
        My purchases
      </Text>

      {purchases.length === 0 ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, ...cardShadow }}>
          <Text style={{ ...type.body, color: colors.inkMuted }}>
            You haven't bought anything yet.
          </Text>
        </View>
      ) : (
        purchases.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.sm,
              marginBottom: spacing.xs,
              ...cardShadow,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{item.title}</Text>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.brass }}>${item.price}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}