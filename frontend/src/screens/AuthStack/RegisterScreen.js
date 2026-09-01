import React, { useState } from "react";
import {
  Alert,
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
import { colors } from "../../styles/colors";
import { isEmail, isRequired, isStrongPassword } from "../../utils/validators";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { showError, showSuccess } = useToast();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleRegister = async () => {
    if (
      !isRequired(form.username) ||
      !isEmail(form.email) ||
      !isStrongPassword(form.password)
    ) {
      showError("Please complete every required field correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      showSuccess("Account created successfully.");
    } catch (error) {
      showError(getErrorMessage(error, "Unable to register."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSocialPlaceholder = (provider) => {
    Alert.alert(
      `${provider} login`,
      `${provider} social login UI is ready. The OAuth backend can be connected next.`,
    );
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
            CREATE ACCOUNT
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 32,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Sign up
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
          <TextInput
            value={form.username}
            onChangeText={(text) => updateField("username", text)}
            placeholder="Username"
            placeholderTextColor={colors.subtext}
            style={inputStyle}
          />
          <TextInput
            value={form.email}
            onChangeText={(text) => updateField("email", text)}
            placeholder="Email"
            placeholderTextColor={colors.subtext}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />
          <View style={passwordWrapStyle}>
            <TextInput
              value={form.password}
              onChangeText={(text) => updateField("password", text)}
              placeholder="Password"
              placeholderTextColor={colors.subtext}
              secureTextEntry={!showPassword}
              style={passwordInputStyle}
            />
            <Pressable onPress={() => setShowPassword((current) => !current)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.subtext}
              />
            </Pressable>
          </View>

          <Pressable onPress={handleRegister} style={primaryButton}>
            <Text style={{ color: colors.white, fontWeight: "800" }}>
              {isSubmitting ? "Creating..." : "Create account"}
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
                color: colors.subtext,
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
            onPress={() => navigation.goBack()}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: colors.subtext, fontSize: 13 }}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontWeight: "800" }}>
                Login
              </Text>
            </Text>
          </Pressable>
        </View>
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
  borderColor: colors.border,
  backgroundColor: colors.white,
  color: colors.text,
};

const passwordWrapStyle = {
  marginTop: 14,
  paddingHorizontal: 18,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.white,
  color: colors.text,
  flexDirection: "row",
  alignItems: "center",
};

const passwordInputStyle = {
  flex: 1,
  paddingVertical: 14,
  color: colors.text,
};

const primaryButton = {
  marginTop: 18,
  paddingVertical: 15,
  borderRadius: 999,
  alignItems: "center",
  backgroundColor: colors.primary,
};

const dividerLine = {
  flex: 1,
  height: 1,
  backgroundColor: colors.border,
};
