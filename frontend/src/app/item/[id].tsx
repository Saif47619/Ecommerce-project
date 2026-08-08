import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Link } from "expo-router";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../context/auth-context";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const loadItem = () => {
    fetch(`${API_URL}/items/${id}`)
      .then((res) => res.json())
      .then((data) => setItem(data))
      .catch(() => Alert.alert("Error", "Could not load item"))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/items/${id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadItem();
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      Alert.alert("Log in required", "Log in to buy this item");
      router.push("/login");
      return;
    }

    setBuying(true);
    try {
      const response = await fetch(
        `${API_URL}/items/${id}/buy?buyer_id=${user.id}`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Could not buy", data.detail || "Something went wrong");
        setBuying(false);
        return;
      }

      Alert.alert("Purchased", `You bought "${item.title}"`);
      loadItem();
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.wine} />
      </View>
    );
  }
  const isOwnItem = item?.store?.owner_id === user?.id;
  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg }}>
        <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
          Item not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: 320, backgroundColor: colors.border }}>
        {images.length > 0 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setActiveImageIndex(index);
              }}
            >
              {images.map((img) => (
                <Image
                  key={img.id}
                  source={{ uri: `${API_URL}${img.image_url}` }}
                  style={{ width: 900, maxWidth: "100%", height: 320 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {images.length > 1 && (
              <View
                style={{
                  position: "absolute",
                  bottom: spacing.sm,
                  alignSelf: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                {images.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: i === activeImageIndex ? colors.white : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </View>
            )}
          </>
        ) : item.image_url ? (
          <Image
            source={{ uri: `${API_URL}${item.image_url}` }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.inkMuted }}>No photo</Text>
          </View>
        )}
      </View>

      <View style={{ padding: spacing.lg }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text style={{ ...type.h1, color: colors.ink, flex: 1, marginRight: spacing.sm }}>
            {item.title}
          </Text>
          <Text style={{ ...type.brand, color: colors.brass }}>${item.price}</Text>
        </View>
        {item.store && (
          <Link href={`/store/${item.store.id}` as any} asChild>
            <TouchableOpacity style={{ marginTop: spacing.xs }}>
              <Text style={{ color: colors.wine, fontWeight: "600" }}>
                Visit {item.store.name}
              </Text>
            </TouchableOpacity>
          </Link>
        )}

        {item.store && item.store.owner_id !== user?.id && (
          <Link href={`/chat/${item.store.owner_id}?itemId=${item.id}` as any} asChild>
            <TouchableOpacity
              style={{
                marginTop: spacing.sm,
                borderWidth: 1,
                borderColor: colors.wine,
                borderRadius: radius.sm,
                padding: 10,
                alignSelf: "flex-start",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.wine, fontWeight: "700" }}>Message seller</Text>
            </TouchableOpacity>
          </Link>
        )}

        {item.brand && (
          <Text style={{ ...type.label, color: colors.wine, marginTop: spacing.xs }}>
            {item.brand}
          </Text>
        )}

        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: 4 }}>
          {item.size && (
            <Text style={{ ...type.label, color: colors.inkMuted }}>
              Size {item.size}
            </Text>
          )}
          {item.category && (
            <Text style={{ ...type.label, color: colors.inkMuted }}>
              {item.category}
            </Text>
          )}
        </View>

        {item.description && (
          <Text style={{ ...type.body, color: colors.ink, marginTop: spacing.md, lineHeight: 22 }}>
            {item.description}
          </Text>
        )}

        <View style={{ marginTop: spacing.xl }}>
          {isOwnItem ? (
            <View style={{ backgroundColor: colors.border, padding: 15, borderRadius: radius.sm }}>
              <Text style={{ color: colors.inkMuted, textAlign: "center", fontWeight: "700" }}>
                This is your listing
              </Text>
            </View>
          ) : item.is_sold ? (
            <View
              style={{
                backgroundColor: colors.border,
                padding: 15,
                borderRadius: radius.sm,
              }}
            >
              <Text style={{ color: colors.inkMuted, textAlign: "center", fontWeight: "700" }}>
                Sold
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleBuy}
              disabled={buying}
              style={{
                backgroundColor: colors.wine,
                padding: 15,
                borderRadius: radius.sm,
                opacity: buying ? 0.6 : 1,
              }}
            >
              <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
                {buying ? "Processing..." : "Buy now"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}