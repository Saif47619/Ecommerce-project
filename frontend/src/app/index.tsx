import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import Fuse from "fuse.js";

import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import {
  cardShadow,
  colors,
  radius,
  spacing,
  type,
} from "../constants/reloop-theme";
import { formatPKR } from "../lib/currency";
import {
  interpretStyleSearch,
  type AISearchIntent,
} from "../lib/ai-search";
import { rankItemsForAiSearch } from "../lib/ai-search-ranking";
import GradeBadge from "../components/grade-badge";
import GradeGuideLauncher from "../components/grade-guide-launcher";

const heroImage = require("../../assets/hero-banner.png");

const CATEGORIES = [
  "Women",
  "Men",
  "Kids",
  "Shoes",
  "Accessories",
  "Outerwear",
];

const AI_EXAMPLES = [
  "University outfit under 4k",
  "Blue denim jacket size L",
  "White sneakers under 3k",
];

const TRUST_POINTS = [
  {
    icon: "A",
    title: "Visible condition grades",
    body: "Know the photo evidence before you buy.",
  },
  {
    icon: "AI",
    title: "Smarter listing checks",
    body: "AI helps sellers improve photos and details.",
  },
  {
    icon: "Rs",
    title: "Pakistan price guidance",
    body: "Fair-price ranges use verified local references.",
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [activeAiQuery, setActiveAiQuery] = useState("");
  const [aiIntent, setAiIntent] = useState<AISearchIntent | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isNarrow = width < 760;
  const horizontalPadding = isNarrow ? spacing.sm : spacing.md;
  const contentWidth = Math.min(
    Math.max(width - horizontalPadding * 2, 0),
    1120,
  );
  const columns = width >= 1080 ? 4 : width >= 720 ? 3 : 2;
  const gridGap = isNarrow ? 10 : 14;
  const cardWidth = Math.max(
    130,
    (contentWidth - gridGap * (columns - 1)) / columns,
  );

  const loadItems = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedCategory && !aiIntent) {
      params.append("category", selectedCategory);
    }

    if (aiIntent) {
      if (aiIntent.min_price !== null) {
        params.append("min_price", String(aiIntent.min_price));
      }
      if (aiIntent.max_price !== null) {
        params.append("max_price", String(aiIntent.max_price));
      }
    }

    const queryString = params.toString();
    const url = `${API_URL}/items${queryString ? `?${queryString}` : ""}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load items");
        }
        return response.json();
      })
      .then((data) => {
        setAllItems(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.log("ERROR:", error);
        setAllItems([]);
      });
  }, [selectedCategory, aiIntent]);

  useEffect(() => {
    if (aiIntent) {
      setItems(
        rankItemsForAiSearch(allItems, activeAiQuery, aiIntent),
      );
      return;
    }

    if (!search.trim()) {
      setItems(allItems);
      return;
    }

    const fuse = new Fuse(allItems, {
      keys: [
        "title",
        "brand",
        "description",
        "category",
        "product_type",
        "color",
      ],
      threshold: 0.35,
    });

    setItems(fuse.search(search).map((result) => result.item));
  }, [search, allItems, aiIntent, activeAiQuery]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const handleAiSearch = async () => {
    const query = aiQuery.trim();

    if (query.length < 2 || aiSearching) {
      return;
    }

    setAiSearching(true);
    setAiError("");

    try {
      const result = await interpretStyleSearch(query);
      setAiIntent(result.intent);
      setActiveAiQuery(result.query);
      setSelectedCategory(null);
      setSearch("");
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Reloop could not understand that search.",
      );
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiQuery("");
    setActiveAiQuery("");
    setAiIntent(null);
    setAiError("");
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setAiQuery("");
    setActiveAiQuery("");
    setAiIntent(null);
    setAiError("");
  };

  const handleTextSearch = (value: string) => {
    setSearch(value);

    if (aiIntent) {
      setAiQuery("");
      setActiveAiQuery("");
      setAiIntent(null);
      setAiError("");
      setSelectedCategory(null);
    }
  };

  const intentLabels = aiIntent ? getIntentLabels(aiIntent) : [];
  const sectionTitle = aiIntent
    ? "Best matches for you"
    : selectedCategory
      ? `${selectedCategory} finds`
      : search
        ? `Results for “${search}”`
        : "Fresh finds";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MarketplaceHeader
        isNarrow={isNarrow}
        search={search}
        onSearchChange={handleTextSearch}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        user={user}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        {!user ? <GuestHero isNarrow={isNarrow} /> : null}

        <View
          style={{
            width: contentWidth,
            maxWidth: 1120,
            alignSelf: "center",
          }}
        >
          {user ? <MemberWelcome name={user.name} /> : null}

          <TrustStrip isNarrow={isNarrow} />

          <AskReloopPanel
            query={aiQuery}
            searching={aiSearching}
            error={aiError}
            intent={aiIntent}
            intentLabels={intentLabels}
            onQueryChange={(value) => {
              setAiQuery(value);
              setAiError("");
            }}
            onSearch={() => void handleAiSearch()}
            onClear={clearAiSearch}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: spacing.sm,
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            }}
          >
            <View>
              <Text
                style={{
                  ...type.label,
                  color: colors.wine,
                  marginBottom: 4,
                }}
              >
                DISCOVER ON RELOOP
              </Text>
              <Text
                style={{
                  ...type.h1,
                  color: colors.ink,
                  fontSize: isNarrow ? 20 : 25,
                }}
              >
                {sectionTitle}
              </Text>
            </View>

            <Text
              style={{
                color: colors.inkMuted,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {items.length} {items.length === 1 ? "item" : "items"}
            </Text>
          </View>

          {items.length === 0 ? (
            <EmptyState
              aiActive={Boolean(aiIntent)}
              selectedCategory={selectedCategory}
            />
          ) : (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: gridGap,
                rowGap: isNarrow ? spacing.md : spacing.lg,
              }}
            >
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  width={cardWidth}
                />
              ))}
            </View>
          )}

          <MarketplacePromise />
        </View>
      </ScrollView>

      {menuOpen && user ? (
        <View
          style={{
            position: "absolute",
            top: isNarrow ? 132 : 72,
            right: horizontalPadding,
            width: 210,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingVertical: spacing.xs,
            zIndex: 40,
            ...cardShadow,
          }}
        >
          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 11,
              paddingHorizontal: spacing.md,
              paddingVertical: 7,
              textTransform: "uppercase",
              letterSpacing: 0.7,
            }}
          >
            Hi, {user.name}
          </Text>
          <MenuLink href="/profile" label="Profile" onPress={() => setMenuOpen(false)} />
          <MenuLink href="/manage-store" label="My store" onPress={() => setMenuOpen(false)} />
          <MenuLink href="/inbox" label="Inbox" onPress={() => setMenuOpen(false)} />
          <TouchableOpacity
            onPress={() => {
              setMenuOpen(false);
              logout();
            }}
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function MarketplaceHeader({
  isNarrow,
  search,
  onSearchChange,
  selectedCategory,
  onCategorySelect,
  user,
  menuOpen,
  onToggleMenu,
}: {
  isNarrow: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
  user: any;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  return (
    <View
      style={{
        paddingTop: Platform.OS === "web" ? 14 : 48,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        zIndex: 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1180,
          alignSelf: "center",
          paddingHorizontal: isNarrow ? spacing.sm : spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: isNarrow ? spacing.xs : spacing.sm,
          }}
        >
          <Text
            style={{
              ...type.brand,
              color: colors.wine,
              fontSize: isNarrow ? 21 : 25,
              marginRight: isNarrow ? 0 : spacing.xs,
            }}
          >
            Reloop
          </Text>

          {!isNarrow ? (
            <HeaderSearch value={search} onChange={onSearchChange} />
          ) : null}

          <GradeGuideLauncher />

          <View style={{ flex: isNarrow ? 1 : 0 }} />

          {user ? (
            <>
              <Link href="/inbox" asChild>
                <TouchableOpacity
                  accessibilityLabel="Inbox"
                  style={{
                    width: 34,
                    height: 34,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 17,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 15 }}>✉</Text>
                </TouchableOpacity>
              </Link>

              <TouchableOpacity
                accessibilityLabel="Open account menu"
                onPress={onToggleMenu}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: menuOpen ? colors.wineDark : colors.wine,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.white,
                    fontWeight: "800",
                    fontSize: 13,
                  }}
                >
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </TouchableOpacity>

              <Link href="/create-item" asChild>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.wine,
                    paddingVertical: 9,
                    paddingHorizontal: isNarrow ? 11 : 17,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    Sell
                  </Text>
                </TouchableOpacity>
              </Link>
            </>
          ) : (
            <>
              {!isNarrow ? (
                <Link href="/login" asChild>
                  <TouchableOpacity>
                    <Text
                      style={{
                        color: colors.wine,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Log in
                    </Text>
                  </TouchableOpacity>
                </Link>
              ) : null}
              <Link href="/signup" asChild>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.wine,
                    paddingVertical: 9,
                    paddingHorizontal: isNarrow ? 11 : 17,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    Sell
                  </Text>
                </TouchableOpacity>
              </Link>
            </>
          )}
        </View>

        {isNarrow ? (
          <View style={{ marginTop: spacing.sm }}>
            <HeaderSearch value={search} onChange={onSearchChange} />
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 7,
            paddingTop: spacing.sm,
            paddingBottom: 10,
          }}
        >
          <CategoryTab
            label="All"
            active={selectedCategory === null}
            onPress={() => onCategorySelect(null)}
          />
          {CATEGORIES.map((category) => (
            <CategoryTab
              key={category}
              label={category}
              active={selectedCategory === category}
              onPress={() => onCategorySelect(category)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

function HeaderSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        height: 38,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 999,
        paddingHorizontal: 13,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.inkMuted, marginRight: 7 }}>⌕</Text>
      <TextInput
        placeholder="Search items, brands or categories"
        placeholderTextColor={colors.inkMuted}
        value={value}
        onChangeText={onChange}
        style={{ flex: 1, color: colors.ink, fontSize: 13 }}
      />
    </View>
  );
}

function GuestHero({ isNarrow }: { isNarrow: boolean }) {
  return (
    <View
      style={{
        height: isNarrow ? 310 : 350,
        width: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: colors.wineDark,
      }}
    >
      <Image
        source={heroImage}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        resizeMode="cover"
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(34,26,28,0.28)",
        }}
      />
      <View
        style={{
          width: "100%",
          maxWidth: 1120,
          alignSelf: "center",
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: isNarrow ? spacing.md : spacing.lg,
        }}
      >
        <View
          style={{
            maxWidth: isNarrow ? 320 : 440,
            backgroundColor: "rgba(255,255,255,0.94)",
            borderRadius: radius.lg,
            padding: isNarrow ? spacing.md : spacing.lg,
            ...cardShadow,
          }}
        >
          <Text
            style={{
              ...type.label,
              color: colors.wine,
              marginBottom: spacing.xs,
            }}
          >
            PRELOVED, WITH PROOF
          </Text>
          <Text
            style={{
              ...type.h1,
              color: colors.ink,
              fontSize: isNarrow ? 27 : 36,
              lineHeight: isNarrow ? 32 : 41,
              marginBottom: spacing.sm,
            }}
          >
            Better finds. Clearer condition.
          </Text>
          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 14,
              lineHeight: 20,
              marginBottom: spacing.md,
            }}
          >
            Shop secondhand fashion with visible grades, smarter search, and
            local PKR price guidance.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <Link href="/signup" asChild>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.wine,
                  borderRadius: 999,
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: "800" }}>
                  Start selling
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href="/login" asChild>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 999,
                  paddingVertical: 11,
                  paddingHorizontal: 18,
                }}
              >
                <Text style={{ color: colors.ink, fontWeight: "700" }}>
                  Log in
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

function MemberWelcome({ name }: { name?: string }) {
  return (
    <View
      style={{
        overflow: "hidden",
        position: "relative",
        backgroundColor: colors.wine,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginTop: spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 150,
          height: 150,
          borderRadius: 75,
          right: -45,
          top: -70,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#EEDDE2",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 0.7,
            marginBottom: 3,
          }}
        >
          WELCOME BACK{ name ? `, ${name.toUpperCase()}` : "" }
        </Text>
        <Text
          style={{
            ...type.h1,
            color: colors.white,
            fontSize: 21,
          }}
        >
          Good clothes deserve another loop.
        </Text>
      </View>
      <Link href="/create-item" asChild>
        <TouchableOpacity
          style={{
            backgroundColor: colors.white,
            borderRadius: 999,
            paddingVertical: 10,
            paddingHorizontal: 15,
          }}
        >
          <Text style={{ color: colors.wine, fontSize: 12, fontWeight: "800" }}>
            + List an item
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

function TrustStrip({ isNarrow }: { isNarrow: boolean }) {
  return (
    <View
      style={{
        flexDirection: isNarrow ? "column" : "row",
        gap: spacing.xs,
        marginTop: spacing.sm,
      }}
    >
      {TRUST_POINTS.map((point) => (
        <View
          key={point.title}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
            minHeight: 62,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: spacing.sm,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "#F1E5E8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: colors.wine, fontWeight: "900", fontSize: 11 }}>
              {point.icon}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "800" }}>
              {point.title}
            </Text>
            <Text style={{ color: colors.inkMuted, fontSize: 10, lineHeight: 14 }}>
              {point.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function AskReloopPanel({
  query,
  searching,
  error,
  intent,
  intentLabels,
  onQueryChange,
  onSearch,
  onClear,
}: {
  query: string;
  searching: boolean;
  error: string;
  intent: AISearchIntent | null;
  intentLabels: string[];
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginTop: spacing.sm,
        ...cardShadow,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          marginBottom: spacing.sm,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.wine,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.white, fontSize: 13 }}>✦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: colors.ink, fontSize: 15 }}>
            Ask Reloop
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 11 }}>
            Search naturally in English or Roman Urdu.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <TextInput
          placeholder="e.g. university ke liye black jacket under 4k"
          placeholderTextColor={colors.inkMuted}
          value={query}
          onChangeText={onQueryChange}
          onSubmitEditing={onSearch}
          returnKeyType="search"
          editable={!searching}
          style={{
            flex: 1,
            height: 44,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 999,
            paddingHorizontal: spacing.sm,
            backgroundColor: colors.background,
            color: colors.ink,
            fontSize: 13,
          }}
        />
        <TouchableOpacity
          onPress={onSearch}
          disabled={searching || query.trim().length < 2}
          style={{
            height: 44,
            justifyContent: "center",
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor:
              searching || query.trim().length < 2
                ? colors.border
                : colors.wine,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "800", fontSize: 12 }}>
            {searching ? "Thinking..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      {!intent ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingTop: spacing.xs }}
        >
          {AI_EXAMPLES.map((example) => (
            <TouchableOpacity
              key={example}
              onPress={() => onQueryChange(example)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 999,
                paddingVertical: 5,
                paddingHorizontal: 9,
              }}
            >
              <Text style={{ color: colors.inkMuted, fontSize: 10 }}>
                {example}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {error ? (
        <Text style={{ color: "#B42318", fontSize: 12, marginTop: spacing.xs }}>
          {error}
        </Text>
      ) : null}

      {intent ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: colors.wine,
                  letterSpacing: 0.6,
                  marginBottom: 3,
                }}
              >
                RELOOP UNDERSTOOD
              </Text>
              <Text style={{ color: colors.ink, fontSize: 12 }}>
                {intent.summary}
              </Text>
            </View>
            <TouchableOpacity onPress={onClear}>
              <Text style={{ color: colors.wine, fontSize: 12, fontWeight: "800" }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {intentLabels.length > 0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginTop: spacing.xs,
              }}
            >
              {intentLabels.map((label, index) => (
                <View
                  key={`${label}-${index}`}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 999,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                  }}
                >
                  <Text style={{ color: colors.inkMuted, fontSize: 10, fontWeight: "600" }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function ProductCard({ item, width }: { item: any; width: number }) {
  return (
    <Link href={`/item/${item.id}` as any} asChild>
      <TouchableOpacity style={{ width }} activeOpacity={0.88}>
        <View
          style={{
            width: "100%",
            aspectRatio: 0.82,
            backgroundColor: colors.border,
            borderRadius: radius.md,
            overflow: "hidden",
            position: "relative",
            marginBottom: 7,
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
              <Text style={{ color: colors.inkMuted, fontSize: 11 }}>No photo</Text>
            </View>
          )}

          <View style={{ position: "absolute", top: 7, right: 7 }}>
            <GradeBadge
              compact
              inverted
              reloop_grade={item.reloop_grade}
              grade_status={item.grade_status}
              grade_label={item.grade_label}
            />
          </View>

          {item.is_sold ? (
            <View
              style={{
                position: "absolute",
                top: 7,
                left: 7,
                backgroundColor: "rgba(34,26,28,0.82)",
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 9, fontWeight: "800" }}>
                SOLD
              </Text>
            </View>
          ) : null}

          {item.photo_count > 1 ? (
            <View
              style={{
                position: "absolute",
                bottom: 7,
                right: 7,
                backgroundColor: "rgba(34,26,28,0.76)",
                paddingVertical: 3,
                paddingHorizontal: 7,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 9, fontWeight: "700" }}>
                1/{item.photo_count}
              </Text>
            </View>
          ) : null}
        </View>

        <Text
          style={{
            color: colors.ink,
            fontSize: 13,
            fontWeight: "800",
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text
          style={{ color: colors.inkMuted, fontSize: 10, marginBottom: 3 }}
          numberOfLines={1}
        >
          {item.brand || "Unbranded"}
          {item.size ? ` · Size ${item.size}` : ""}
          {item.condition ? ` · ${item.condition}` : ""}
        </Text>

        <Text style={{ ...type.price, color: colors.wine, fontSize: 15 }}>
          {formatPKR(item.price)}
        </Text>
      </TouchableOpacity>
    </Link>
  );
}

function EmptyState({
  aiActive,
  selectedCategory,
}: {
  aiActive: boolean;
  selectedCategory: string | null;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#F1E5E8",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.sm,
        }}
      >
        <Text style={{ fontSize: 22 }}>⌕</Text>
      </View>
      <Text style={{ ...type.h2, color: colors.ink, fontSize: 16, marginBottom: 4 }}>
        Nothing matched yet
      </Text>
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: 12,
          lineHeight: 18,
          textAlign: "center",
          maxWidth: 380,
        }}
      >
        {aiActive
          ? "Try a broader description or remove one of the requested details."
          : selectedCategory
            ? `No active ${selectedCategory} listings right now.`
            : "New listings will appear here as sellers add them."}
      </Text>
    </View>
  );
}

function MarketplacePromise() {
  return (
    <View
      style={{
        marginTop: spacing.xl,
        backgroundColor: "#F0E8DF",
        borderRadius: radius.lg,
        padding: spacing.md,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1, minWidth: 230 }}>
        <Text style={{ ...type.label, color: colors.wine, marginBottom: 5 }}>
          THE RELOOP PROMISE
        </Text>
        <Text style={{ ...type.h1, color: colors.ink, fontSize: 19, marginBottom: 4 }}>
          More context. Fewer surprises.
        </Text>
        <Text style={{ color: colors.inkMuted, fontSize: 12, lineHeight: 18 }}>
          Grades, photo feedback, fit estimates, and PKR price guidance help
          people make better secondhand decisions.
        </Text>
      </View>
      <GradeGuideLauncher autoOpen={false} />
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
    const alreadyIncluded = labels.some(
      (label) => label.toLowerCase() === keyword.toLowerCase(),
    );
    if (!alreadyIncluded) labels.push(keyword);
  });

  return labels;
}

function MenuLink({
  href,
  label,
  onPress,
}: {
  href: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress();
        router.push(href as any);
      }}
      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
    >
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function CategoryTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 11,
        backgroundColor: active ? colors.wine : colors.background,
        borderWidth: 1,
        borderColor: active ? colors.wine : colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: active ? "800" : "600",
          color: active ? colors.white : colors.inkMuted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
