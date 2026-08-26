import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";
import { generateAiDescription } from "../lib/ai-description";

export default function CreateItemScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [color, setColor] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Accessories", "Outerwear"];
  const CONDITIONS = ["New with tags", "Like new", "Good", "Fair"];
  const BRANDS = ["Nike", "Adidas", "Zara", "H&M", "Levi's", "Puma", "Gucci", "Unbranded", "Other"];
  const [showCustomBrand, setShowCustomBrand] = useState(false);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add pictures");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setImageUris((prev) => [...prev, ...uris].slice(0, 5));
    }
  };

  const removeImage = (uri: string) => {
    setImageUris((prev) => prev.filter((u) => u !== uri));
  };

  const moveImage = (index: number, direction: "left" | "right") => {
    const newUris = [...imageUris];
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newUris.length) return;
    [newUris[index], newUris[targetIndex]] = [newUris[targetIndex], newUris[index]];
    setImageUris(newUris);
  };

  const handleGenerateDescription = async () => {
    if (!imageUris[0]) {
      Alert.alert("Photo required", "Add a clear cover photo before using the AI writer");
      return;
    }

    setGeneratingDescription(true);
    try {
      const generated = await generateAiDescription(imageUris[0], {
        title,
        category,
        brand,
        condition,
        color,
        size,
      });
      setDescription(generated);
    } catch (error) {
      Alert.alert(
        "AI description unavailable",
        error instanceof Error ? error.message : "Try again in a moment",
      );
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleCreateItem = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in");
      return;
    }
    if (!title || !price) {
      Alert.alert("Error", "Title and price are required");
      return;
    }

    setSubmitting(true);

    try {
      const storeRes = await fetch(`${API_URL}/stores/by-owner/${user.id}`);
      if (!storeRes.ok) {
        Alert.alert("Error", "Create a store first before adding items");
        setSubmitting(false);
        return;
      }
      const store = await storeRes.json();

      const itemRes = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          size,
          brand,
          category,
          condition,
          color,
          image_url: "",
          store_id: store.id,
        }),
      });

      const item = await itemRes.json();

      if (!itemRes.ok) {
        Alert.alert("Error", item.detail || "Could not create item");
        setSubmitting(false);
        return;
      }

      if (imageUris.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < imageUris.length; i++) {
          const response = await fetch(imageUris[i]);
          const blob = await response.blob();
          formData.append("files", blob, `photo${i}.jpg`);
        }

        await fetch(`${API_URL}/items/${item.id}/upload-images`, {
          method: "POST",
          body: formData,
        });
      }

      Alert.alert("Listed", `"${title}" is now live on Reloop`);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 56, marginLeft: spacing.lg, marginBottom: spacing.lg }}>
        List an item
      </Text>

      {/* Photos section */}
      <SectionLabel text="Photos" />
      <View style={{ backgroundColor: colors.surface, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {imageUris.map((uri, index) => (
              <View key={uri} style={{ width: 84 }}>
                <View style={{ position: "relative" }}>
                  <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: radius.sm }} resizeMode="cover" />
                  {index === 0 && (
                    <View style={{ position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ color: colors.white, fontSize: 9, fontWeight: "700" }}>MAIN</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removeImage(uri)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: "700" }}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.md, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => moveImage(index, "left")}
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.25 : 1 }}
                  >
                    <Text style={{ fontSize: 13, color: colors.wine, fontWeight: "700" }}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveImage(index, "right")}
                    disabled={index === imageUris.length - 1}
                    style={{ opacity: index === imageUris.length - 1 ? 0.25 : 1 }}
                  >
                    <Text style={{ fontSize: 13, color: colors.wine, fontWeight: "700" }}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {imageUris.length < 5 && (
              <TouchableOpacity
                onPress={pickImages}
                style={{
                  width: 84,
                  height: 84,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  borderRadius: radius.sm,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20, color: colors.inkMuted }}>📷</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        {imageUris.length > 1 && (
          <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: spacing.xs }}>
            First photo is your cover image
          </Text>
        )}
      </View>

      {/* About your item */}
      <SectionLabel text="About your item" />
      <View style={{ backgroundColor: colors.surface, marginBottom: spacing.lg }}>
        <FieldRow label="Title">
          <TextInput
            placeholder="e.g. Blue Denim Jacket"
            placeholderTextColor={colors.inkMuted}
            value={title}
            onChangeText={setTitle}
            style={fieldInputStyle}
          />
        </FieldRow>
        <FieldRow label="Description" last>
          <TextInput
            placeholder="Condition, fit, details"
            placeholderTextColor={colors.inkMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[fieldInputStyle, { minHeight: 60 }]}
          />
          <TouchableOpacity
            onPress={handleGenerateDescription}
            disabled={generatingDescription || imageUris.length === 0}
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              backgroundColor: colors.background,
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 13,
              marginTop: spacing.xs,
              opacity: imageUris.length === 0 ? 0.45 : 1,
            }}
          >
            {generatingDescription && <ActivityIndicator size="small" color={colors.wine} />}
            <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 12 }}>
              {generatingDescription ? "Writing with Gemini..." : "✦ Write with Gemini"}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colors.inkMuted, fontSize: 11, marginTop: 6 }}>
            Uses your cover photo and item details. Review the result before listing.
          </Text>
        </FieldRow>
      </View>

      {/* Item details */}
      <SectionLabel text="Item details" />
      <View style={{ backgroundColor: colors.surface, marginBottom: spacing.lg }}>
        <View style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ ...type.body, color: colors.ink, marginBottom: spacing.sm }}>Brand</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: showCustomBrand ? spacing.sm : 0 }}>
            {BRANDS.map((b) => (
              <TouchableOpacity
                key={b}
                onPress={() => {
                  if (b === "Other") {
                    setShowCustomBrand(true);
                    setBrand("");
                  } else {
                    setShowCustomBrand(false);
                    setBrand(b);
                  }
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: (b === "Other" ? showCustomBrand : brand === b) ? colors.wine : colors.background,
                }}
              >
                <Text style={{ color: (b === "Other" ? showCustomBrand : brand === b) ? colors.white : colors.ink, fontWeight: "600", fontSize: 12 }}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {showCustomBrand && (
            <TextInput
              placeholder="Type brand name"
              placeholderTextColor={colors.inkMuted}
              value={brand}
              onChangeText={setBrand}
              style={fieldInputStyle}
            />
          )}
        </View>
        <FieldRow label="Size">
          <TextInput
            placeholder="M, 9, etc."
            placeholderTextColor={colors.inkMuted}
            value={size}
            onChangeText={setSize}
            style={fieldInputStyle}
          />
        </FieldRow>
        <FieldRow label="Color">
          <TextInput
            placeholder="e.g. Turquoise, Black"
            placeholderTextColor={colors.inkMuted}
            value={color}
            onChangeText={setColor}
            style={fieldInputStyle}
          />
        </FieldRow>

        <View style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }}>
          <Text style={{ ...type.body, color: colors.ink, marginBottom: spacing.sm }}>Category</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: category === c ? colors.wine : colors.background,
                }}
              >
                <Text style={{ color: category === c ? colors.white : colors.ink, fontWeight: "600", fontSize: 13 }}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }}>
          <Text style={{ ...type.body, color: colors.ink, marginBottom: spacing.sm }}>Condition</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCondition(c)}
                style={{
                  paddingVertical: 7,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  backgroundColor: condition === c ? colors.wine : colors.background,
                }}
              >
                <Text style={{ color: condition === c ? colors.white : colors.ink, fontWeight: "600", fontSize: 13 }}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Pricing */}
      <SectionLabel text="Pricing" />
      <View style={{ backgroundColor: colors.surface, marginBottom: spacing.xl }}>
        <FieldRow label="Price (Rs)" last>
          <TextInput
            placeholder="Rs 0"
            placeholderTextColor={colors.inkMuted}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={fieldInputStyle}
          />
        </FieldRow>
      </View>

      <TouchableOpacity
        onPress={handleCreateItem}
        disabled={submitting}
        style={{
          backgroundColor: colors.wine,
          padding: 16,
          borderRadius: 999,
          marginHorizontal: spacing.lg,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
          {submitting ? "Listing..." : "Upload"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text style={{ ...type.label, color: colors.inkMuted, marginLeft: spacing.lg, marginBottom: spacing.xs }}>
      {text}
    </Text>
  );
}

function FieldRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      <Text style={{ ...type.body, color: colors.ink, marginBottom: 4, fontSize: 13 }}>{label}</Text>
      {children}
    </View>
  );
}

const fieldInputStyle = {
  fontSize: 15,
  color: colors.ink,
  paddingVertical: 4,
};
