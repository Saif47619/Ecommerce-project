import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../../context/auth-context";
import { API_URL } from "../../lib/api";
import { colors, spacing, radius, type } from "../../constants/reloop-theme";
import { formatPKR } from "../../lib/currency";

export default function ChatScreen() {
  const { userId, itemId, offerMode: offerModeParam } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [offerMode, setOfferMode] = useState(offerModeParam === "true");
  const [offerPrice, setOfferPrice] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const [paymentSheet, setPaymentSheet] = useState<{ messageId: number; amount: number; itemTitle: string | null } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
          text: `Offered ${formatPKR(price)}`,
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

  const markPaid = async (messageId: number) => {
    try {
      await fetch(`${API_URL}/messages/${messageId}/mark-paid`, { method: "PUT" });
      loadMessages();
    } catch (error) {
      console.log("Failed to mark paid:", error);
    }
  };

  const openPaymentSheet = (messageId: number, amount: number, itemTitle: string | null) => {
    setSelectedMethod(null);
    setPaymentSheet({ messageId, amount, itemTitle });
  };

  const handleConfirmPayment = async () => {
    if (!paymentSheet || !selectedMethod) return;
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    await markPaid(paymentSheet.messageId);
    setProcessing(false);
    setPaymentSheet(null);
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
        <TouchableOpacity onPress={() => router.push("/inbox")} style={{ marginBottom: spacing.xs, alignSelf: "flex-start" }}>
          <Text style={{ color: colors.wine, fontWeight: "700", fontSize: 14 }}>← Inbox</Text>
        </TouchableOpacity>
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
                  {formatPKR(m.offer_price)}
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

                {m.offer_status === "accepted" && !m.paid && isMine && (
                  <View style={{ marginTop: spacing.xs }}>
                    <Text style={{ ...type.label, color: colors.sage, marginBottom: spacing.xs }}>Accepted</Text>
                    <TouchableOpacity
                      onPress={() => openPaymentSheet(m.id, m.offer_price, m.item_title)}
                      style={{ backgroundColor: colors.wine, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 }}
                    >
                      <Text style={{ color: colors.white, fontWeight: "700", fontSize: 13, textAlign: "center" }}>
                        Pay now
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {m.offer_status === "accepted" && !m.paid && !isMine && (
                  <Text style={{ ...type.label, color: colors.sage }}>Accepted · Awaiting payment</Text>
                )}

                {m.offer_status === "accepted" && m.paid && (
                  <Text style={{ ...type.label, color: colors.sage }}>✓ Paid</Text>
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
          <Text style={{ ...type.h2, color: colors.brass }}>Rs</Text>
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

      {paymentSheet && (
        <View
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(34,26,28,0.5)",
            justifyContent: "flex-end",
            zIndex: 50,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              padding: spacing.lg,
              maxWidth: 480,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: spacing.md }} />

            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: 2 }}>
              Complete payment
            </Text>
            <Text style={{ fontSize: 13, color: colors.inkMuted, marginBottom: spacing.md }}>
              {paymentSheet.itemTitle ? `"${paymentSheet.itemTitle}"` : "Item"}
            </Text>

            <Text style={{ fontSize: 32, fontWeight: "800", color: colors.ink, marginBottom: spacing.lg }}>
              {formatPKR(paymentSheet.amount)}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.inkMuted, marginBottom: spacing.sm, textTransform: "uppercase" }}>
              Choose payment method
            </Text>

            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              <PaymentOption
                label="JazzCash"
                subtitle="Mobile wallet"
                selected={selectedMethod === "jazzcash"}
                onPress={() => setSelectedMethod("jazzcash")}
              />
              <PaymentOption
                label="Easypaisa"
                subtitle="Mobile wallet"
                selected={selectedMethod === "easypaisa"}
                onPress={() => setSelectedMethod("easypaisa")}
              />
              <PaymentOption
                label="Credit / Debit Card"
                subtitle="Visa, Mastercard"
                selected={selectedMethod === "card"}
                onPress={() => setSelectedMethod("card")}
              />
            </View>

            <TouchableOpacity
              onPress={handleConfirmPayment}
              disabled={!selectedMethod || processing}
              style={{
                backgroundColor: colors.wine,
                padding: 16,
                borderRadius: 999,
                opacity: !selectedMethod || processing ? 0.5 : 1,
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ color: colors.white, textAlign: "center", fontWeight: "700", fontSize: 16 }}>
                {processing
                   ? "Processing..."
                   : `Pay ${formatPKR(paymentSheet.amount)}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setPaymentSheet(null)} disabled={processing}>
              <Text style={{ color: colors.inkMuted, textAlign: "center", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 11, color: colors.inkMuted, textAlign: "center", marginTop: spacing.md }}>
              This is a demo payment. No real money is charged.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

function PaymentOption({ label, subtitle, selected, onPress }: { label: string; subtitle: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: spacing.md,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: selected ? colors.wine : colors.border,
        backgroundColor: selected ? colors.background : colors.surface,
      }}
    >
      <View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.ink }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.inkMuted }}>{subtitle}</Text>
      </View>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: selected ? colors.wine : colors.border,
          backgroundColor: selected ? colors.wine : "transparent",
        }}
      />
    </TouchableOpacity>
  );
}