import {
  Text,
  TextInput,
  View,
} from "react-native";

import {
  colors,
  radius,
  spacing,
  type,
} from "../constants/reloop-theme";


export type GarmentMeasurementKey =
  | "chest_width_in"
  | "shoulder_width_in"
  | "waist_width_in"
  | "hip_width_in"
  | "length_in"
  | "inseam_in";


export type GarmentMeasurementValues = Record<
  GarmentMeasurementKey,
  string
>;


export type ParsedGarmentMeasurements = Record<
  GarmentMeasurementKey,
  number | null
>;


export const EMPTY_GARMENT_MEASUREMENTS: GarmentMeasurementValues = {
  chest_width_in: "",
  shoulder_width_in: "",
  waist_width_in: "",
  hip_width_in: "",
  length_in: "",
  inseam_in: "",
};


const MEASUREMENT_FIELDS: Array<{
  key: GarmentMeasurementKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: "chest_width_in",
    label: "Chest width",
    placeholder: "e.g. 22",
  },
  {
    key: "shoulder_width_in",
    label: "Shoulder width",
    placeholder: "e.g. 18",
  },
  {
    key: "waist_width_in",
    label: "Waist width",
    placeholder: "e.g. 17",
  },
  {
    key: "hip_width_in",
    label: "Hip width",
    placeholder: "e.g. 21",
  },
  {
    key: "length_in",
    label: "Garment length",
    placeholder: "e.g. 27",
  },
  {
    key: "inseam_in",
    label: "Inseam",
    placeholder: "e.g. 30",
  },
];


export function parseGarmentMeasurements(
  values: GarmentMeasurementValues,
): ParsedGarmentMeasurements {
  const parsed = {} as ParsedGarmentMeasurements;

  MEASUREMENT_FIELDS.forEach((field) => {
    const rawValue = values[field.key].trim();

    if (!rawValue) {
      parsed[field.key] = null;
      return;
    }

    const measurement = Number(rawValue);

    if (
      !Number.isFinite(measurement) ||
      measurement <= 0 ||
      measurement > 100
    ) {
      throw new Error(
        `${field.label} must be between 0 and 100 inches.`,
      );
    }

    parsed[field.key] = measurement;
  });

  return parsed;
}


export function garmentMeasurementsFromItem(
  item: Record<string, any>,
): GarmentMeasurementValues {
  const toInputValue = (
    value: number | string | null | undefined,
  ) => {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  };

  return {
    chest_width_in: toInputValue(item.chest_width_in),
    shoulder_width_in: toInputValue(item.shoulder_width_in),
    waist_width_in: toInputValue(item.waist_width_in),
    hip_width_in: toInputValue(item.hip_width_in),
    length_in: toInputValue(item.length_in),
    inseam_in: toInputValue(item.inseam_in),
  };
}


export function GarmentMeasurementsFields({
  values,
  onChange,
}: {
  values: GarmentMeasurementValues;
  onChange: (
    key: GarmentMeasurementKey,
    value: string,
  ) => void;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View
        style={{
          backgroundColor: colors.background,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        }}
      >
        <Text
          style={{
            ...type.label,
            color: colors.inkMuted,
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Garment measurements
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          padding: spacing.lg,
        }}
      >
        <Text
          style={{
            ...type.body,
            color: colors.ink,
            fontWeight: "700",
            marginBottom: 4,
          }}
        >
          Measurements in inches
        </Text>

        <Text
          style={{
            fontSize: 12,
            lineHeight: 17,
            color: colors.inkMuted,
            marginBottom: spacing.md,
          }}
        >
          Optional. Measure the garment laid flat. Chest, waist,
          and hip should be entered as flat widths, not doubled.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
          }}
        >
          {MEASUREMENT_FIELDS.map((field) => (
            <View
              key={field.key}
              style={{
                flexBasis: "47%",
                flexGrow: 1,
                minWidth: 130,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.ink,
                  marginBottom: 5,
                }}
              >
                {field.label}
              </Text>

              <TextInput
                value={values[field.key]}
                onChangeText={(value) => {
                  onChange(field.key, value);
                }}
                placeholder={field.placeholder}
                placeholderTextColor={colors.inkMuted}
                keyboardType="decimal-pad"
                style={{
                  height: 42,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  backgroundColor: colors.background,
                  paddingHorizontal: spacing.sm,
                  color: colors.ink,
                  fontSize: 14,
                }}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}