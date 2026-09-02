import React, { useState } from "react";
import {
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
import { isEmail, isRequired, isStrongPassword } from "../../utils/validators";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "rgba(255,255,255,0.92)";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";
const BORDER = "#eef1f5";

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
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <Text
            style={{
              color: SUBTEXT,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            CREATE ACCOUNT
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontSize: 34,
              fontWeight: "900",
              color: TEXT,
            }}
          >
            Create account
          </Text>
          <Text style={{ marginTop: 8, color: SUBTEXT }}>
            Start chatting with your people.
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
          <TextInput
            value={form.username}
            onChangeText={(text) => updateField("username", text)}
            placeholder="Username"
            placeholderTextColor={SUBTEXT}
            style={inputStyle}
          />
          <TextInput
            value={form.email}
            onChangeText={(text) => updateField("email", text)}
            placeholder="Email"
            placeholderTextColor={SUBTEXT}
            autoCapitalize="none"
            keyboardType="email-address"
            style={inputStyle}
          />
          <View style={passwordWrapStyle}>
            <TextInput
              value={form.password}
              onChangeText={(text) => updateField("password", text)}
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

          <Pressable onPress={handleRegister} style={primaryButton}>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
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
            onPress={() => navigation.goBack()}
            style={{ marginTop: 18, alignSelf: "center" }}
          >
            <Text style={{ color: SUBTEXT, fontSize: 13 }}>
              Already have an account?{" "}
              <Text style={{ color: BLUE, fontWeight: "800" }}>Login</Text>
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
  marginTop: 18,
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
