import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router, Link } from "expo-router";
import { API_URL } from "../lib/api";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: "center" }}>
      <Text style={{ ...type.brand, color: colors.ink, textAlign: "center", marginBottom: spacing.xs }}>
        Reloop
      </Text>
      <Text style={{ ...type.body, color: colors.inkMuted, textAlign: "center", marginBottom: spacing.xl }}>
        Create your account
      </Text>

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>Name</Text>
      <TextInput
        placeholder="Your name"
        placeholderTextColor={colors.inkMuted}
        value={name}
        onChangeText={setName}
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
          marginBottom: spacing.md,
          color: colors.ink,
        }}
      />

      <Text style={{ ...type.label, color: colors.inkMuted, marginBottom: spacing.xs }}>I want to</Text>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
        <TouchableOpacity
          onPress={() => setRole("buyer")}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: role === "buyer" ? colors.denim : colors.border,
            backgroundColor: role === "buyer" ? colors.denim : colors.surface,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: role === "buyer" ? colors.white : colors.ink }}>
            Buy clothes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setRole("seller")}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: role === "seller" ? colors.denim : colors.border,
            backgroundColor: role === "seller" ? colors.denim : colors.surface,
          }}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: role === "seller" ? colors.white : colors.ink }}>
            Sell clothes
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSignup}
        style={{ backgroundColor: colors.ink, padding: 15, borderRadius: radius.sm }}
      >
        <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
          Sign up
        </Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.denim, textAlign: "center", fontWeight: "600" }}>
            Already have an account? Log in
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}