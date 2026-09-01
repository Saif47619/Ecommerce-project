import { Text, View } from "react-native";

import {
  getGradeDisplay,
  type ProductGradeFields,
} from "../lib/product-grades";

type GradeBadgeProps = ProductGradeFields & {
  compact?: boolean;
  inverted?: boolean;
};

export default function GradeBadge({
  compact = false,
  inverted = false,
  ...fields
}: GradeBadgeProps) {
  const display = getGradeDisplay(fields);

  return (
    <View
      accessibilityLabel={`Reloop Grade ${display.grade}: ${display.label}`}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: 999,
        paddingVertical: compact ? 4 : 6,
        paddingHorizontal: compact ? 7 : 10,
        backgroundColor: inverted
          ? "rgba(255,255,255,0.94)"
          : display.softColor,
        borderWidth: 1,
        borderColor: inverted
          ? "rgba(255,255,255,0.75)"
          : `${display.color}33`,
      }}
    >
      <View
        style={{
          width: compact ? 19 : 24,
          height: compact ? 19 : 24,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: display.color,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: compact ? 10 : 12,
            fontWeight: "900",
          }}
        >
          {display.grade}
        </Text>
      </View>

      {!compact ? (
        <View>
          <Text
            style={{
              color: display.color,
              fontSize: 9,
              lineHeight: 10,
              fontWeight: "800",
              letterSpacing: 0.6,
            }}
          >
            RELOOP GRADE
          </Text>
          <Text
            style={{
              color: display.color,
              fontSize: 11,
              lineHeight: 14,
              fontWeight: "700",
            }}
          >
            {display.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
