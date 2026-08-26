import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { Link, useFocusEffect, router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";
import Fuse from "fuse.js";
import { formatPKR } from "../lib/currency";
import { interpretStyleSearch, type AISearchIntent } from "../lib/ai-search";
const heroImage = require("../../assets/hero-banner.png");


export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiIntent, setAiIntent] = useState<AISearchIntent | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Accessories", "Outerwear"];

    const [allItems, setAllItems] = useState<any[]>([]);

  const loadItems = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);

    if (aiIntent) {
      if (aiIntent.brand) params.append("brand", aiIntent.brand);
      if (aiIntent.color) params.append("color", aiIntent.color);
      if (aiIntent.size) params.append("size", aiIntent.size);
      if (aiIntent.condition) params.append("condition", aiIntent.condition);
      if (aiIntent.min_price !== null) params.append("min_price", String(aiIntent.min_price));
      if (aiIntent.max_price !== null) params.append("max_price", String(aiIntent.max_price));
    }

    const queryString = params.toString();
    const url = `${API_URL}/items${queryString ? `?${queryString}` : ""}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load items");
        return response.json();
      })
      .then((data) => setAllItems(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log("ERROR:", error);
        setAllItems([]);
      });
  }, [selectedCategory, aiIntent]);

  useEffect(() => {
    if (aiIntent) {
      const terms = aiIntent.keywords.filter((keyword) => keyword.trim().length > 0);

      if (terms.length === 0) {
        setItems(allItems);
        return;
      }

      const fuse = new Fuse(allItems, {
        keys: ["title", "brand", "description", "category", "color", "condition", "size"],
        threshold: 0.4,
      });
      const matchedItems = new Map<number, any>();

      terms.forEach((term) => {
        fuse.search(term).forEach((result) => matchedItems.set(result.item.id, result.item));
      });

      setItems(matchedItems.size > 0 ? Array.from(matchedItems.values()) : allItems);
      return;
    }

    if (!search.trim()) {
      setItems(allItems);
      return;
    }

    const fuse = new Fuse(allItems, {
      keys: ["title", "brand", "description", "category"],
      threshold: 0.35,
    });

    const results = fuse.search(search);
    setItems(results.map((result) => result.item));
  }, [search, allItems, aiIntent]);

  const handleAiSearch = async () => {
    const query = aiQuery.trim();
    if (query.length < 2 || aiSearching) return;

    setAiSearching(true);
    setAiError("");

    try {
      const result = await interpretStyleSearch(query);
      setAiIntent(result.intent);
      setSelectedCategory(result.intent.category);
      setSearch("");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Reloop could not understand that search.");
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiQuery("");
    setAiIntent(null);
    setAiError("");
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setAiQuery("");
    setAiIntent(null);
    setAiError("");
  };

  const handleTextSearch = (value: string) => {
    setSearch(value);

    if (aiIntent) {
      setAiQuery("");
      setAiIntent(null);
      setAiError("");
      setSelectedCategory(null);
    }
  };

  const intentLabels = aiIntent ? getIntentLabels(aiIntent) : [];


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
              onChangeText={handleTextSearch}
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
            <CategoryTab label="All" active={selectedCategory === null} onPress={() => handleCategorySelect(null)} />
            {CATEGORIES.map((category) => (
              <CategoryTab key={category} label={category} active={selectedCategory === category} onPress={() => handleCategorySelect(category)} />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Feed */}
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {!user && (
          <View
            style={{
              height: 480,
              overflow: "hidden",
              marginBottom: spacing.lg,
              justifyContent: "center",
              position: "relative",
              width: "100%",
            }}
          >
            <Image
              source={heroImage}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            <View
              style={{
                backgroundColor: colors.white,
                borderRadius: radius.lg,
                padding: spacing.lg,
                marginLeft: spacing.lg,
                maxWidth: 260,
                ...cardShadow,
              }}
            >
              <Text style={{ ...type.h1, color: colors.ink, fontSize: 22, marginBottom: spacing.sm }}>
                Ready to declutter{"\n"}your closet?
              </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity style={{ backgroundColor: colors.wine, paddingVertical: 12, borderRadius: 999, marginBottom: spacing.xs }}>
                  <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700" }}>Sell now</Text>
                </TouchableOpacity>
              </Link>
              <TouchableOpacity>
                <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "600", fontSize: 13 }}>Learn how it works</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.md, maxWidth: 900, width: "100%", alignSelf: "center" }}>
          {/* AI style search */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing.md,
              marginTop: spacing.md,
              marginBottom: spacing.lg,
              ...cardShadow,
            }}
          >
            <Text style={{ ...type.h2, color: colors.wine, marginBottom: 4 }}>✨ Ask Reloop</Text>
            <Text style={{ ...type.body, color: colors.inkMuted, marginBottom: spacing.sm }}>
              Describe what you need in English or Roman Urdu.
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <TextInput
                placeholder="e.g. university ke liye black jacket under 4k"
                placeholderTextColor={colors.inkMuted}
                value={aiQuery}
                onChangeText={(value) => {
                  setAiQuery(value);
                  setAiError("");
                }}
                onSubmitEditing={() => void handleAiSearch()}
                returnKeyType="search"
                editable={!aiSearching}
                style={{
                  flex: 1,
                  height: 44,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                  backgroundColor: colors.background,
                  color: colors.ink,
                  fontSize: 14,
                }}
              />
              <TouchableOpacity
                onPress={() => void handleAiSearch()}
                disabled={aiSearching || aiQuery.trim().length < 2}
                style={{
                  height: 44,
                  justifyContent: "center",
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: aiSearching || aiQuery.trim().length < 2 ? colors.border : colors.wine,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>
                  {aiSearching ? "Thinking..." : "Ask Reloop"}
                </Text>
              </TouchableOpacity>
            </View>

            {aiError ? (
              <Text style={{ color: "#B42318", fontSize: 13, marginTop: spacing.sm }}>{aiError}</Text>
            ) : null}

            {aiIntent && (
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.wine, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
                      Reloop understood
                    </Text>
                    <Text style={{ ...type.body, color: colors.ink }}>{aiIntent.summary}</Text>
                  </View>
                  <TouchableOpacity onPress={clearAiSearch}>
                    <Text style={{ color: colors.wine, fontSize: 13, fontWeight: "700" }}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {intentLabels.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm }}>
                    {intentLabels.map((label, index) => (
                      <View
                        key={`${label}-${index}`}
                        style={{ backgroundColor: colors.background, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border }}
                      >
                        <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: "600" }}>{label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {user && (
            <Link href="/create-item" asChild>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.wine,
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  marginTop: spacing.md,
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
            {aiIntent
              ? "Reloop AI matches"
              : selectedCategory
                ? selectedCategory
                : search
                  ? `Results for "${search}"`
                  : "Just listed"}
            {items.length > 0 ? `   ${items.length} ${items.length === 1 ? "item" : "items"}` : ""}
          </Text>

          {items.length === 0 && (
            <View style={{ paddingVertical: spacing.xl, alignItems: "center" }}>
              <Text style={{ fontSize: 40, marginBottom: spacing.sm }}>🔍</Text>
              <Text style={{ ...type.h2, color: colors.ink, marginBottom: 4 }}>Nothing here yet</Text>
              <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center" }}>
                {aiIntent
                  ? "Try a broader description or remove one of the details."
                  : selectedCategory
                    ? `No items in ${selectedCategory} right now.`
                    : "Check back soon, or list something yourself."}
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
                  <Text style={{ ...type.price, color: colors.ink, marginTop: 3 }}>{formatPKR(item.price)}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
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
  );
}

function getIntentLabels(intent: AISearchIntent): string[] {
  const labels: string[] = [];

  if (intent.category) labels.push(intent.category);
  if (intent.brand) labels.push(intent.brand);
  if (intent.color) labels.push(intent.color);
  if (intent.size) labels.push(`Size ${intent.size}`);
  if (intent.condition) labels.push(intent.condition);

  if (intent.min_price !== null && intent.max_price !== null) {
    labels.push(`${formatPKR(intent.min_price)} – ${formatPKR(intent.max_price)}`);
  } else if (intent.min_price !== null) {
    labels.push(`From ${formatPKR(intent.min_price)}`);
  } else if (intent.max_price !== null) {
    labels.push(`Under ${formatPKR(intent.max_price)}`);
  }

  intent.keywords.forEach((keyword) => {
    const alreadyIncluded = labels.some((label) => label.toLowerCase() === keyword.toLowerCase());
    if (!alreadyIncluded) labels.push(keyword);
  });

  return labels;
}

function MenuLink({ href, label, onPress }: { href: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
        router.push(href as any);
      }}
      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
    >
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>{label}</Text>
    </TouchableOpacity>
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