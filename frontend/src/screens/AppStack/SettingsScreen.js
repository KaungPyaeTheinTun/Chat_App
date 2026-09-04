import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppSwitch from "../../components/AppSwitch";
import ConfirmationModal from "../../components/ConfirmationModal";
import UserAvatar from "../../components/UserAvatar";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const { showSuccess } = useToast();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language } = useLocalization();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileUser = user
    ? { ...user, status: isConnected ? "online" : user.status }
    : user;

  const pendingFeature = (label) => {
    showSuccess(t("commonSoon", { label }));
  };

  const settingRows = [
    {
      label: t("settingsProfile"),
      description: t("settingsProfileDescription"),
      icon: "person-circle-outline",
      onPress: () => navigation.navigate("ProfileScreen"),
    },
    {
      label: t("settingsDarkMode"),
      description: isDark
        ? t("settingsDarkDescription")
        : t("settingsLightDescription"),
      icon: isDark ? "moon" : "sunny-outline",
      right: <AppSwitch value={isDark} onValueChange={toggleTheme} />,
    },
    {
      label: t("settingsPrivacy"),
      description: t("settingsPrivacyDescription"),
      icon: "shield-checkmark-outline",
      onPress: () => pendingFeature(t("settingsPrivacy")),
    },
    {
      label: t("settingsNotifications"),
      description: t("settingsNotificationsDescription"),
      icon: "notifications-outline",
      onPress: () => navigation.navigate("NotificationSettingsScreen"),
    },
    {
      label: t("settingsLanguage"),
      description:
        language === "mm"
          ? t("settingsLanguageDescriptionMm")
          : t("settingsLanguageDescriptionEn"),
      icon: "language-outline",
      onPress: () => navigation.navigate("LanguageSettingsScreen"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: 130,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
          {t("settingsTitle")}
        </Text>
        <Text style={{ marginTop: 6, color: colors.subtext }}>
          {t("settingsSubtitle")}
        </Text>

        <View
          style={[
            profileCard,
            {
              backgroundColor: colors.cardGlass,
              borderColor: colors.border,
            },
          ]}
        >
          <UserAvatar user={profileUser} size={58} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text
              style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}
            >
              {user?.username || "User"}
            </Text>
            <Text style={{ marginTop: 4, color: colors.subtext }}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View
          style={[
            menuCard,
            {
              backgroundColor: colors.cardGlass,
              borderColor: colors.border,
            },
          ]}
        >
          {settingRows.map((item, index) => (
            <View key={item.label}>
              {item.right ? (
                <View style={menuRow}>
                  <View
                    style={[iconShell, { backgroundColor: colors.iconSurface }]}
                  >
                    <Ionicons name={item.icon} size={21} color={colors.text} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: 3,
                        color: colors.subtext,
                        fontSize: 12,
                      }}
                    >
                      {item.description}
                    </Text>
                  </View>
                  {item.right}
                </View>
              ) : (
                <Pressable onPress={item.onPress} style={menuRow}>
                  <View
                    style={[iconShell, { backgroundColor: colors.iconSurface }]}
                  >
                    <Ionicons name={item.icon} size={21} color={colors.text} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        marginTop: 3,
                        color: colors.subtext,
                        fontSize: 12,
                      }}
                    >
                      {item.description}
                    </Text>
                  </View>
                  {item.right || (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.subtext}
                    />
                  )}
                </Pressable>
              )}
              {index < settingRows.length - 1 ? (
                <View style={[divider, { backgroundColor: colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
          style={[logoutButton, { backgroundColor: colors.dangerSoft }]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text
            style={{ marginLeft: 8, color: colors.danger, fontWeight: "700" }}
          >
            {t("commonLogout")}
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutConfirm}
        title={t("commonLogout")}
        message={t("settingsLogoutMessage")}
        confirmLabel={t("commonLogout")}
        danger
        icon="log-out-outline"
        onConfirm={async () => {
          setShowLogoutConfirm(false);
          await logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </View>
  );
}

const profileCard = {
  marginTop: 20,
  padding: 16,
  borderRadius: 26,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
};

const menuCard = {
  marginTop: 18,
  borderRadius: 26,
  overflow: "hidden",
  borderWidth: 1,
};

const menuRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 15,
};

const iconShell = {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
};

const divider = {
  height: 1,
  marginLeft: 68,
};

const logoutButton = {
  marginTop: 24,
  height: 52,
  borderRadius: 26,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
};
