import { View, Text, Button } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 24 }}>Home Screen</Text>

      <Button
        title="Go to Login"
        onPress={() => router.push("/login")}
      />

      <Button
        title="Go to Signup"
        onPress={() => router.push("/signup")}
      />

      <Button
        title="Go to Profile"
        onPress={() => router.push("/profile")}
      />
    </View>
  );
}