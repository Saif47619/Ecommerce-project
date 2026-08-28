import {
  Text,
  TouchableOpacity,
} from "react-native";

import {
  colors,
  radius,
} from "../constants/reloop-theme";

type ScreenBackButtonProps = {
  label: string;
  onPress: () => void;
};

export default function ScreenBackButton({
  label,
  onPress,
}: ScreenBackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        paddingVertical: 8,
        paddingHorizontal: 12,
      }}
    >
      <Text
        style={{
          color: colors.wine,
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        ← {label}
      </Text>
    </TouchableOpacity>
  );
}