import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { cardShadow, colors, radius, spacing, type } from "../constants/reloop-theme";
import { formatPKR } from "../lib/currency";
import {
  getPricePosition,
  requestPriceGuidance,
  type PriceGuidance,
  type PricePosition,
} from "../lib/price-guidance";


type PriceGuidanceCardProps = {
  title: string;
  category: string;
  brand: string;
  condition: string;
  price: string;
  excludeItemId?: number;
  onUsePrice: (price: number) => void;
  style?: StyleProp<ViewStyle>;
};

const POSITION_LABELS: Record<PricePosition, string> = {
  below_range: "Your price is below the reference range.",
  within_range: "Your price sits within the reference range.",
  above_range: "Your price is above the reference range.",
};

const CONFIDENCE_COLORS = {
  low: colors.brass,
  medium: colors.sage,
  high: colors.sage,
};

export default function PriceGuidanceCard({
  title,
  category,
  brand,
  condition,
  price,
  excludeItemId,
  onUsePrice,
  style,
}: PriceGuidanceCardProps) {
  const [guidance, setGuidance] = useState<PriceGuidance | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setGuidance(null);
    setError("");
  }, [title, category, brand, condition, excludeItemId]);

  const handleCheck = async () => {
    setChecking(true);
    setError("");

    try {
      const result = await requestPriceGuidance({
        title,
        category,
        brand,
        condition,
        sellerPrice: price,
        excludeItemId,
      });
      setGuidance(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Fair price guidance is unavailable right now.",
      );
    } finally {
      setChecking(false);
    }
  };

  const position = guidance
    ? getPricePosition(price, guidance.suggested_min, guidance.suggested_max)
    : null;
  const isReady =
    guidance?.status === "ready" &&
    guidance.suggested_min !== null &&
    guidance.suggested_midpoint !== null &&
    guidance.suggested_max !== null;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          ...cardShadow,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: "#F6ECEF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16 }}>Rs</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...type.h2, color: colors.ink }}>Fair price check</Text>
          <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>
            Uses recent, human-reviewed Pakistan-market references—not an AI guess.
          </Text>
        </View>
      </View>

      {!guidance && !error && (
        <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: spacing.md }}>
          Add a clear title first. Category, brand, condition, and your entered price improve the comparison.
        </Text>
      )}

      {error ? (
        <View
          style={{
            backgroundColor: "#FFF3E4",
            borderRadius: radius.sm,
            padding: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          <Text style={{ color: colors.wine, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}

      {guidance?.status === "insufficient_data" && (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: radius.sm,
            padding: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 13 }}>
            Not enough trustworthy matches yet
          </Text>
          <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: 4 }}>
            {guidance.summary}
          </Text>
        </View>
      )}

      {isReady && guidance && (
        <View style={{ marginTop: spacing.md }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: spacing.sm,
            }}
          >
            <View>
              <Text style={{ ...type.label, color: colors.inkMuted }}>Reference range</Text>
              <Text style={{ ...type.h1, color: colors.ink, marginTop: 3 }}>
                {formatPKR(guidance.suggested_min)}–{formatPKR(guidance.suggested_max)}
              </Text>
              <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 12, marginTop: 3 }}>
                Midpoint {formatPKR(guidance.suggested_midpoint)}
              </Text>
            </View>
            <View
              style={{
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: "#F7F3EA",
              }}
            >
              <Text
                style={{
                  color: CONFIDENCE_COLORS[guidance.confidence],
                  fontWeight: "700",
                  fontSize: 11,
                  textTransform: "capitalize",
                }}
              >
                {guidance.confidence} confidence
              </Text>
            </View>
          </View>

          {position && (
            <Text
              style={{
                color: position === "within_range" ? colors.sage : colors.brass,
                fontWeight: "700",
                fontSize: 12,
                marginTop: spacing.sm,
              }}
            >
              {POSITION_LABELS[position]}
            </Text>
          )}

          <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 11, marginTop: spacing.sm }}>
            {guidance.sample_count} reference{guidance.sample_count === 1 ? "" : "s"}
            {guidance.source_names.length > 0
              ? ` from ${guidance.source_names.join(", ")}`
              : ""}
            {` • ${guidance.sold_sample_count} completed sale${guidance.sold_sample_count === 1 ? "" : "s"}`}
          </Text>

          {guidance.warnings.map((warning) => (
            <Text
              key={warning}
              style={{ ...type.body, color: colors.inkMuted, fontSize: 11, marginTop: 4 }}
            >
              • {warning}
            </Text>
          ))}

          <TouchableOpacity
            onPress={() => onUsePrice(guidance.suggested_midpoint as number)}
            style={{
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: colors.wine,
              borderRadius: 999,
              paddingVertical: 9,
              paddingHorizontal: 13,
              marginTop: spacing.md,
            }}
          >
            <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 12 }}>
              Use midpoint {formatPKR(guidance.suggested_midpoint)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={handleCheck}
        disabled={checking || title.trim().length < 2}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: colors.wine,
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginTop: spacing.md,
          opacity: checking || title.trim().length < 2 ? 0.55 : 1,
        }}
      >
        {checking && <ActivityIndicator size="small" color={colors.white} />}
        <Text style={{ color: colors.white, fontWeight: "700", fontSize: 12 }}>
          {checking
            ? "Checking market references..."
            : guidance
              ? "Check again"
              : "Check fair price"}
        </Text>
      </TouchableOpacity>

      <Text style={{ ...type.body, color: colors.inkMuted, fontSize: 10, marginTop: spacing.sm }}>
        Guidance only. The seller chooses the final price; authenticity is not inferred from price.
      </Text>
    </View>
  );
}
