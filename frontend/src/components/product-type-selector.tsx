import { Text, TouchableOpacity, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors, radius, spacing, type } from "../constants/reloop-theme";
import {
  PRODUCT_TYPE_GROUPS,
  PRODUCT_TYPE_OPTIONS,
  type ProductType,
} from "../lib/product-types";


type ProductTypeSelectorProps = {
  value: string;
  onChange: (value: ProductType) => void;
  style?: StyleProp<ViewStyle>;
};

export default function ProductTypeSelector({
  value,
  onChange,
  style,
}: ProductTypeSelectorProps) {
  return (
    <View style={style}>
      <Text style={{ ...type.body, color: colors.ink, marginBottom: 3 }}>
        Item type <Text style={{ color: colors.wine }}>*</Text>
      </Text>
      <Text
        style={{
          ...type.body,
          color: colors.inkMuted,
          fontSize: 11,
          marginBottom: spacing.sm,
        }}
      >
        Choose the exact type. This keeps fair-price comparisons relevant.
      </Text>

      {PRODUCT_TYPE_GROUPS.map((group) => (
        <View key={group} style={{ marginBottom: spacing.sm }}>
          <Text
            style={{
              ...type.label,
              color: colors.inkMuted,
              fontSize: 10,
              marginBottom: 5,
            }}
          >
            {group}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {PRODUCT_TYPE_OPTIONS.filter(
              (option) => option.group === group,
            ).map((option) => {
              const selected = value === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => onChange(option.value)}
                  style={{
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: selected ? colors.wine : colors.border,
                    backgroundColor: selected ? colors.wine : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? colors.white : colors.ink,
                      fontWeight: "600",
                      fontSize: 12,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}
