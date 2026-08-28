import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  checkItemFit,
  FitCheckRequest,
  FitCheckResponse,
  PreferredFit,
} from "../lib/ai-fit";
import {
  colors,
  radius,
  spacing,
  type,
} from "../constants/reloop-theme";

export type GarmentFitMeasurements = {
  chest_width_in?: number | null;
  shoulder_width_in?: number | null;
  waist_width_in?: number | null;
  hip_width_in?: number | null;
  length_in?: number | null;
  inseam_in?: number | null;
};

type FitConfidenceCardProps = {
  itemId: number;
  measurements: GarmentFitMeasurements;
};

type BodyMeasurementKey =
  | "chest_in"
  | "shoulder_in"
  | "waist_in"
  | "hip_in"
  | "inseam_in";

type BuyerMeasurementValues = Record<BodyMeasurementKey, string>;

const EMPTY_BUYER_MEASUREMENTS: BuyerMeasurementValues = {
  chest_in: "",
  shoulder_in: "",
  waist_in: "",
  hip_in: "",
  inseam_in: "",
};

const BODY_MEASUREMENT_FIELDS: {
  requestKey: BodyMeasurementKey;
  garmentKey: keyof GarmentFitMeasurements;
  label: string;
  placeholder: string;
}[] = [
  {
    requestKey: "chest_in",
    garmentKey: "chest_width_in",
    label: "Your chest circumference",
    placeholder: "e.g. 40",
  },
  {
    requestKey: "shoulder_in",
    garmentKey: "shoulder_width_in",
    label: "Your shoulder width",
    placeholder: "e.g. 17.5",
  },
  {
    requestKey: "waist_in",
    garmentKey: "waist_width_in",
    label: "Your waist circumference",
    placeholder: "e.g. 34",
  },
  {
    requestKey: "hip_in",
    garmentKey: "hip_width_in",
    label: "Your hip circumference",
    placeholder: "e.g. 40",
  },
  {
    requestKey: "inseam_in",
    garmentKey: "inseam_in",
    label: "Your inseam",
    placeholder: "e.g. 30",
  },
];

const GARMENT_MEASUREMENT_ROWS: {
  key: keyof GarmentFitMeasurements;
  label: string;
}[] = [
  {
    key: "chest_width_in",
    label: "Chest width (flat)",
  },
  {
    key: "shoulder_width_in",
    label: "Shoulder width",
  },
  {
    key: "waist_width_in",
    label: "Waist width (flat)",
  },
  {
    key: "hip_width_in",
    label: "Hip width (flat)",
  },
  {
    key: "length_in",
    label: "Garment length",
  },
  {
    key: "inseam_in",
    label: "Inseam",
  },
];

const FIT_OPTIONS: {
  value: PreferredFit;
  label: string;
}[] = [
  {
    value: "fitted",
    label: "Fitted",
  },
  {
    value: "regular",
    label: "Regular",
  },
  {
    value: "relaxed",
    label: "Relaxed",
  },
];

function formatMeasurement(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return `${value} in`;
}

function confidenceLabel(confidence: string) {
  return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
}

