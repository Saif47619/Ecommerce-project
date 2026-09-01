import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  ConditionConfidence,
  ConditionPassport,
  ConditionPassportResponse,
  PhotoCoverage,
  SellerConditionConsistency,
  VisualGrade,
  generateConditionPassport,
  getConditionPassport,
} from "../lib/condition-passport";
import {
  colors,
  radius,
  spacing,
  type,
} from "../constants/reloop-theme";
import GradeBadge from "./grade-badge";

type ConditionPassportCardProps = {
  itemId: number;
  isOwner: boolean;
  ownerId?: number;
};

const VISUAL_GRADE_LABELS: Record<
  VisualGrade,
  string
> = {
  like_new: "Looks like new",
  good: "Looks good",
  fair: "Visible wear",
  worn: "Heavily worn",
};

const CONSISTENCY_LABELS: Record<
  SellerConditionConsistency,
  string
> = {
  consistent: "Consistent with seller selection",
  unclear: "Not enough evidence to compare",
  review_recommended: "Review seller condition",
};

const COVERAGE_LABELS: Record<
  PhotoCoverage,
  string
> = {
  strong: "Strong photo coverage",
  partial: "Partial photo coverage",
  limited: "Limited photo coverage",
};

const CONFIDENCE_LABELS: Record<
  ConditionConfidence,
  string
> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export default function ConditionPassportCard({
  itemId,
  isOwner,
  ownerId,
}: ConditionPassportCardProps) {
  const [
    response,
    setResponse,
  ] = useState<ConditionPassportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] =
    useState(false);
  const [error, setError] = useState("");

  const loadPassport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const loaded =
        await getConditionPassport(itemId);
      setResponse(loaded);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load the condition passport.",
      );
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void loadPassport();
  }, [loadPassport]);

  const handleGenerate = async () => {
    if (!isOwner || !ownerId) {
      setError(
        "Only the listing owner can generate this passport.",
      );
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const generated =
        await generateConditionPassport(
          itemId,
          ownerId,
        );

      setResponse(generated);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not generate the condition passport.",
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        padding: spacing.sm,
        marginBottom: spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: spacing.xs,
        }}
      >
        {response?.grade ? (
          <GradeBadge
            compact
            reloop_grade={response.grade.reloop_grade}
            grade_status={response.grade.grade_status}
            grade_label={response.grade.grade_label}
          />
        ) : (
          <View style={{ backgroundColor: colors.wine, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>AI</Text>
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              ...type.h2,
              color: colors.ink,
              fontSize: 16,
              marginBottom: 3,
            }}
          >
            Why this grade?
          </Text>

          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            See the visible evidence, photo coverage,
            and limits behind the Reloop Grade.
          </Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{
            paddingVertical: spacing.md,
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={colors.wine} />

          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 12,
              marginTop: spacing.xs,
            }}
          >
            Loading passport...
          </Text>
        </View>
      ) : null}

      {!loading && error && !response ? (
        <View
          style={{
            marginTop: spacing.sm,
          }}
        >
          <Text
            style={{
              color: colors.wine,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            {error}
          </Text>

          <TouchableOpacity
            onPress={loadPassport}
            style={{
              borderWidth: 1,
              borderColor: colors.wine,
              borderRadius: radius.sm,
              paddingVertical: 9,
              marginTop: spacing.xs,
            }}
          >
            <Text
              style={{
                color: colors.wine,
                textAlign: "center",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading &&
      response?.status === "not_generated" ? (
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
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 4,
            }}
          >
            Grade U · Unverified
          </Text>

          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            {isOwner
              ? "Generate a passport from the listing photos to help buyers understand the visible condition."
              : "The seller has not generated a condition passport for this item."}
          </Text>

          {isOwner ? (
            <PassportActionButton
              generating={generating}
              label="Check product grade"
              onPress={handleGenerate}
            />
          ) : null}
        </View>
      ) : null}

      {!loading &&
      response?.status === "stale" ? (
        <View
          style={{
            backgroundColor: "#FFF4E5",
            borderRadius: radius.sm,
            padding: spacing.sm,
            marginTop: spacing.sm,
            borderLeftWidth: 4,
            borderLeftColor: colors.brass,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontSize: 13,
              fontWeight: "800",
              marginBottom: 4,
            }}
          >
            Grade needs refreshing
          </Text>

          <Text
            style={{
              color: colors.inkMuted,
              fontSize: 12,
              lineHeight: 17,
            }}
          >
            {isOwner
              ? "The listing details or photos changed. Regenerate before buyers rely on this passport."
              : "The listing changed after this passport was generated. Ask the seller to refresh it."}
          </Text>

          {isOwner ? (
            <PassportActionButton
              generating={generating}
              label="Recheck product grade"
              onPress={handleGenerate}
            />
          ) : null}
        </View>
      ) : null}

      {!loading &&
      response?.status === "stale" &&
      !isOwner ? null : (
        <PassportDetails
          passport={response?.passport || null}
        />
      )}

      {!loading &&
      response?.status === "ready" &&
      isOwner ? (
        <PassportActionButton
          generating={generating}
          label="Refresh grade evidence"
          onPress={handleGenerate}
          secondary
        />
      ) : null}

      {error && response ? (
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
    </View>
  );
}

function PassportDetails({
  passport,
}: {
  passport: ConditionPassport | null;
}) {
  if (!passport) {
    return null;
  }

  return (
    <View style={{ marginTop: spacing.sm }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
        }}
      >
        <PassportPill
          label={
            VISUAL_GRADE_LABELS[
              passport.visual_grade
            ]
          }
          emphasized
        />

        <PassportPill
          label={
            CONFIDENCE_LABELS[
              passport.confidence
            ]
          }
        />

        <PassportPill
          label={
            COVERAGE_LABELS[
              passport.photo_coverage
            ]
          }
        />
      </View>

      <Text
        style={{
          color: colors.ink,
          fontSize: 13,
          lineHeight: 19,
          marginTop: spacing.sm,
        }}
      >
        {passport.summary}
      </Text>

      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: radius.sm,
          padding: spacing.xs,
          marginTop: spacing.sm,
        }}
      >
        <Text
          style={{
            color: colors.inkMuted,
            fontSize: 11,
            marginBottom: 3,
          }}
        >
          Seller condition comparison
        </Text>

        <Text
          style={{
            color: colors.ink,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {
            CONSISTENCY_LABELS[
              passport
                .seller_condition_consistency
            ]
          }
        </Text>
      </View>

      <PassportListSection
        title="Visible observations"
        emptyText={
          "No specific visible flaws were identified in the supplied views."
        }
        items={passport.observations.map(
          (observation) =>
            `${observation.area} · ${observation.severity}: ${observation.finding} (Photo ${observation.photo_numbers.join(", ")})`,
        )}
      />

      <PassportListSection
        title="What photos cannot confirm"
        items={passport.limitations}
      />

      {passport.suggested_photos.length > 0 ? (
        <PassportListSection
          title="Photos that would improve confidence"
          items={passport.suggested_photos}
        />
      ) : null}

      <Text
        style={{
          color: colors.inkMuted,
          fontSize: 10,
          lineHeight: 15,
          marginTop: spacing.sm,
        }}
      >
        Based on {passport.photo_count}{" "}
        {passport.photo_count === 1
          ? "photo"
          : "photos"}
        . It cannot verify authenticity, odor,
        cleanliness, hidden damage, or future
        durability.
      </Text>

      <Text
        style={{
          color: colors.inkMuted,
          fontSize: 10,
          marginTop: 3,
        }}
      >
        Updated{" "}
        {new Date(
          passport.updated_at,
        ).toLocaleDateString()}
      </Text>
    </View>
  );
}

function PassportPill({
  label,
  emphasized,
}: {
  label: string;
  emphasized?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: emphasized
          ? colors.wine
          : colors.background,
        borderWidth: 1,
        borderColor: emphasized
          ? colors.wine
          : colors.border,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          color: emphasized
            ? colors.white
            : colors.ink,
          fontSize: 10,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function PassportListSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text
        style={{
          ...type.label,
          color: colors.inkMuted,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>

      {items.length > 0 ? (
        items.map((item, index) => (
          <Text
            key={`${item}-${index}`}
            style={{
              color: colors.ink,
              fontSize: 12,
              lineHeight: 18,
              marginTop: index === 0 ? 0 : 3,
            }}
          >
            • {item}
          </Text>
        ))
      ) : (
        <Text
          style={{
            color: colors.inkMuted,
            fontSize: 12,
            lineHeight: 17,
          }}
        >
          {emptyText || "None reported."}
        </Text>
      )}
    </View>
  );
}

function PassportActionButton({
  generating,
  label,
  onPress,
  secondary,
}: {
  generating: boolean;
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={generating}
      style={{
        backgroundColor: secondary
          ? colors.surface
          : colors.wine,
        borderWidth: 1,
        borderColor: colors.wine,
        borderRadius: radius.sm,
        paddingVertical: 10,
        marginTop: spacing.sm,
        opacity: generating ? 0.65 : 1,
      }}
    >
      {generating ? (
        <ActivityIndicator
          color={
            secondary
              ? colors.wine
              : colors.white
          }
        />
      ) : (
        <Text
          style={{
            color: secondary
              ? colors.wine
              : colors.white,
            textAlign: "center",
            fontSize: 13,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}