import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, Link } from "expo-router";
import { API_URL } from "../../lib/api";
import { useAuth } from "../../context/auth-context";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";
import { formatPKR } from "../../lib/currency";
import FitConfidenceCard from "../../components/fit-confidence-card";


export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [otherItems, setOtherItems] = useState<any[]>([]);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const loadItem = () => {
    fetch(`${API_URL}/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data);
        if (data.store) {
          fetch(`${API_URL}/stores/${data.store.id}/items/${id}/other`)
            .then((res) => res.json())
            .then((otherData) => setOtherItems(otherData))
            .catch(() => {});
        }
      })
      .catch(() => Alert.alert("Error", "Could not load item"))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/items/${id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => {});

    fetch(`${API_URL}/items/${id}/similar`)
      .then((res) => res.json())
      .then((data) => setSimilarItems(data))
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
      const response = await fetch(`${API_URL}/items/${id}/buy?buyer_id=${user.id}`, { method: "POST" });
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
        <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>Item not found.</Text>
      </View>
    );
  }

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  };

  const brandLabel = item.brand || "Unbranded";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          marginTop: 20,
          maxWidth: 1000,
          alignSelf: "center",
          width: "100%",
          padding: spacing.sm,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.md,
        }}
      >
        {/* LEFT — Gallery + breadcrumb + member's items */}
        <View style={{ flex: 3, minWidth: 300 }}>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <View style={{ flex: 3, height: 380, backgroundColor: colors.border, borderRadius: radius.md, overflow: "hidden" }}>
              {images.length > 0 ? (
                <Image source={{ uri: `${API_URL}${images[activeImageIndex]?.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : item.image_url ? (
                <Image source={{ uri: `${API_URL}${item.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: colors.inkMuted }}>No photo</Text>
                </View>
              )}
            </View>

            {images.length > 1 && (
              <View style={{ flex: 2, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {images.slice(0, 4).map((img, i) => {
                  const remaining = images.length - 4;
                  const isLastSlot = i === 3;
                  const showOverlay = isLastSlot && remaining > 0;
                  return (
                    <TouchableOpacity
                      key={img.id}
                      onPress={() => setActiveImageIndex(i)}
                      style={{
                        width: "48%",
                        height: 186,
                        borderRadius: radius.sm,
                        overflow: "hidden",
                        borderWidth: i === activeImageIndex ? 2 : 0,
                        borderColor: colors.wine,
                        position: "relative",
                      }}
                    >
                      <Image source={{ uri: `${API_URL}${img.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                      {showOverlay && (
                        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(34,26,28,0.6)", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>+{remaining}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Breadcrumb */}
          <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: spacing.sm }}>
            {item.category || "Items"} / {brandLabel}
          </Text>

          {/* Member's items */}
          {otherItems.length > 0 && (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={{ ...type.h2, color: colors.ink, marginBottom: spacing.sm }}>Member's items</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {otherItems.map((other) => (
                  <Link key={other.id} href={`/item/${other.id}` as any} asChild>
                    <TouchableOpacity style={{ width: "23%", minWidth: 90 }}>
                      <View style={{ width: "100%", aspectRatio: 0.9, backgroundColor: colors.border, borderRadius: radius.sm, overflow: "hidden", marginBottom: 6, position: "relative" }}>
                        {other.image_url ? (
                          <Image source={{ uri: `${API_URL}${other.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : (
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: colors.inkMuted, fontSize: 10 }}>No photo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.wine }} numberOfLines={1}>
                        {other.brand || "Unbranded"}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 2 }} numberOfLines={1}>
                        {other.condition || "Good"}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{formatPKR(other.price)}</Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </View>
          )}

          {/* You might also like */}
          {similarItems.length > 0 && (
            <View style={{ marginTop: spacing.xl }}>
              <Text style={{ ...type.h2, color: colors.ink, marginBottom: spacing.sm }}>You might also like</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {similarItems.map((sim) => (
                  <Link key={sim.id} href={`/item/${sim.id}` as any} asChild>
                    <TouchableOpacity style={{ width: "23%", minWidth: 90 }}>
                      <View style={{ width: "100%", aspectRatio: 0.9, backgroundColor: colors.border, borderRadius: radius.sm, overflow: "hidden", marginBottom: 6 }}>
                        {sim.image_url ? (
                          <Image source={{ uri: `${API_URL}${sim.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : (
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ color: colors.inkMuted, fontSize: 10 }}>No photo</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.wine }} numberOfLines={1}>
                        {sim.brand || "Unbranded"}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.inkMuted, marginBottom: 2 }} numberOfLines={1}>
                        {sim.title}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{formatPKR(sim.price)}</Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* RIGHT — Info panel */}
        <View style={{ flex: 2, minWidth: 260 }}>
          <Text style={{ ...type.h1, color: colors.ink, fontSize: 24, fontWeight: "800", marginBottom: 4 }}>{item.title}</Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.md }}>
            {item.condition && (
              <View style={{ backgroundColor: colors.background, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.ink }}>{item.condition}</Text>
              </View>
            )}
            <Text style={{ fontSize: 12, color: colors.inkMuted }}>
              {brandLabel} · {timeAgo(item.created_at)}
            </Text>
          </View>

          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.ink, marginBottom: spacing.md }}>
            {formatPKR(item.price)}
          </Text>

          {item.store && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginBottom: spacing.sm,
                shadowColor: colors.ink,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <Link href={`/store/${item.store.id}` as any} asChild>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.wine,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>
                      {item.store.name?.charAt(0).toUpperCase() || "S"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.ink }}>{item.store.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.wine }}>View store</Text>
                  </View>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 6,
                  borderRadius: 999,
                }}
              >
                <Text style={{ textAlign: "center", fontSize: 12, fontWeight: "700", color: colors.ink }}>
                  + Follow
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Details card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.sm,
              padding: spacing.sm,
              marginBottom: spacing.xs,
              shadowColor: colors.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <DetailRow label="Brand" value={brandLabel} />
            <DetailRow label="Condition" value={item.condition || "Not specified"} />
            <DetailRow label="Color" value={item.color || "Not specified"} />
            {item.size && <DetailRow label="Size" value={item.size} />}
            <DetailRow label="Uploaded" value={timeAgo(item.created_at)} last />

            {item.description && (
              <Text style={{ fontSize: 13, color: colors.ink, marginTop: spacing.xs, lineHeight: 18 }} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <FitConfidenceCard
            key={item.id}
            itemId={Number(item.id)}
            measurements={{
              chest_width_in: item.chest_width_in,
              shoulder_width_in: item.shoulder_width_in,
              waist_width_in: item.waist_width_in,
              hip_width_in: item.hip_width_in,
              length_in: item.length_in,
              inseam_in: item.inseam_in,
            }}
          />

          {/* Shipping card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.sm,
              paddingVertical: 8,
              paddingHorizontal: spacing.sm,
              marginBottom: spacing.sm,
              shadowColor: colors.ink,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.ink, fontWeight: "600" }}>📦 Free shipping — arrange with seller</Text>
          </View>

          {/* Action buttons */}
          {isOwnItem ? (
            <View style={{ backgroundColor: colors.border, padding: 15, borderRadius: radius.sm }}>
              <Text style={{ color: colors.inkMuted, textAlign: "center", fontWeight: "700" }}>This is your listing</Text>
            </View>
          ) : item.is_sold ? (
            <View style={{ backgroundColor: colors.border, padding: 15, borderRadius: radius.sm }}>
              <Text style={{ color: colors.inkMuted, textAlign: "center", fontWeight: "700" }}>Sold</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleBuy}
                disabled={buying}
                style={{ backgroundColor: colors.wine, padding: 13, borderRadius: radius.sm, opacity: buying ? 0.6 : 1 }}
              >
                <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
                  {buying ? "Processing..." : "Buy now"}
                </Text>
              </TouchableOpacity>

              {item.store && (
                <Link href={`/chat/${item.store.owner_id}?itemId=${item.id}&offerMode=true` as any} asChild>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: colors.wine, padding: 15, borderRadius: radius.sm }}>
                    <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "700" }}>Make an offer</Text>
                  </TouchableOpacity>
                </Link>
              )}

              {item.store && (
                <Link href={`/chat/${item.store.owner_id}?itemId=${item.id}` as any} asChild>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: radius.sm }}>
                    <Text style={{ color: colors.ink, textAlign: "center", fontWeight: "700" }}>Message seller</Text>
                  </TouchableOpacity>
                </Link>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}