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
import { colors } from "../../styles/colors";
import { isEmail } from "../../utils/validators";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
              color: colors.subtext,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            ACCOUNT HELP
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 32,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Reset password
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 34,
            paddingHorizontal: 18,
            paddingVertical: 24,
            shadowColor: "#000000",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: colors.subtext,
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
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />

          <Pressable onPress={handleReset} style={primaryButton}>
            <Text style={{ color: colors.white, fontWeight: "800" }}>
              Send reset link
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "800" }}>
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
  borderColor: colors.border,
  backgroundColor: colors.white,
  color: colors.text,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: colors.primary,
};
