import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import UserAvatar from "../../components/UserAvatar";
import { useToast } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "rgba(255,255,255,0.92)";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const DANGER = "#ef4444";

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showSuccess } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const pendingFeature = (label) => {
    showSuccess(`${label} will be available soon.`);
  };

  const settingRows = [
    {
      label: "Profile",
      description: "Edit your account details and photo",
      icon: "person-circle-outline",
      onPress: () => navigation.navigate("ProfileScreen"),
    },
    {
      label: "Chat Settings",
      description: "Themes, message behavior, and media",
      icon: "chatbubble-ellipses-outline",
      onPress: () => pendingFeature("Chat settings"),
    },
    {
      label: "Privacy & Security",
      description: "Blocked users, sessions, and account safety",
      icon: "shield-checkmark-outline",
      onPress: () => pendingFeature("Privacy & security"),
    },
    {
      label: "Notifications",
      description: "Push notifications and mute rules",
      icon: "notifications-outline",
      onPress: () => pendingFeature("Notifications"),
    },
    {
      label: "Language",
      description: "Choose your app language",
      icon: "language-outline",
      onPress: () => pendingFeature("Language"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: 130,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ color: TEXT, fontSize: 28, fontWeight: "900" }}>
          Settings
        </Text>
        <Text style={{ marginTop: 6, color: SUBTEXT }}>
          Manage your profile and app preferences.
        </Text>

        <View style={profileCard}>
          <UserAvatar user={user} size={58} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: "900" }}>
              {user?.username || "User"}
            </Text>
            <Text style={{ marginTop: 4, color: SUBTEXT }}>{user?.email}</Text>
          </View>
        </View>

        <View style={menuCard}>
          {settingRows.map((item, index) => (
            <View key={item.label}>
              <Pressable onPress={item.onPress} style={menuRow}>
                <View style={iconShell}>
                  <Ionicons name={item.icon} size={21} color={TEXT} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{ color: TEXT, fontSize: 15, fontWeight: "900" }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{ marginTop: 3, color: SUBTEXT, fontSize: 12 }}
                  >
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={SUBTEXT} />
              </Pressable>
              {index < settingRows.length - 1 ? <View style={divider} /> : null}
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => setShowLogoutConfirm(true)}
          style={logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={DANGER} />
          <Text style={{ marginLeft: 8, color: DANGER, fontWeight: "900" }}>
            Logout
          </Text>
        </Pressable>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout from this account?"
        confirmLabel="Logout"
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
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.72)",
};

const menuCard = {
  marginTop: 18,
  borderRadius: 26,
  overflow: "hidden",
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.72)",
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
  backgroundColor: "#f1f4f8",
};

const divider = {
  height: 1,
  marginLeft: 68,
  backgroundColor: "rgba(60,60,67,0.13)",
};

const logoutButton = {
  marginTop: 24,
  height: 52,
  borderRadius: 26,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#fff1f2",
};
