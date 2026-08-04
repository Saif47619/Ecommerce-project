import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { API_URL } from "../../lib/api";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";

export default function EditItemScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const CATEGORIES = ["Women", "Men", "Kids", "Shoes", "Accessories", "Outerwear"];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/items/${id}`)
      .then((res) => res.json())
      .then((item) => {
        setTitle(item.title || "");
        setDescription(item.description || "");
        setPrice(String(item.price ?? ""));
        setSize(item.size || "");
        setBrand(item.brand || "");
        setCategory(item.category || "");
        setImageUrl(item.image_url || "");
      })
      .catch(() => Alert.alert("Error", "Could not load item"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!title || !price) {
      Alert.alert("Error", "Title and price are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          size,
          brand,
          category,
          image_url: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("Error", data.detail || "Could not save changes");
        setSaving(false);
        return;
      }

      Alert.alert("Saved", "Your listing was updated");
      router.replace("/manage-store");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <ActivityIndicator color={colors.wine} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 20, marginBottom: spacing.lg }}>
        Edit listing
      </Text>

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: 14,
          marginBottom: spacing.md,
          color: colors.ink,
        }}
      />

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: 14,
          marginBottom: spacing.md,
          color: colors.ink,
          height: 80,
        }}
      />

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Brand</Text>
      <TextInput
        placeholder="e.g. Nike, Zara, Levi's"
        placeholderTextColor={colors.inkMuted}
        value={brand}
        onChangeText={setBrand}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: 14,
          marginBottom: spacing.md,
          color: colors.ink,
        }}
      />

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Category</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.md }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategory(c)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: category === c ? colors.wine : colors.border,
              backgroundColor: category === c ? colors.wine : colors.surface,
            }}
          >
            <Text style={{ color: category === c ? colors.white : colors.ink, fontWeight: "600", fontSize: 13 }}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Price ($)</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: 14,
              color: colors.ink,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Size</Text>
          <TextInput
            value={size}
            onChangeText={setSize}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: 14,
              color: colors.ink,
            }}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: colors.wine,
          padding: 15,
          borderRadius: radius.sm,
          opacity: saving ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
          {saving ? "Saving..." : "Save changes"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}