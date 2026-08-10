import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";


export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Accessories", "Outerwear"];

  const loadItems = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);

    fetch(`${API_URL}/items?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.log("ERROR:", error));
  }, [search, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 22, color: colors.ink }}>☰</Text>
            </TouchableOpacity>
            <Text style={{ ...type.brand, color: colors.ink }}>Reloop</Text>
          </View>

          <Link href={user ? "/create-item" : "/signup"} asChild>
            <TouchableOpacity
              style={{
                backgroundColor: colors.wine,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: radius.sm,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Sell</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {user && (
          <Text style={{ ...type.body, color: colors.inkMuted, marginTop: spacing.xs }}>
            Welcome back, {user.name}
          </Text>
        )}

        {menuOpen && (
          <View
            style={{
              marginTop: spacing.sm,
              backgroundColor: colors.background,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: "hidden",
            }}
          >
            {user ? (
              <>
                <Link href="/profile" asChild>
                  <TouchableOpacity
                    onPress={() => setMenuOpen(false)}
                    style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>Profile</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/manage-store" asChild>
                  <TouchableOpacity
                    onPress={() => setMenuOpen(false)}
                    style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>My Store</Text>
                  </TouchableOpacity>
                </Link>

                <Link href="/inbox" asChild>
                  <TouchableOpacity
                    onPress={() => setMenuOpen(false)}
                    style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>Inbox</Text>
                  </TouchableOpacity>
                </Link>

                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  style={{ padding: spacing.md }}
                >
                  <Text style={{ color: colors.inkMuted, fontWeight: "600" }}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Link href="/login" asChild>
                  <TouchableOpacity
                    onPress={() => setMenuOpen(false)}
                    style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>Log in</Text>
                  </TouchableOpacity>
                </Link>
                <Link href="/signup" asChild>
                  <TouchableOpacity onPress={() => setMenuOpen(false)} style={{ padding: spacing.md }}>
                    <Text style={{ color: colors.ink, fontWeight: "600" }}>Sign up</Text>
                  </TouchableOpacity>
                </Link>
              </>
            )}
          </View>
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

        {user && (
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
          {items.length > 0 ? `  ·  ${items.length} ${items.length === 1 ? "item" : "items"}` : ""}
        </Text>

        {items.length === 0 && (
          <View
            style={{
              paddingVertical: spacing.xl,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🔍</Text>
            <Text style={{ ...type.h2, color: colors.ink, marginBottom: 4 }}>
              Nothing here yet
            </Text>
            <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
              {selectedCategory ? `No items in ${selectedCategory} right now.` : "Check back soon, or list something yourself."}
            </Text>
          </View>
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
                  }}
                >
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
                  {item.is_sold && (
                    <View
                      style={{
                        position: "absolute",
                        top: spacing.xs,
                        left: spacing.xs,
                        backgroundColor: "rgba(43,30,34,0.75)",
                        paddingVertical: 3,
                        paddingHorizontal: 8,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>SOLD</Text>
                    </View>
                  )}
                  {item.photo_count > 1 && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: spacing.xs,
                        right: spacing.xs,
                        backgroundColor: "rgba(43,30,34,0.75)",
                        paddingVertical: 2,
                        paddingHorizontal: 7,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>
                        1/{item.photo_count}
                      </Text>
                    </View>
                  )}
                </View>

                {item.brand && (
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.ink, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {item.brand}
                  </Text>
                )}
                <Text style={{ fontSize: 13, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                  {item.title}{item.size ? ` · Size ${item.size}` : ""}
                </Text>
                <Text style={{ ...type.price, color: colors.ink, marginTop: 3 }}>
                  ${item.price}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}