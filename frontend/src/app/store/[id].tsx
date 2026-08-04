import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Link } from "expo-router";
import { API_URL } from "../../lib/api";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";

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
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ ...type.brand, color: colors.ink, marginTop: 20 }}>{store.name}</Text>
        {store.description && (
          <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.xs }}>
            {store.description}
          </Text>
        )}
        <Text style={{ ...type.label, color: colors.inkMuted, marginTop: spacing.sm }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <View style={{ padding: spacing.md, flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {items.length === 0 && (
          <Text style={{ ...type.body, color: colors.inkMuted, padding: spacing.md }}>
            No items listed yet.
          </Text>
        )}

        {items.map((item) => (
          <Link key={item.id} href={`/item/${item.id}` as any} asChild>
            <TouchableOpacity
              style={{
                width: "47.5%",
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View style={{ height: 140, backgroundColor: colors.border }}>
                {item.image_url ? (
                  <Image
                    source={{ uri: `${API_URL}${item.image_url}` }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: colors.inkMuted, fontSize: 12 }}>No photo</Text>
                  </View>
                )}
              </View>

              <View style={{ padding: spacing.sm }}>
                <Text style={{ ...type.h2, color: colors.ink }} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={{ ...type.price, color: colors.brass, marginTop: 4 }}>
                  ${item.price}
                </Text>
                {item.is_sold && (
                  <Text style={{ ...type.label, color: colors.inkMuted, marginTop: 4 }}>
                    Sold
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}