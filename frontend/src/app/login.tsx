import { useState } from "react";
import { View, Text, TextInput, Alert, TouchableOpacity } from "react-native";
import { router, Link } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

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

      login({ id: data.user_id, name: data.name });
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Could not connect to backend");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg }}>
      <View style={{ maxWidth: 380, width: "100%", alignSelf: "center" }}>
        <Text style={{ ...type.brand, color: colors.wine, textAlign: "center", fontSize: 32, marginBottom: 4 }}>
          Reloop
        </Text>
        <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.xl }}>
          Log in to your account
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            ...cardShadow,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Email</Text>
          <TextInput
            placeholder="you@example.com"
            placeholderTextColor={colors.inkMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{
              backgroundColor: colors.background,
              borderRadius: radius.sm,
              padding: 14,
              marginBottom: spacing.md,
              color: colors.ink,
              fontSize: 15,
            }}
          />

          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Password</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={colors.inkMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              backgroundColor: colors.background,
              borderRadius: radius.sm,
              padding: 14,
              marginBottom: spacing.lg,
              color: colors.ink,
              fontSize: 15,
            }}
          />

          <TouchableOpacity
            onPress={handleLogin}
            style={{ backgroundColor: colors.wine, padding: 15, borderRadius: 999 }}
          >
            <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
              Log in
            </Text>
          </TouchableOpacity>
        </View>

        <Link href="/signup" asChild>
          <TouchableOpacity style={{ marginTop: spacing.lg }}>
            <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "600" }}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}