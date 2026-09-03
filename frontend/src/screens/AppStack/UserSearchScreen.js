import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

export default function UserSearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { users, openConversation } = useChat();
  const { colors } = useTheme();
  const { t } = useLocalization();
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

  const handleOpenUser = async (user) => {
    await openConversation(user);
    navigation.navigate("ChatScreen", {
      title: user.username,
      peerUser: user,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View
            style={{
              flex: 1,
              marginLeft: 12,
              height: 46,
              borderRadius: 23,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Ionicons
              name="person-add-outline"
              size={19}
              color={colors.subtext}
            />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder={t("commonSearchUsername")}
              placeholderTextColor={colors.subtext}
              style={{
                flex: 1,
                marginLeft: 10,
                color: colors.text,
                fontSize: 15,
              }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredUsers.length ? (
          filteredUsers.map((user) => (
            <Pressable
              key={user.userId}
              onPress={() => handleOpenUser(user)}
              style={[
                userRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <UserAvatar user={user} size={50} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {user.username}
                </Text>
                <Text style={{ marginTop: 4, color: colors.subtext }}>
                  {user.status === "online"
                    ? t("commonActiveNow")
                    : t("commonOffline")}
                </Text>
              </View>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.subtext}
              />
            </Pressable>
          ))
        ) : (
          <View style={[emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[emptyTitle, { color: colors.text }]}>
              {t("searchNoResults")}
            </Text>
            <Text style={[emptyText, { color: colors.subtext }]}>
              {t("commonTryAnotherKeyword")}
            </Text>
          </View>
        )}
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

const userRow = {
  marginTop: 12,
  padding: 14,
  borderRadius: 22,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
};

const emptyCard = {
  marginTop: 24,
  padding: 22,
  borderRadius: 24,
  alignItems: "center",
};

const emptyTitle = {
  fontSize: 18,
  fontWeight: "800",
};

const emptyText = {
  marginTop: 8,
  textAlign: "center",
};
