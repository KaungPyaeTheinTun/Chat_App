import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppSwitch from "../../components/AppSwitch";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

export default function NotificationSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const {
    users,
    notificationSettings,
    setMuteAllNotifications,
    toggleUserNotificationMute,
  } = useChat();
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      user.username?.toLowerCase().includes(needle),
    );
  }, [query, users]);

  const mutedUserIds = notificationSettings.mutedUserIds || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: 34,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[backButton, { backgroundColor: colors.cardGlass }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Text
              style={{ color: colors.text, fontSize: 26, fontWeight: "700" }}
            >
              {t("notificationsTitle")}
            </Text>
            <Text style={{ marginTop: 3, color: colors.subtext }}>
              {t("notificationsSubtitle")}
            </Text>
          </View>
        </View>

        <View
          style={[
            card,
            { backgroundColor: colors.cardGlass, borderColor: colors.border },
          ]}
        >
          <View style={switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[rowTitle, { color: colors.text }]}>
                {t("notificationsMuteAll")}
              </Text>
              <Text style={[rowText, { color: colors.subtext }]}>
                {t("notificationsMuteAllDescription")}
              </Text>
            </View>
            <AppSwitch
              value={notificationSettings.muteAll}
              onValueChange={setMuteAllNotifications}
            />
          </View>
        </View>

        <View
          style={[
            searchBox,
            { backgroundColor: colors.cardGlass, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={19} color={colors.subtext} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("notificationsSearchUser")}
            placeholderTextColor={colors.subtext}
            style={{
              flex: 1,
              marginLeft: 10,
              color: colors.text,
              fontSize: 15,
            }}
          />
        </View>

        <View
          style={[
            card,
            { backgroundColor: colors.cardGlass, borderColor: colors.border },
          ]}
        >
          <Text style={[sectionTitle, { color: colors.text }]}>
            {t("notificationsPeople")}
          </Text>
          {filteredUsers.length ? (
            filteredUsers.map((user) => {
              const isMuted =
                notificationSettings.muteAll ||
                mutedUserIds.includes(Number(user.userId));

              return (
                <View
                  key={user.userId}
                  style={[
                    userRow,
                    notificationSettings.muteAll ? { opacity: 0.5 } : null,
                  ]}
                >
                  <UserAvatar user={user} size={44} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[rowTitle, { color: colors.text }]}>
                      {user.username}
                    </Text>
                    <Text style={[rowText, { color: colors.subtext }]}>
                      {notificationSettings.muteAll
                        ? t("notificationsMutedByAll")
                        : isMuted
                          ? t("notificationsUserMuted")
                          : t("notificationsUserEnabled")}
                    </Text>
                  </View>
                  <AppSwitch
                    disabled={notificationSettings.muteAll}
                    value={isMuted}
                    onValueChange={() =>
                      toggleUserNotificationMute(user.userId)
                    }
                  />
                </View>
              );
            })
          ) : (
            <Text style={{ marginTop: 12, color: colors.subtext }}>
              {t("commonNoUsersFound")}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const backButton = {
  width: 42,
  height: 42,
  borderRadius: 21,
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  marginTop: 18,
  padding: 16,
  borderRadius: 24,
  borderWidth: 1,
};

const searchBox = {
  marginTop: 18,
  height: 50,
  borderRadius: 25,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  borderWidth: 1,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: "900",
};

const switchRow = {
  flexDirection: "row",
  alignItems: "center",
};

const userRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingTop: 14,
};

const rowTitle = {
  fontSize: 15,
  fontWeight: "900",
};

const rowText = {
  marginTop: 3,
  fontSize: 12,
};
