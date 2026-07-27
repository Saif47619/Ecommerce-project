import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { API_URL } from "../lib/api";
import { useAuth } from "../context/auth-context";

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch(`${API_URL}/items`)
      .then((response) => response.json())
      .then((data) => {
        setItems(data);
      })
      .catch((error) => {
        console.log("ERROR:", error);
      });
  }, []);

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 20,
        marginTop: 50,
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Auth buttons */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20, gap: 10 }}>
        {user ? (
          <>
            <Text style={{ alignSelf: "center", marginRight: 10 }}>
              Hi, {user.name} ({user.role})
            </Text>
            <TouchableOpacity
              onPress={logout}
              style={{ backgroundColor: "#999", padding: 10, borderRadius: 8 }}
            >
              <Text style={{ color: "white" }}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Link href="/login" asChild>
              <TouchableOpacity style={{ backgroundColor: "green", padding: 10, borderRadius: 8, paddingHorizontal: 20 }}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Login</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/signup" asChild>
              <TouchableOpacity style={{ backgroundColor: "blue", padding: 10, borderRadius: 8, paddingHorizontal: 20 }}>
                <Text style={{ color: "white", fontWeight: "bold" }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
      </View>

      <Text
        style={{
          fontSize: 30,
          fontWeight: "bold",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Items
      </Text>

      {items.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 15,
            marginBottom: 15,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            {item.title}
          </Text>

          <Text
            style={{
              fontSize: 18,
              color: "green",
              fontWeight: "600",
            }}
          >
            ${item.price}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}