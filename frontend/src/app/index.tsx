import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Link, useFocusEffect } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

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
      {/* Top bar */}
      <View
        style={{
          paddingTop: 50,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Text style={{ ...type.brand, color: colors.wine, fontSize: 22 }}>Reloop</Text>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.background,
              borderRadius: 999,
              paddingHorizontal: 14,
              height: 38,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.inkMuted, marginRight: 6 }}>🔍</Text>
            <TextInput
              placeholder="Search for items"
              placeholderTextColor={colors.inkMuted}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, fontSize: 14, color: colors.ink }}
            />
          </View>

          {user ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Link href="/inbox" asChild>
                <TouchableOpacity>
                  <Text style={{ fontSize: 18 }}>✉️</Text>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.wine,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>

              <Link href="/create-item" asChild>
                <TouchableOpacity
                  style={{ backgroundColor: colors.wine, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 }}
                >
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Sell now</Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.wine, fontWeight: "600", fontSize: 13 }}>Log in</Text>
                </TouchableOpacity>
              </Link>
              <Link href="/signup" asChild>
                <TouchableOpacity
                  style={{ backgroundColor: colors.wine, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 }}
                >
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Sell now</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>

        {/* Category nav row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          <View style={{ flexDirection: "row", gap: spacing.lg }}>
            <CategoryTab label="All" active={selectedCategory === null} onPress={() => setSelectedCategory(null)} />
            {CATEGORIES.map((c) => (
              <CategoryTab key={c} label={c} active={selectedCategory === c} onPress={() => setSelectedCategory(c)} />
            ))}
          </View>
        </ScrollView>

        {/* Account dropdown */}
        {menuOpen && user && (
          <View
            style={{
              position: "absolute",
              top: 90,
              right: spacing.md,
              width: 200,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingVertical: spacing.xs,
              zIndex: 20,
              ...cardShadow,
            }}
          >
            <Text style={{ color: colors.inkMuted, fontSize: 12, paddingHorizontal: spacing.md, paddingVertical: 6 }}>
              Hi, {user.name}
            </Text>
            <MenuLink href="/profile" label="Profile" onPress={() => setMenuOpen(false)} />
            <MenuLink href="/manage-store" label="My Store" onPress={() => setMenuOpen(false)} />
            <MenuLink href="/inbox" label="Inbox" onPress={() => setMenuOpen(false)} />
            <TouchableOpacity
              onPress={() => {
                setMenuOpen(false);
                logout();
              }}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Feed */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xl, maxWidth: 900, width: "100%", alignSelf: "center" }}>
        {!user && (
          <View style={{ backgroundColor: colors.wine, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg }}>
            <Text style={{ ...type.h1, color: colors.white, fontSize: 24, marginBottom: spacing.xs }}>
              Ready to declutter{"\n"}your closet?
            </Text>
            <Text style={{ ...type.body, color: "#E8D8DC", marginBottom: spacing.md }}>
              Give your clothes a second life — and make some money doing it.
            </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity style={{ backgroundColor: colors.white, paddingVertical: 12, borderRadius: 999, alignSelf: "flex-start", paddingHorizontal: 24 }}>
                <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "700" }}>Sell now</Text>
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

        <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>
          {selectedCategory ? selectedCategory : search ? `Results for "${search}"` : "Just listed"}
          {items.length > 0 ? `   ${items.length} ${items.length === 1 ? "item" : "items"}` : ""}
        </Text>

        {items.length === 0 && (
          <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🔍</Text>
            <Text style={{ ...type.h2, color: colors.ink, marginBottom: 4 }}>Nothing here yet</Text>
            <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
              {selectedCategory ? `No items in ${selectedCategory} right now.` : "Check back soon, or list something yourself."}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.lg }}>
          {items.map((item) => (
            <Link key={item.id} href={`/item/${item.id}` as any} asChild>
              <TouchableOpacity style={{ width: "47.5%" }}>
                <View style={{ width: "100%", aspectRatio: 0.85, backgroundColor: colors.border, borderRadius: radius.md, overflow: "hidden", marginBottom: spacing.xs }}>
                  {item.image_url ? (
                    <Image source={{ uri: `${API_URL}${item.image_url}` }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: colors.inkMuted, fontSize: 12 }}>No photo</Text>
                    </View>
                  )}
                  {item.is_sold && (
                    <View style={{ position: "absolute", top: spacing.xs, left: spacing.xs, backgroundColor: "rgba(43,30,34,0.75)", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 }}>
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>SOLD</Text>
                    </View>
                  )}
                  {item.photo_count > 1 && (
                    <View style={{ position: "absolute", bottom: spacing.xs, right: spacing.xs, backgroundColor: "rgba(43,30,34,0.75)", paddingVertical: 2, paddingHorizontal: 7, borderRadius: 6 }}>
                      <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>1/{item.photo_count}</Text>
                    </View>
                  )}
                </View>

                {item.brand && (
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.wine, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {item.brand}
                  </Text>
                )}
                <Text style={{ fontSize: 13, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
                  {item.title}{item.size ? ` · Size ${item.size}` : ""}
                </Text>
                <Text style={{ ...type.price, color: colors.ink, marginTop: 3 }}>${item.price}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MenuLink({ href, label, onPress }: { href: string; label: string; onPress: () => void }) {
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>{label}</Text>
      </TouchableOpacity>
    </Link>
  );
}

function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingBottom: 4 }}>
      <Text style={{ fontSize: 13, fontWeight: active ? "700" : "500", color: active ? colors.ink : colors.inkMuted }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}