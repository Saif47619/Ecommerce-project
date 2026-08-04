import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Link } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";


export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Accessories", "Outerwear"];

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);

    fetch(`${API_URL}/items?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.log("ERROR:", error));
  }, [search, selectedCategory]);

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
                <>
                  <Link href="/manage-store" asChild>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.wine,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                        My Store
                      </Text>
                    </TouchableOpacity>
                  </Link>
                  <Link href="/create-item" asChild>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.brass,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                        + Item
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </>
              )}
              <Link href="/inbox" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.wine, fontWeight: "600" }}>Inbox</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/profile" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.wine, fontWeight: "600" }}>Profile</Text>
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
                    borderColor: colors.wine,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: radius.sm,
                  }}
                >
                  <Text style={{ color: colors.wine, fontWeight: "700" }}>Log in</Text>
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
        {!user && (
          <View
            style={{
              backgroundColor: colors.wine,
              borderRadius: radius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            }}
          >
            <Text style={{ ...type.h1, color: colors.white, marginBottom: spacing.xs }}>
              Ready to declutter{"\n"}your closet?
            </Text>
            <Text style={{ ...type.body, color: "#E8D8DC", marginBottom: spacing.md }}>
              Give your clothes a second life — and make some money doing it.
            </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.white,
                  paddingVertical: 12,
                  borderRadius: radius.sm,
                  marginBottom: spacing.xs,
                }}
              >
                <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "700" }}>
                  Sell now
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

        {user && user.role === "seller" && (
          <Link href="/create-item" asChild>
            <TouchableOpacity
              style={{
                backgroundColor: colors.wine,
                borderRadius: radius.lg,
                padding: spacing.md,
                marginBottom: spacing.lg,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ ...type.h2, color: colors.white }}>Got more to sell?</Text>
                <Text style={{ ...type.body, color: "#E8D8DC" }}>List another piece</Text>
              </View>
              <Text style={{ ...type.h1, color: colors.white }}>+</Text>
            </TouchableOpacity>
          </Link>
        )}

        <TextInput
          placeholder="Search items..."
          placeholderTextColor={colors.inkMuted}
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.sm,
            padding: 12,
            marginBottom: spacing.md,
            color: colors.ink,
          }}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
          contentContainerStyle={{ gap: spacing.xs }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory(null)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: selectedCategory === null ? colors.wine : colors.border,
              backgroundColor: selectedCategory === null ? colors.wine : colors.surface,
            }}
          >
            <Text style={{ color: selectedCategory === null ? colors.white : colors.ink, fontWeight: "600", fontSize: 13 }}>
              All
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setSelectedCategory(c)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: selectedCategory === c ? colors.wine : colors.border,
                backgroundColor: selectedCategory === c ? colors.wine : colors.surface,
              }}
            >
              <Text style={{ color: selectedCategory === c ? colors.white : colors.ink, fontWeight: "600", fontSize: 13 }}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
          {selectedCategory ? selectedCategory : search ? `Results for "${search}"` : "Just listed"}
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
                {item.brand && (
                  <Text style={{ ...type.label, color: colors.wine, marginBottom: 2 }}>
                    {item.brand}
                  </Text>
                )}
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
                      backgroundColor: colors.brass,
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
                      borderLeftColor: colors.brass,
                    }}
                  />
                </View>
              </View>
            </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}