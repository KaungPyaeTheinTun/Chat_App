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
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { isEmail } from "../../utils/validators";

export default function PasswordResetScreen({ navigation }) {
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [email, setEmail] = useState("");

  const handleReset = () => {
    if (!isEmail(email)) {
      showError(t("authInvalidEmail"));
      return;
    }

    showSuccess(t("authResetReady"));
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
            {t("authAccountHelp")}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("authResetPassword")}
          </Text>
          <Text style={{ marginTop: 8, color: colors.subtext }}>
            {t("authResetSubtitle")}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.cardGlass,
            borderRadius: 34,
            paddingHorizontal: 18,
            paddingVertical: 24,
            borderWidth: 1,
            borderColor: colors.border,
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
              color: colors.subtext,
              lineHeight: 20,
            }}
          >
            {t("authResetInfo")}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t("authEmail")}
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[
              inputStyle,
              {
                borderColor: colors.border,
                backgroundColor: colors.input,
                color: colors.text,
              },
            ]}
          />

          <Pressable
            onPress={handleReset}
            style={[primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {t("authSendReset")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: colors.primary, fontWeight: "800" }}>
              {t("commonBackToLogin")}
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
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
};
