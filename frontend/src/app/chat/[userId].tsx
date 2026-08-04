import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { API_URL } from "../../lib/api";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";

export default function ChatScreen() {
  const { userId, itemId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const loadMessages = () => {
    if (!user) return;
    fetch(`${API_URL}/messages/thread/${user.id}/${userId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [user, userId]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const messageText = text;
    setText("");

    try {
      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: Number(userId),
          text: messageText,
        }),
      });
      loadMessages();
    } catch (error) {
      console.log("Failed to send:", error);
    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || !user) return;
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Enter a valid offer amount");
      return;
    }

    try {
      await fetch(`${API_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: Number(userId),
          item_id: itemId ? Number(itemId) : null,
          text: `Offered $${price}`,
          offer_price: price,
        }),
      });
      setOfferPrice("");
      setOfferMode(false);
      loadMessages();
    } catch (error) {
      console.log("Failed to send offer:", error);
    }
  };

  const respondToOffer = async (messageId: number, status: "accepted" | "declined") => {
    try {
      await fetch(`${API_URL}/messages/${messageId}/respond-offer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      loadMessages();
    } catch (error) {
      console.log("Failed to respond:", error);
    }
  };

  if (!user) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          padding: spacing.md,
          paddingTop: 60,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ ...type.h1, color: colors.ink }}>Conversation</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => {
          const isMine = m.sender_id === user.id;

          if (m.offer_price != null) {
            return (
              <View
                key={m.id}
                style={{
                  alignSelf: isMine ? "flex-end" : "flex-start",
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.brass,
                  borderRadius: radius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.xs,
                  maxWidth: "80%",
                }}
              >
                <Text style={{ ...type.label, color: colors.brass }}>OFFER</Text>
                {m.item_title && (
                  <Text style={{ ...type.body, color: colors.inkMuted, marginTop: 2 }}>
                    on "{m.item_title}"
                  </Text>
                )}
                <Text style={{ ...type.h1, color: colors.ink, marginVertical: 4 }}>
                  ${m.offer_price}
                </Text>

                {m.offer_status === "pending" && !isMine && (
                  <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs }}>
                    <TouchableOpacity
                      onPress={() => respondToOffer(m.id, "accepted")}
                      style={{
                        backgroundColor: colors.sage,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13 }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => respondToOffer(m.id, "declined")}
                      style={{
                        backgroundColor: colors.border,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Text style={{ color: colors.inkMuted, fontWeight: "700", fontSize: 13 }}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {m.offer_status === "pending" && isMine && (
                  <Text style={{ ...type.label, color: colors.inkMuted }}>Waiting for response...</Text>
                )}
                {m.offer_status === "accepted" && (
                  <Text style={{ ...type.label, color: colors.sage }}>Accepted</Text>
                )}
                {m.offer_status === "declined" && (
                  <Text style={{ ...type.label, color: colors.inkMuted }}>Declined</Text>
                )}
              </View>
            );
          }

          return (
            <View
              key={m.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                backgroundColor: isMine ? colors.wine : colors.surface,
                borderWidth: isMine ? 0 : 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                padding: spacing.sm,
                marginBottom: spacing.xs,
                maxWidth: "75%",
              }}
            >
              <Text style={{ color: isMine ? colors.white : colors.ink }}>{m.text}</Text>
            </View>
          );
        })}
      </ScrollView>

      {offerMode && (
        <View
          style={{
            flexDirection: "row",
            padding: spacing.sm,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.brass,
            gap: spacing.sm,
            alignItems: "center",
          }}
        >
          <Text style={{ ...type.h2, color: colors.brass }}>$</Text>
          <TextInput
            value={offerPrice}
            onChangeText={setOfferPrice}
            placeholder="Amount"
            placeholderTextColor={colors.inkMuted}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: 10,
              color: colors.ink,
            }}
          />
          <TouchableOpacity
            onPress={handleSendOffer}
            style={{ backgroundColor: colors.brass, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.sm }}
          >
            <Text style={{ color: colors.white, fontWeight: "700" }}>Send offer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOfferMode(false)} style={{ padding: 10 }}>
            <Text style={{ color: colors.inkMuted }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {!offerMode && (
        <View
          style={{
            flexDirection: "row",
            padding: spacing.sm,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <TouchableOpacity
            onPress={() => setOfferMode(true)}
            style={{
              borderWidth: 1,
              borderColor: colors.brass,
              paddingHorizontal: 14,
              justifyContent: "center",
              borderRadius: radius.sm,
            }}
          >
            <Text style={{ color: colors.brass, fontWeight: "700" }}>Offer</Text>
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.inkMuted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sm,
              padding: 10,
              color: colors.ink,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={{
              backgroundColor: colors.wine,
              paddingHorizontal: 18,
              justifyContent: "center",
              borderRadius: radius.sm,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}