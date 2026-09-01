export type ReloopGrade = "A" | "B" | "C" | "D" | "U";

export type GradeStatus =
  | "graded"
  | "needs_photos"
  | "stale"
  | "unverified";

export type ProductGradeFields = {
  reloop_grade?: string | null;
  grade_label?: string | null;
  grade_status?: string | null;
  grade_confidence?: string | null;
  grade_summary?: string | null;
  graded_at?: string | null;
};

export type GradeDefinition = {
  grade: ReloopGrade;
  label: string;
  description: string;
  color: string;
  softColor: string;
};

export const GRADE_DEFINITIONS: GradeDefinition[] = [
  {
    grade: "A",
    label: "Like new",
    description: "No meaningful visible wear in clear, useful photos.",
    color: "#236047",
    softColor: "#E7F3EC",
  },
  {
    grade: "B",
    label: "Very good",
    description: "Light visible wear; clean and ready to use.",
    color: "#345E71",
    softColor: "#E8F0F4",
  },
  {
    grade: "C",
    label: "Good",
    description: "Noticeable wear or minor flaws, but still usable.",
    color: "#8A6429",
    softColor: "#F6EEDC",
  },
  {
    grade: "D",
    label: "Well worn",
    description: "Heavy wear, damage, or repair needs are visible.",
    color: "#8A3D32",
    softColor: "#F8E8E5",
  },
  {
    grade: "U",
    label: "Unverified",
    description: "Not enough reliable photo evidence to assign A-D.",
    color: "#655C57",
    softColor: "#EEEAE6",
  },
];

const definitionByGrade = new Map(
  GRADE_DEFINITIONS.map((definition) => [
    definition.grade,
    definition,
  ]),
);

export function normalizeGrade(value?: string | null): ReloopGrade {
  const normalized = (value || "U").trim().toUpperCase();

  if (
    normalized === "A" ||
    normalized === "B" ||
    normalized === "C" ||
    normalized === "D"
  ) {
    return normalized;
  }

  return "U";
}

export function getGradeDefinition(
  value?: string | null,
): GradeDefinition {
  const grade = normalizeGrade(value);
  return definitionByGrade.get(grade) || GRADE_DEFINITIONS[4];
}

export function getGradeDisplay(
  fields: ProductGradeFields,
): GradeDefinition & { status: GradeStatus } {
  const rawStatus = fields.grade_status;
  const status: GradeStatus =
    rawStatus === "graded" ||
    rawStatus === "needs_photos" ||
    rawStatus === "stale"
      ? rawStatus
      : "unverified";

  const grade =
    status === "stale"
      ? "U"
      : normalizeGrade(fields.reloop_grade);
  const definition = getGradeDefinition(grade);

  return {
    ...definition,
    label: fields.grade_label?.trim() || definition.label,
    status,
  };
}
