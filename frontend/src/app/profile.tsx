import { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/auth-context";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function ProfileScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/users/${user.id}/purchases`)
      .then((res) => res.json())
      .then((data) => setPurchases(data))
      .catch(() => {});

    if (user.role !== "seller") {
      setLoading(false);
      return;
    }

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

  if (!user) return null;

  const soldItems = items.filter((i) => i.is_sold);
  const activeItems = items.filter((i) => !i.is_sold);
  const totalEarnings = soldItems.reduce((sum, i) => sum + i.price, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 40, marginBottom: spacing.lg }}>
        Profile
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.md,
        }}
      >
        <Text style={{ ...type.label, color: colors.inkMuted }}>Name</Text>
        <Text style={{ ...type.h2, color: colors.ink, marginBottom: spacing.sm }}>{user.name}</Text>

        <Text style={{ ...type.label, color: colors.inkMuted }}>Account type</Text>
        <Text style={{ ...type.h2, color: colors.ink, textTransform: "capitalize" }}>{user.role}</Text>
      </View>

      {user.role === "seller" && (
        <>
          {loading ? (
            <ActivityIndicator color={colors.denim} style={{ marginTop: spacing.lg }} />
          ) : !hasStore ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.md,
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

              <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                  }}
                >
                  <Text style={{ ...type.label, color: colors.inkMuted }}>Active</Text>
                  <Text style={{ ...type.h1, color: colors.ink }}>{activeItems.length}</Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                  }}
                >
                  <Text style={{ ...type.label, color: colors.inkMuted }}>Sold</Text>
                  <Text style={{ ...type.h1, color: colors.ink }}>{soldItems.length}</Text>
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.clay,
                    borderRadius: radius.md,
                    padding: spacing.sm,
                  }}
                >
                  <Text style={{ ...type.label, color: colors.white }}>Earned</Text>
                  <Text style={{ ...type.h1, color: colors.white }}>${totalEarnings.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
                Your listings
              </Text>

              {items.length === 0 && (
                <Text style={{ ...type.body, color: colors.inkMuted }}>
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
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    marginBottom: spacing.xs,
                  }}
                >
                  <View>
                    <Text style={{ ...type.h2, color: colors.ink }}>{item.title}</Text>
                    <Text style={{ ...type.body, color: colors.inkMuted }}>${item.price}</Text>
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
              ))}
            </>
          )}
        </>
      )}

      <Text style={{ ...type.label, color: colors.inkMuted, marginTop: spacing.lg, marginBottom: spacing.sm }}>
        My Purchases
      </Text>

      {purchases.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
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
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginBottom: spacing.xs,
            }}
          >
            <Text style={{ ...type.h2, color: colors.ink }}>{item.title}</Text>
            <Text style={{ ...type.price, color: colors.clay }}>${item.price}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}