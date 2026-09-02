import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useToast } from "../../components/ToastProvider";
import { isEmail } from "../../utils/validators";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "rgba(255,255,255,0.92)";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";
const BORDER = "#eef1f5";

export default function PasswordResetScreen({ navigation }) {
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");

  const handleReset = () => {
    if (!isEmail(email)) {
      showError("Enter a valid email address.");
      return;
    }

    showSuccess("Reset flow UI is ready for API integration.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 22,
          paddingVertical: 28,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <Text
            style={{
              color: SUBTEXT,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            ACCOUNT HELP
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: "900",
              color: TEXT,
            }}
          >
            Reset password
          </Text>
          <Text style={{ marginTop: 8, color: SUBTEXT }}>
            Recover access to your account.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: CARD_BG,
            borderRadius: 34,
            paddingHorizontal: 18,
            paddingVertical: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.72)",
            shadowColor: "#000000",
            shadowOpacity: 0.08,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 14 },
            elevation: 6,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: SUBTEXT,
              lineHeight: 20,
            }}
          >
            Enter your email address and the app will be ready for a reset-link
            flow.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={SUBTEXT}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />

          <Pressable onPress={handleReset} style={primaryButton}>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              Send reset link
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: BLUE, fontWeight: "800" }}>
              Back to login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const inputStyle = {
  marginTop: 16,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: BORDER,
  backgroundColor: "rgba(255,255,255,0.78)",
  color: TEXT,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: BLUE,
};