export default function FitConfidenceCard({
  itemId,
  measurements,
}: FitConfidenceCardProps) {
  const [preferredFit, setPreferredFit] =
    useState<PreferredFit>("regular");
  const [buyerMeasurements, setBuyerMeasurements] =
    useState<BuyerMeasurementValues>(
      EMPTY_BUYER_MEASUREMENTS,
    );
  const [result, setResult] =
    useState<FitCheckResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const listedGarmentMeasurements = useMemo(
    () =>
      GARMENT_MEASUREMENT_ROWS.filter(
        (row) =>
          formatMeasurement(measurements[row.key]) !== null,
      ),
    [measurements],
  );

  const availableBodyFields = useMemo(
    () =>
      BODY_MEASUREMENT_FIELDS.filter((field) => {
        const value = measurements[field.garmentKey];

        return (
          typeof value === "number" &&
          Number.isFinite(value)
        );
      }),
    [measurements],
  );

  const handleMeasurementChange = (
    key: BodyMeasurementKey,
    value: string,
  ) => {
    setBuyerMeasurements((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
    setResult(null);
  };

  const handlePreferredFitChange = (
    value: PreferredFit,
  ) => {
    setPreferredFit(value);
    setError("");
    setResult(null);
  };

  const handleCheckFit = async () => {
    const parsedMeasurements: Partial<
      Record<BodyMeasurementKey, number>
    > = {};

    for (const field of availableBodyFields) {
      const rawValue =
        buyerMeasurements[field.requestKey].trim();

      if (!rawValue) {
        continue;
      }

      const numberValue = Number(rawValue);

      if (
        !Number.isFinite(numberValue) ||
        numberValue <= 0 ||
        numberValue > 100
      ) {
        setError(
          `${field.label} must be between 0 and 100 inches.`,
        );
        return;
      }

      parsedMeasurements[field.requestKey] =
        numberValue;
    }

    if (Object.keys(parsedMeasurements).length === 0) {
      setError(
        "Enter at least one measurement that matches the seller’s measurements.",
      );
      return;
    }

    const request: FitCheckRequest = {
      item_id: itemId,
      preferred_fit: preferredFit,
      ...parsedMeasurements,
    };

    setChecking(true);
    setError("");
    setResult(null);

    try {
      const fitResult = await checkItemFit(request);
      setResult(fitResult);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Reloop could not estimate the fit.",
      );
    } finally {
      setChecking(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: spacing.sm,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          ...type.h2,
          color: colors.ink,
          fontSize: 16,
          marginBottom: 4,
        }}
      >
        AI Fit Confidence
      </Text>

      <Text
        style={{
          ...type.body,
          color: colors.inkMuted,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        Compare your body measurements with the
        seller-provided garment measurements.
      </Text>

      {listedGarmentMeasurements.length === 0 ? (
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
              color: colors.inkMuted,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            Fit check is unavailable because the seller
            has not added garment measurements.
          </Text>
        </View>
      ) : (
        <>
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
                ...type.label,
                color: colors.inkMuted,
                marginBottom: spacing.xs,
              }}
            >
              Seller measurements
            </Text>

            {listedGarmentMeasurements.map(
              (measurement, index) => (
                <View
                  key={measurement.key}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 5,
                    borderBottomWidth:
                      index ===
                      listedGarmentMeasurements.length - 1
                        ? 0
                        : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 12,
                    }}
                  >
                    {measurement.label}
                  </Text>

                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    {formatMeasurement(
                      measurements[measurement.key],
                    )}
                  </Text>
                </View>
              ),
            )}
          </View>

          {availableBodyFields.length === 0 ? (
            <Text
              style={{
                color: colors.inkMuted,
                fontSize: 12,
                lineHeight: 18,
                marginTop: spacing.sm,
              }}
            >
              The available garment measurements cannot
              currently be compared with body measurements.
            </Text>
          ) : (
            <>
              <Text
                style={{
                  ...type.label,
                  color: colors.inkMuted,
                  marginTop: spacing.sm,
                  marginBottom: spacing.xs,
                }}
              >
                How do you want it to fit?
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: spacing.xs,
                }}
              >
                {FIT_OPTIONS.map((option) => {
                  const selected =
                    preferredFit === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        handlePreferredFitChange(
                          option.value,
                        )
                      }
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        backgroundColor: selected
                          ? colors.wine
                          : colors.background,
                        borderWidth: 1,
                        borderColor: selected
                          ? colors.wine
                          : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          color: selected
                            ? colors.white
                            : colors.ink,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={{
                  ...type.label,
                  color: colors.inkMuted,
                  marginTop: spacing.sm,
                  marginBottom: spacing.xs,
                }}
              >
                Your measurements (inches)
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: spacing.xs,
                }}
              >
                {availableBodyFields.map((field) => (
                  <View
                    key={field.requestKey}
                    style={{
                      flexGrow: 1,
                      flexBasis: 135,
                      minWidth: 125,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.inkMuted,
                        fontSize: 11,
                        marginBottom: 4,
                      }}
                    >
                      {field.label}
                    </Text>

                    <TextInput
                      value={
                        buyerMeasurements[
                          field.requestKey
                        ]
                      }
                      onChangeText={(value) =>
                        handleMeasurementChange(
                          field.requestKey,
                          value,
                        )
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.inkMuted}
                      keyboardType="decimal-pad"
                      style={{
                        backgroundColor:
                          colors.background,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        color: colors.ink,
                        fontSize: 13,
                      }}
                    />
                  </View>
                ))}
              </View>

              <Text
                style={{
                  color: colors.inkMuted,
                  fontSize: 11,
                  lineHeight: 16,
                  marginTop: spacing.xs,
                }}
              >
                Your measurements are used for this check
                only and are not saved.
              </Text>

              {error ? (
                <Text
                  style={{
                    color: colors.wine,
                    fontSize: 12,
                    lineHeight: 17,
                    marginTop: spacing.xs,
                  }}
                >
                  {error}
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={handleCheckFit}
                disabled={checking}
                style={{
                  backgroundColor: colors.wine,
                  borderRadius: radius.sm,
                  paddingVertical: 11,
                  marginTop: spacing.sm,
                  opacity: checking ? 0.65 : 1,
                }}
              >
                {checking ? (
                  <ActivityIndicator
                    color={colors.white}
                  />
                ) : (
                  <Text
                    style={{
                      color: colors.white,
                      textAlign: "center",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Check my fit
                  </Text>
                )}
              </TouchableOpacity>

              {result ? (
                <View
                  style={{
                    backgroundColor: "#F4F1E9",
                    borderRadius: radius.sm,
                    padding: spacing.sm,
                    marginTop: spacing.sm,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.sage,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: spacing.xs,
                      marginBottom: spacing.xs,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.ink,
                        fontSize: 16,
                        fontWeight: "800",
                      }}
                    >
                      {result.label}
                    </Text>

                    <Text
                      style={{
                        color: colors.sage,
                        fontSize: 11,
                        fontWeight: "800",
                        textTransform: "uppercase",
                      }}
                    >
                      {confidenceLabel(
                        result.confidence,
                      )}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: colors.ink,
                      fontSize: 13,
                      lineHeight: 19,
                    }}
                  >
                    {result.summary}
                  </Text>

                  {result.reasons.map(
                    (reason, index) => (
                      <Text
                        key={`${reason}-${index}`}
                        style={{
                          color: colors.inkMuted,
                          fontSize: 12,
                          lineHeight: 18,
                          marginTop: 5,
                        }}
                      >
                        • {reason}
                      </Text>
                    ),
                  )}

                  <Text
                    style={{
                      color: colors.inkMuted,
                      fontSize: 10,
                      lineHeight: 15,
                      marginTop: spacing.xs,
                    }}
                  >
                    {result.disclaimer}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </>
      )}
    </View>
  );
}