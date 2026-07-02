import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
} from "react-native";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    // Check empty fields
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    // Password length check
    if (password.length < 6) {
      Alert.alert(
        "Error",
        "Password must be at least 6 characters"
      );
      return;
    }

    // Success
    Alert.alert("Success", "Signup form submitted");

    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Sign Up
      </Text>

      <TextInput
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 15,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Enter Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 20,
          borderRadius: 8,
        }}
      />

      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}