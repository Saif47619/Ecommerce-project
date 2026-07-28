import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch(`${API_URL}/items`)
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.log("ERROR:", error));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...type.brand, color: colors.ink }}>Reloop</Text>

          {user ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              {user.role === "seller" && (
                <Link href="/create-store" asChild>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.denim,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                      + Store
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}
              <Link href="/profile" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.denim, fontWeight: "600" }}>Profile</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity onPress={logout}>
                <Text style={{ color: colors.inkMuted, fontWeight: "600" }}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Link href="/login" asChild>
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: colors.denim,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text style={{ color: colors.denim, fontWeight: "700" }}>Log in</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/signup" asChild>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.ink,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "700" }}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>

        {user && (
          <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.xs }}>
            Welcome back, {user.name}
          </Text>
        )}
      </View>

      {/* Feed */}
      <ScrollView contentContainerStyle={{ padding: spacing.md, maxWidth: 900, width: "100%", alignSelf: "center" }}>
        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
          Just listed
        </Text>

        {items.length === 0 && (
          <View
            style={{
              paddingVertical: spacing.xl,
              alignItems: "center",
            }}
          >
            <Text style={{ ...type.body, color: colors.inkMuted }}>
              No items yet — check back soon.
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {items.map((item) => (
            <View
              key={item.id}
              style={{
                width: "47.5%",
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 140,
                  backgroundColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.inkMuted, fontSize: 12 }}>No photo</Text>
              </View>

              <View style={{ padding: spacing.sm }}>
                <Text style={{ ...type.h2, color: colors.ink }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.size && (
                  <Text style={{ ...type.label, color: colors.inkMuted, marginTop: 2 }}>
                    Size {item.size}
                  </Text>
                )}

                {/* Signature: clipped price tag */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: spacing.sm,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.clay,
                      paddingVertical: 4,
                      paddingHorizontal: 10,
                      borderTopLeftRadius: radius.sm,
                      borderBottomLeftRadius: radius.sm,
                    }}
                  >
                    <Text style={{ ...type.price, color: colors.white }}>
                      ${item.price}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 0,
                      height: 0,
                      borderTopWidth: 13,
                      borderBottomWidth: 13,
                      borderLeftWidth: 8,
                      borderTopColor: "transparent",
                      borderBottomColor: "transparent",
                      borderLeftColor: colors.clay,
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}