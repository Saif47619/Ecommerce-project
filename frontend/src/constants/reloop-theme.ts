import { Platform } from "react-native";

export const colors = {
  background: "#F7F1E8",
  surface: "#FFFDF9",
  border: "#E8DFD3",
  ink: "#2B1E22",
  inkMuted: "#8A7A72",
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
  lg: 28,
  xl: 40,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
};

const serif = Platform.select({ web: "Georgia, 'Times New Roman', serif", default: "serif" });

export const type = {
  brand: { fontFamily: serif, fontSize: 28, fontWeight: "700" as const, letterSpacing: 0.2 },
  h1: { fontFamily: serif, fontSize: 22, fontWeight: "700" as const },
  h2: { fontFamily: serif, fontSize: 17, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const, color: undefined },
  label: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1, textTransform: "uppercase" as const },
  price: { fontFamily: serif, fontSize: 17, fontWeight: "700" as const },
};