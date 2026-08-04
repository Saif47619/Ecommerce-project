import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function CreateItemScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add a picture");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
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
      // 1. Find this seller's store
      const storeRes = await fetch(`${API_URL}/stores/by-owner/${user.id}`);
      if (!storeRes.ok) {
        Alert.alert("Error", "Create a store first before adding items");
        setSubmitting(false);
        return;
      }
      const store = await storeRes.json();

      // 2. Create the item
      const itemRes = await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          size,
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

      // 3. If a photo was picked, upload it
      if (imageUri) {
        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "photo.jpg";

        formData.append("file", {
          uri: imageUri,
          name: filename,
          type: "image/jpeg",
        } as any);

        await fetch(`${API_URL}/items/${item.id}/upload-image`, {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
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
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 20, marginBottom: spacing.xs }}>
        List an item
      </Text>
      <Text style={{ ...type.body, color: colors.inkMuted, marginBottom: spacing.lg }}>
        Add a piece to your store
      </Text>

      <TouchableOpacity
        onPress={pickImage}
        style={{
          height: 180,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: "dashed",
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
          overflow: "hidden",
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <Text style={{ color: colors.inkMuted, fontWeight: "600" }}>Tap to add a photo</Text>
        )}
      </TouchableOpacity>

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Title</Text>
      <TextInput
        placeholder="e.g. Blue Denim Jacket"
        placeholderTextColor={colors.inkMuted}
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
        placeholder="Condition, fit, details"
        placeholderTextColor={colors.inkMuted}
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

      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Price ($)</Text>
          <TextInput
            placeholder="0.00"
            placeholderTextColor={colors.inkMuted}
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
            placeholder="M, 9, etc."
            placeholderTextColor={colors.inkMuted}
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
        onPress={handleCreateItem}
        disabled={submitting}
        style={{
          backgroundColor: colors.wine,
          padding: 15,
          borderRadius: radius.sm,
          opacity: submitting ? 0.6 : 1,
        }}
      >
        <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
          {submitting ? "Listing..." : "List item"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}