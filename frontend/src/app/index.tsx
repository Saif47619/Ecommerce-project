import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/products")
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((error) => {
        console.log("ERROR:", error);
      });
  }, []);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
      }}
    >
      <View
        style={{
          padding: 20,
          marginTop: 40,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Clothes Marketplace
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: "gray",
            marginTop: 10,
            marginBottom: 20,
          }}
        >
          Buy and sell clothes online
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={{
            backgroundColor: "green",
            padding: 15,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={{
            backgroundColor: "#333",
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Signup
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 15,
          }}
        >
          Featured Products
        </Text>

        {products.map((item) => (
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
      </View>
    </ScrollView>
  );
}