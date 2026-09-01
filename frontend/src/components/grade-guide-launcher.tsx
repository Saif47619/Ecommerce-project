import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";

import { colors } from "../constants/reloop-theme";
import GradeGuideModal from "./grade-guide-modal";

const GRADE_GUIDE_STORAGE_KEY = "reloop.grade-guide.v1.seen";

export default function GradeGuideLauncher() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(GRADE_GUIDE_STORAGE_KEY)
      .then((seen) => {
        if (active && !seen) {
          setVisible(true);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const closeGuide = () => {
    setVisible(false);
    void AsyncStorage.setItem(GRADE_GUIDE_STORAGE_KEY, "true");
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          height: 34,
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: 10,
          backgroundColor: colors.surface,
        }}
      >
        <Text
          style={{
            color: colors.wine,
            fontSize: 11,
            fontWeight: "900",
          }}
        >
          A–D
        </Text>
        <Text
          style={{
            color: colors.ink,
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          Grades
        </Text>
      </TouchableOpacity>

      <GradeGuideModal visible={visible} onClose={closeGuide} />
    </>
  );
}
