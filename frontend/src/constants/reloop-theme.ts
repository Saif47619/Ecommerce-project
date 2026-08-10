import { Platform } from "react-native";

export const colors = {
  background: "#FAF7F2",
  surface: "#FFFFFF",
  border: "#EDE7DE",
  ink: "#221A1C",
  inkMuted: "#8C8079",
  wine: "#6B2737",
  wineDark: "#4A1B26",
  brass: "#A67C3D",
  sage: "#7C8A6F",
  white: "#FFFFFF",
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
};

const serif = Platform.select({ web: "Georgia, 'Times New Roman', serif", default: "serif" });

export const type = {
  brand: { fontFamily: serif, fontSize: 24, fontWeight: "700" as const, letterSpacing: 0.2 },
  h1: { fontSize: 21, fontWeight: "700" as const, color: undefined },
  h2: { fontSize: 15, fontWeight: "700" as const, color: undefined },
  body: { fontSize: 14, fontWeight: "400" as const, color: undefined },
  label: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.6, textTransform: "uppercase" as const },
  price: { fontSize: 15, fontWeight: "700" as const },
};

export const cardShadow = {
  shadowColor: "#221A1C",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 1,
};