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
import { isEmail, isStrongPassword } from "../../utils/validators";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "rgba(255,255,255,0.92)";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";
const BORDER = "#eef1f5";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
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
      showError("Enter a valid email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      showSuccess("Welcome back.");
    } catch (error) {
      showError(getErrorMessage(error, "Unable to sign in."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSocialPlaceholder = (provider) => {
    showSuccess(`${provider} social login will be available soon.`);
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
              color: SUBTEXT,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            GET STARTED
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: "900",
              color: TEXT,
            }}
          >
            Welcome back
          </Text>
          <Text style={{ marginTop: 8, color: SUBTEXT }}>
            Sign in and continue your chats.
          </Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslate }],
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
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={SUBTEXT}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />

          <View style={passwordWrapStyle}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={SUBTEXT}
              secureTextEntry={!showPassword}
              style={passwordInputStyle}
            />
            <Pressable onPress={() => setShowPassword((current) => !current)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={SUBTEXT}
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate("PasswordReset")}
            style={{ marginTop: 10, alignSelf: "center" }}
          >
            <Text style={{ color: SUBTEXT, fontSize: 12, fontWeight: "700" }}>
              Forgot Password?
            </Text>
          </Pressable>

          <Pressable onPress={handleLogin} style={primaryButton}>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <View style={dividerLine} />
            <Text
              style={{
                marginHorizontal: 12,
                color: SUBTEXT,
                fontWeight: "700",
              }}
            >
              or
            </Text>
            <View style={dividerLine} />
          </View>

          <SocialAuthButton
            label="Continue with Google"
            icon="google"
            onPress={() => showSocialPlaceholder("Google")}
          />
          <SocialAuthButton
            label="Continue with GitHub"
            icon="github"
            variant="soft"
            onPress={() => showSocialPlaceholder("GitHub")}
          />

          <Pressable
            onPress={() => navigation.navigate("Register")}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: SUBTEXT, fontSize: 13 }}>
              Need an account?{" "}
              <Text style={{ color: BLUE, fontWeight: "800" }}>Sign up</Text>
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
  borderColor: BORDER,
  backgroundColor: "rgba(255,255,255,0.78)",
  color: TEXT,
};

const passwordWrapStyle = {
  marginTop: 14,
  paddingHorizontal: 18,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: BORDER,
  backgroundColor: "rgba(255,255,255,0.78)",
  color: TEXT,
  flexDirection: "row",
  alignItems: "center",
};

const passwordInputStyle = {
  flex: 1,
  paddingVertical: 14,
  color: TEXT,
};

const primaryButton = {
  marginTop: 16,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: BLUE,
};

const dividerLine = {
  flex: 1,
  height: 1,
  backgroundColor: BORDER,
};
