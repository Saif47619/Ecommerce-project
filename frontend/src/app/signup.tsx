import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, Link } from "expo-router";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type, cardShadow } from "../constants/reloop-theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.detail || "Could not sign up");
        return;
      }

      Alert.alert("Welcome to Reloop", `Account created for ${data.name}`);
      router.replace("/login");
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
          Create your account
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            padding: spacing.lg,
            ...cardShadow,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.ink, marginBottom: 6 }}>Name</Text>
          <TextInput
            placeholder="Your name"
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
            onPress={handleSignup}
            style={{ backgroundColor: colors.wine, padding: 15, borderRadius: 999 }}
          >
            <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>

        <Link href="/login" asChild>
          <TouchableOpacity style={{ marginTop: spacing.lg }}>
            <Text style={{ color: colors.wine, textAlign: "center", fontWeight: "600" }}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}