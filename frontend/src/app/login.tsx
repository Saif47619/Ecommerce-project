import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and Password are required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login failed", data.detail || "Invalid credentials");
        return;
      }

      login({
        id: data.user_id,
        name: data.name,
        role: data.role,
      });

      Alert.alert("Success", `Welcome, ${data.name}`);
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
        Login
      </Text>

      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 12, marginBottom: 15, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Enter Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 12, marginBottom: 20, borderRadius: 8 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: "green", padding: 15, borderRadius: 8 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}