import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { API_URL } from "../../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../../constants/reloop-theme";
import { formatPKR } from "../../lib/currency";
import GradeBadge from "../../components/grade-badge";

export default function StorePageScreen() {
  const { id } = useLocalSearchParams();
  const [store, setStore] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/stores/${id}`)
      .then((res) => res.json())
      .then((data) => setStore(data))
      .catch(() => {});

    fetch(`${API_URL}/stores/${id}/items`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.wine} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg }}>
        <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
          Store not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: spacing.lg,
          paddingTop: 56,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.wine,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 20 }}>
              {store.name?.charAt(0).toUpperCase() || "S"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{store.name}</Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>

        {store.description && (
          <Text style={{ ...type.body, color: colors.inkMuted }}>{store.description}</Text>
        )}
      </View>

      <View style={{ padding: spacing.md, maxWidth: 900, alignSelf: "center", width: "100%" }}>
        {items.length === 0 && (
          <Text style={{ ...type.body, color: colors.inkMuted, padding: spacing.md, textAlign: "center" }}>
            No items listed yet.
          </Text>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.lg }}>
          {items.map((item) => (
            <Link key={item.id} href={`/item/${item.id}` as any} asChild>
              <TouchableOpacity style={{ width: "47.5%" }}>
                <View
                  style={{
                    width: "100%",
                    aspectRatio: 0.85,
                    backgroundColor: colors.border,
                    borderRadius: radius.md,
                    overflow: "hidden",
                    marginBottom: spacing.xs,
                    position: "relative",
                  }}
                >
                  {item.image_url ? (
                    <Image source={{ uri: `${API_URL}${item.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: colors.inkMuted, fontSize: 12 }}>No photo</Text>
                    </View>
                  )}
                  <View
                    style={{
                      position: "absolute",
                      top: spacing.xs,
                      right: spacing.xs,
                    }}
                  >
                    <GradeBadge
                      compact
                      inverted
                      reloop_grade={item.reloop_grade}
                      grade_status={item.grade_status}
                      grade_label={item.grade_label}
                    />
                  </View>
                  {item.is_sold && (
                    <View style={{ position: "absolute", top: spacing.xs, left: spacing.xs, backgroundColor: "rgba(43,30,34,0.75)", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 }}>
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>SOLD</Text>
                    </View>
                  )}
                </View>

                {item.brand && (
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.wine, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {item.brand}
                  </Text>
                )}
                <Text style={{ fontSize: 13, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ ...type.price, color: colors.ink, marginTop: 3 }}>{formatPKR(item.price)}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}