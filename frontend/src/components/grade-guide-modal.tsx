import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  colors,
  radius,
  spacing,
  type,
} from "../constants/reloop-theme";
import { GRADE_DEFINITIONS } from "../lib/product-grades";

type GradeGuideModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function GradeGuideModal({
  visible,
  onClose,
}: GradeGuideModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(34,26,28,0.58)",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.md,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 520,
            maxHeight: "90%",
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              padding: spacing.md,
              backgroundColor: colors.wine,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#EEDDE2",
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 0.8,
                    marginBottom: 5,
                  }}
                >
                  BUY WITH MORE CONFIDENCE
                </Text>
                <Text
                  style={{
                    ...type.h1,
                    color: colors.white,
                    fontSize: 24,
                    marginBottom: 5,
                  }}
                >
                  Meet Reloop Grades
                </Text>
                <Text
                  style={{
                    color: "#F4E9EC",
                    fontSize: 13,
                    lineHeight: 19,
                  }}
                >
                  A quick, photo-based view of visible product condition.
                </Text>
              </View>

              <TouchableOpacity
                accessibilityLabel="Close grade guide"
                onPress={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.14)",
                }}
              >
                <Text style={{ color: colors.white, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            {GRADE_DEFINITIONS.map((definition) => (
              <View
                key={definition.grade}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingVertical: 10,
                  borderBottomWidth:
                    definition.grade === "U" ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: definition.color,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 18,
                      fontWeight: "900",
                    }}
                  >
                    {definition.grade}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 14,
                      fontWeight: "800",
                      marginBottom: 2,
                    }}
                  >
                    {definition.label}
                  </Text>
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 12,
                      lineHeight: 17,
                    }}
                  >
                    {definition.description}
                  </Text>
                </View>
              </View>
            ))}

            <View
              style={{
                backgroundColor: colors.background,
                borderRadius: radius.sm,
                padding: spacing.sm,
                marginTop: spacing.sm,
              }}
            >
              <Text
                style={{
                  color: colors.ink,
                  fontSize: 12,
                  fontWeight: "800",
                  marginBottom: 3,
                }}
              >
                Visible condition, not authenticity
              </Text>
              <Text
                style={{
                  color: colors.inkMuted,
                  fontSize: 11,
                  lineHeight: 16,
                }}
              >
                Grades use listing photos and seller details. They are not a
                physical inspection, authenticity guarantee, or durability
                promise. Open “Why this grade?” for the evidence and limits.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.wine,
                borderRadius: 999,
                paddingVertical: 13,
                marginTop: spacing.md,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  textAlign: "center",
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                Got it
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
