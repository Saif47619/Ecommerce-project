import { useEffect, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { API_URL } from "../lib/api";

export default function HomeScreen() {
  const [items, setItems] = useState<any[]>([]);

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