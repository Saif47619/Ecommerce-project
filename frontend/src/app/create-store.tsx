import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";

export default function CreateStoreScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();

  const handleCreateStore = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    if (user.role !== "seller") {
      Alert.alert("Error", "Only sellers can create a store");
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
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        Create Your Store
      </Text>

      <TextInput
        placeholder="Store Name"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, padding: 12, marginBottom: 15, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Store Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ borderWidth: 1, padding: 12, marginBottom: 20, borderRadius: 8, height: 80 }}
      />

      <TouchableOpacity
        onPress={handleCreateStore}
        style={{ backgroundColor: "blue", padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          Create Store
        </Text>
      </TouchableOpacity>
    </View>
  );
}