import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

export default function CreateStoreScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();

  const handleCreateStore = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (!name) {
      Alert.alert("Error", "Store name is required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          owner_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.detail || "Could not create store");
        return;
      }

      Alert.alert("Success", `Store "${data.name}" created!`);
      router.replace("/manage-store");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg }}>
      <View style={{ maxWidth: 400, width: "100%", alignSelf: "center" }}>
        <TouchableOpacity onPress={() => router.push("/")} style={{ marginBottom: spacing.md, alignSelf: "flex-start" }}>
          <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 14 }}>← Home</Text>
        </TouchableOpacity>

        <Text style={{ ...type.brand, color: colors.wine, fontSize: 26, marginBottom: 4 }}>
          Create your store
        </Text>
        <Text style={{ ...type.body, color: colors.inkMuted, marginBottom: spacing.xl }}>
          Give your shop a name buyers will remember
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            ...cardShadow,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Store name</Text>
          <TextInput
            placeholder="e.g. Saif's Closet"
            placeholderTextColor={colors.inkMuted}
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: colors.background,
              borderRadius: radius.sm,
              padding: 14,
              marginBottom: spacing.md,
              color: colors.ink,
              fontSize: 15,
            }}
          />

          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Description</Text>
          <TextInput
            placeholder="What kind of items will you sell?"
            placeholderTextColor={colors.inkMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            style={{
              backgroundColor: colors.background,
              borderRadius: radius.sm,
              padding: 14,
              marginBottom: spacing.lg,
              color: colors.ink,
              fontSize: 15,
              height: 80,
            }}
          />

          <TouchableOpacity
            onPress={handleCreateStore}
            style={{ backgroundColor: colors.wine, padding: 15, borderRadius: 999 }}
          >
            <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
              Create store
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}