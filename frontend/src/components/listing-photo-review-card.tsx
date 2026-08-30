import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { cardShadow, colors, radius, spacing, type } from "../constants/reloop-theme";
import type {
  ListingPhotoAnalysis,
  ListingPhotoQuality,
} from "../lib/ai-listing";


type ListingPhotoReviewCardProps = {
  analysis: ListingPhotoAnalysis;
  imageUris: string[];
  checking: boolean;
  onUseRecommendedCover: () => void;
  onCheckAgain: () => void;
};

const ISSUE_LABELS: Record<string, string> = {
  blurry: "Blurry",
  too_dark: "Too dark",
  overexposed: "Overexposed",
  cropped: "Cropped",
  obstructed: "Obstructed",
  too_distant: "Too distant",
  busy_background: "Busy background",
  screenshot_or_ui: "Screenshot or UI visible",
  promotional_or_stock_like: "Looks promotional or stock-like",
  duplicate_like: "Looks like a duplicate",
};

const QUALITY_LABELS: Record<ListingPhotoQuality, string> = {
  strong: "Strong",
  usable: "Usable",
  poor: "Retake",
};

const QUALITY_COLORS: Record<ListingPhotoQuality, string> = {
  strong: colors.sage,
  usable: colors.brass,
  poor: colors.wine,
};

const COVERAGE_LABELS = {
  strong: "Strong coverage",
  partial: "Partial coverage",
  limited: "Limited coverage",
};


export default function ListingPhotoReviewCard({
  analysis,
  imageUris,
  checking,
  onUseRecommendedCover,
  onCheckAgain,
}: ListingPhotoReviewCardProps) {
  const recommendedNumber = analysis.recommended_cover_photo_number;
  const recommendedAlreadyFirst = recommendedNumber === 1;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.md,
        gap: spacing.md,
        ...cardShadow,
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
          <Text style={{ ...type.h2, color: colors.ink }}>
            ✨ Reloop AI Photo Check
          </Text>
          <Text
            style={{
              ...type.body,
              color: colors.inkMuted,
              fontSize: 12,
              marginTop: 3,
            }}
          >
            {analysis.summary}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 999,
            paddingVertical: 5,
            paddingHorizontal: 9,
          }}
        >
          <Text
            style={{
              color: colors.wine,
              fontWeight: "700",
              fontSize: 10,
            }}
          >
            {COVERAGE_LABELS[analysis.photo_coverage]}
          </Text>
        </View>
      </View>

      {recommendedNumber === null ? (
        <View
          style={{
            backgroundColor: "#FFF3E4",
            borderRadius: radius.sm,
            padding: spacing.sm,
          }}
        >
          <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 12 }}>
            No safe cover recommended
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 11, marginTop: 3 }}>
            Retake or replace the flagged photos before publishing.
          </Text>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#F2F5EE",
            borderRadius: radius.sm,
            padding: spacing.sm,
          }}
        >
          <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 12 }}>
            {recommendedAlreadyFirst
              ? "Your first photo is the recommended cover"
              : `Photo ${recommendedNumber} is the recommended cover`}
          </Text>
          {!recommendedAlreadyFirst && (
            <TouchableOpacity
              onPress={onUseRecommendedCover}
              style={{
                alignSelf: "flex-start",
                backgroundColor: colors.wine,
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginTop: spacing.xs,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: "700", fontSize: 11 }}>
                Use photo {recommendedNumber} as cover
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ gap: spacing.sm }}>
        {analysis.photos.map((photo) => {
          const issueLabels = photo.issues
            .filter((issue) => issue !== "none")
            .map((issue) => ISSUE_LABELS[issue] || issue.replaceAll("_", " "));
          const imageUri = imageUris[photo.photo_number - 1];

          return (
            <View
              key={photo.photo_number}
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                paddingTop: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: radius.sm,
                    backgroundColor: colors.background,
                  }}
                  resizeMode="cover"
                />
              ) : null}

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 12 }}>
                    Photo {photo.photo_number} · {photo.view}
                  </Text>
                  <Text
                    style={{
                      color: QUALITY_COLORS[photo.quality],
                      fontWeight: "700",
                      fontSize: 11,
                    }}
                  >
                    {QUALITY_LABELS[photo.quality]} · {photo.cover_score}/100
                  </Text>
                </View>

                {issueLabels.length > 0 && (
                  <Text style={{ color: colors.wine, fontSize: 10, marginTop: 3 }}>
                    {issueLabels.join(" · ")}
                  </Text>
                )}

                <Text style={{ color: colors.inkMuted, fontSize: 11, marginTop: 3 }}>
                  {photo.feedback}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {analysis.missing_photos.length > 0 && (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: radius.sm,
            padding: spacing.sm,
          }}
        >
          <Text style={{ color: colors.ink, fontWeight: "700", fontSize: 11 }}>
            Photos that would improve this listing
          </Text>
          {analysis.missing_photos.map((suggestion) => (
            <Text
              key={suggestion}
              style={{ color: colors.inkMuted, fontSize: 11, marginTop: 4 }}
            >
              • {suggestion}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={onCheckAgain}
        disabled={checking}
        style={{
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          opacity: checking ? 0.6 : 1,
        }}
      >
        {checking && <ActivityIndicator size="small" color={colors.wine} />}
        <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 11 }}>
          {checking ? "Checking photos..." : "Check photos again"}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: colors.inkMuted, fontSize: 10 }}>
        AI reviews visible photo quality only. You decide what to publish.
      </Text>
    </View>
  );
}
