import { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { router, Link } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
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

      login({ id: data.user_id, name: data.name, role: data.role });
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" }}>
      <Text style={{ ...type.brand, color: colors.ink, textAlign: "center", marginBottom: spacing.xs }}>
        Reloop
      </Text>
      <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.xl }}>
        Log in to your account
      </Text>

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Email</Text>
      <TextInput
        placeholder="you@example.com"
        placeholderTextColor={colors.inkMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
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

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Password</Text>
      <TextInput
        placeholder="••••••••"
        placeholderTextColor={colors.inkMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: 14,
          marginBottom: spacing.lg,
          color: colors.ink,
        }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: colors.wine, padding: 15, borderRadius: radius.sm }}
      >
        <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
          Log in
        </Text>
      </TouchableOpacity>

      <Link href="/signup" asChild>
        <TouchableOpacity style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "600" }}>
            Don't have an account? Sign up
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}