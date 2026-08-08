import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
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
  const [images, setImages] = useState<any[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadImages = () => {
    fetch(`${API_URL}/items/${id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => {});
  };

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

    loadImages();
  }, [id]);

  const deleteImage = async (imageId: number) => {
    await fetch(`${API_URL}/item-images/${imageId}`, { method: "DELETE" });
    loadImages();
  };

  const moveImage = async (index: number, direction: "left" | "right") => {
    const newImages = [...images];
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);

    const orderedIds = newImages.map((img) => img.id);
    await fetch(`${API_URL}/items/${id}/reorder-images`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedIds),
    });
  };

  const addPhoto = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit reached", "Maximum 5 photos per item");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add pictures");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (result.canceled) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < result.assets.length; i++) {
        const response = await fetch(result.assets[i].uri);
        const blob = await response.blob();
        formData.append("files", blob, `photo${i}.jpg`);
      }

      await fetch(`${API_URL}/items/${id}/upload-images`, {
        method: "POST",
        body: formData,
      });

      loadImages();
    } catch (error) {
      Alert.alert("Error", "Could not upload photos");
    } finally {
      setUploadingPhoto(false);
    }
  };

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

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.sm }}>Photos</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg }}>
        {images.map((img, index) => (
          <View key={img.id} style={{ width: 100 }}>
            <View
              style={{
                position: "relative",
                borderRadius: radius.md,
                overflow: "hidden",
                shadowColor: colors.ink,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: `${API_URL}${img.image_url}` }}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />

              <TouchableOpacity
                onPress={() => deleteImage(img.id)}
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: "700", lineHeight: 14 }}>
                  ×
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  backgroundColor: "rgba(0,0,0,0.55)",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: "700" }}>
                  {index + 1}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.md, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => moveImage(index, "left")}
                disabled={index === 0}
                style={{ opacity: index === 0 ? 0.25 : 1 }}
              >
                <Text style={{ fontSize: 15, color: colors.wine, fontWeight: "700" }}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveImage(index, "right")}
                disabled={index === images.length - 1}
                style={{ opacity: index === images.length - 1 ? 0.25 : 1 }}
              >
                <Text style={{ fontSize: 15, color: colors.wine, fontWeight: "700" }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {images.length < 5 && (
          <TouchableOpacity
            onPress={addPhoto}
            disabled={uploadingPhoto}
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: "dashed",
              borderRadius: radius.md,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.wine} size="small" />
            ) : (
              <>
                <Text style={{ color: colors.inkMuted, fontSize: 24 }}>+</Text>
                <Text style={{ color: colors.inkMuted, fontSize: 11 }}>Add photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

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