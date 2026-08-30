import {
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useEffect,
  useState,
} from "react";

import {
  colors,
  radius,
  spacing,
} from "../constants/reloop-theme";
import { formatPKR } from "../lib/currency";

export type PaymentMethod =
  | "jazzcash"
  | "easypaisa"
  | "card";

type PaymentSheetProps = {
  visible: boolean;
  amount: number;
  itemTitle: string | null;
  onClose: () => void;
  onConfirm: (
    method: PaymentMethod,
  ) => Promise<void>;
};

const PAYMENT_OPTIONS: Array<{
  method: PaymentMethod;
  label: string;
  subtitle: string;
}> = [
  {
    method: "jazzcash",
    label: "JazzCash",
    subtitle: "Mobile wallet",
  },
  {
    method: "easypaisa",
    label: "Easypaisa",
    subtitle: "Mobile wallet",
  },
  {
    method: "card",
    label: "Credit / Debit Card",
    subtitle: "Visa, Mastercard",
  },
];

export default function PaymentSheet({
  visible,
  amount,
  itemTitle,
  onClose,
  onConfirm,
}: PaymentSheetProps) {
  const [
    selectedMethod,
    setSelectedMethod,
  ] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] =
    useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedMethod(null);
      setProcessing(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!selectedMethod || processing) {
      return;
    }

    setProcessing(true);

    try {
      await onConfirm(selectedMethod);
      onClose();
    } catch (error) {
      Alert.alert(
        "Payment failed",
        error instanceof Error
          ? error.message
          : "Could not complete payment.",
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!processing) {
          onClose();
        }
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor:
            "rgba(34,26,28,0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            padding: spacing.lg,
            maxWidth: 480,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: colors.border,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: spacing.md,
            }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: colors.ink,
              marginBottom: 2,
            }}
          >
            Complete payment
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: colors.inkMuted,
              marginBottom: spacing.md,
            }}
          >
            {itemTitle
              ? `"${itemTitle}"`
              : "Item"}
          </Text>

          <Text
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: colors.ink,
              marginBottom: spacing.lg,
            }}
          >
            {formatPKR(amount)}
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: colors.inkMuted,
              marginBottom: spacing.sm,
              textTransform: "uppercase",
            }}
          >
            Choose payment method
          </Text>

          <View
            style={{
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <PaymentOption
                key={option.method}
                label={option.label}
                subtitle={option.subtitle}
                selected={
                  selectedMethod ===
                  option.method
                }
                onPress={() =>
                  setSelectedMethod(
                    option.method,
                  )
                }
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={() =>
              void handleConfirm()
            }
            disabled={
              !selectedMethod || processing
            }
            style={{
              backgroundColor: colors.wine,
              padding: 16,
              borderRadius: 999,
              opacity:
                !selectedMethod || processing
                  ? 0.5
                  : 1,
              marginBottom: spacing.sm,
            }}
          >
            <Text
              style={{
                color: colors.white,
                textAlign: "center",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {processing
                ? "Processing..."
                : `Pay ${formatPKR(amount)}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            disabled={processing}
          >
            <Text
              style={{
                color: colors.inkMuted,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 11,
              color: colors.inkMuted,
              textAlign: "center",
              marginTop: spacing.md,
            }}
          >
            This is a demo payment. No real
            money is charged.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function PaymentOption({
  label,
  subtitle,
  selected,
  onPress,
}: {
  label: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected
          ? colors.wine
          : colors.border,
        backgroundColor: selected
          ? colors.background
          : colors.surface,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: colors.ink,
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: colors.inkMuted,
          }}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected
            ? colors.wine
            : colors.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: colors.wine,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}