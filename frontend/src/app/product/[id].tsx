import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function ProductDetails() {
  const { id } = useLocalSearchParams();

  const [product, setProduct] =
    useState<any>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await fetch(
        `http://192.168.100.11:8000/products/${id}`
      );

      const data = await response.json();

      console.log(data);

      setProduct(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {product.title}
      </Text>

      <Text style={styles.description}>
        {product.description}
      </Text>

      <Text style={styles.price}>
        Rs. {product.price}
      </Text>

      <Text>
        Seller ID: {product.seller_id}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  description: {
    fontSize: 16,
    marginBottom: 10,
  },

  price: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
});