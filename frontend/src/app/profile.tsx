import { View, Text } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { colors, spacing, radius, type } from "../constants/reloop-theme";

export default function ProfileScreen() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text style={{ ...type.brand, color: colors.ink, marginTop: 40, marginBottom: spacing.lg }}>
        Profile
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
        }}
      >
        <Text style={{ ...type.label, color: colors.inkMuted }}>Name</Text>
        <Text style={{ ...type.h2, color: colors.ink, marginBottom: spacing.sm }}>{user.name}</Text>

        <Text style={{ ...type.label, color: colors.inkMuted }}>Account type</Text>
        <Text style={{ ...type.h2, color: colors.ink, textTransform: "capitalize" }}>{user.role}</Text>
      </View>
    </View>
  );
}