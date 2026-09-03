import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SocialAuthButton from "../../components/SocialAuthButton";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { isEmail, isStrongPassword } from "../../utils/validators";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        delay: 120,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslate, {
        toValue: 0,
        delay: 120,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslate, heroOpacity, heroTranslate]);

  const handleLogin = async () => {
    if (!isEmail(email) || !isStrongPassword(password)) {
      showError(t("authInvalidLogin"));
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      showSuccess(t("authWelcomeToast"));
    } catch (error) {
      showError(getErrorMessage(error, t("authUnableSignIn")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSocialPlaceholder = (provider) => {
    showSuccess(t("authSocialSoon", { provider }));
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
        <Animated.View
          style={{
            opacity: heroOpacity,
            transform: [{ translateY: heroTranslate }],
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: colors.subtext,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            {t("authGetStarted")}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: "700",
              color: colors.text,
            }}
          >
            {t("authWelcomeBack")}
          </Text>
          <Text style={{ marginTop: 8, color: colors.subtext }}>
            {t("authLoginSubtitle")}
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslate }],
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

          <View
            style={[
              passwordWrapStyle,
              {
                borderColor: colors.border,
                backgroundColor: colors.input,
              },
            ]}
          >
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t("authPassword")}
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPassword}
              style={[passwordInputStyle, { color: colors.text }]}
            />
            <Pressable onPress={() => setShowPassword((current) => !current)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.subtext}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate("PasswordReset")}
            style={{ marginTop: 10, alignSelf: "center" }}
          >
            <Text
              style={{ color: colors.subtext, fontSize: 12, fontWeight: "700" }}
            >
              {t("authForgotPassword")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            style={[primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {isSubmitting ? t("authSigningIn") : t("authLogin")}
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <View style={[dividerLine, { backgroundColor: colors.border }]} />
            <Text
              style={{
                marginHorizontal: 12,
                color: colors.subtext,
                fontWeight: "700",
              }}
            >
              {t("authOr")}
            </Text>
            <View style={[dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <SocialAuthButton
            label={t("authGoogle")}
            icon="google"
            onPress={() => showSocialPlaceholder("Google")}
          />
          <SocialAuthButton
            label={t("authGithub")}
            icon="github"
            variant="soft"
            onPress={() => showSocialPlaceholder("GitHub")}
          />

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: colors.subtext, fontSize: 13 }}>
              {t("authNeedAccount")}{" "}
              <Text style={{ color: colors.primary, fontWeight: "800" }}>
                {t("authSignUp")}
              </Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const inputStyle = {
  marginTop: 14,
  paddingHorizontal: 18,
  paddingVertical: 14,
  borderRadius: 999,
  borderWidth: 1,
};

const passwordWrapStyle = {
  marginTop: 14,
  paddingHorizontal: 18,
  borderRadius: 999,
  borderWidth: 1,
  flexDirection: "row",
  alignItems: "center",
};

const passwordInputStyle = {
  flex: 1,
  paddingVertical: 14,
};

const primaryButton = {
  marginTop: 16,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
};

const dividerLine = {
  flex: 1,
  height: 1,
};
