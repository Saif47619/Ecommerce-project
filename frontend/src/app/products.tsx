import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        "http://192.168.100.11:8000/products"
      );

      const data = await response.json();

      console.log("PRODUCTS:", data);

      setProducts(data);
    } catch (error) {
      console.log("ERROR:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Products
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push(`/product/${item.id}`)
            }
          >
            <Text style={styles.title}>
              {item.title}
            </Text>

            <Text>
              {item.description}
            </Text>

            <Text style={styles.price}>
              Rs. {item.price}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },

  price: {
    marginTop: 8,
    fontWeight: "bold",
    color: "green",
  },
});