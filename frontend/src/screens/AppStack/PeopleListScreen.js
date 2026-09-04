import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

export default function PeopleListScreen({ navigation }) {
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
          paddingHorizontal: 20,
          paddingTop: insets.top + 18,
          paddingBottom: 14,
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
          {t("peopleTitle")}
        </Text>
        <Text style={{ marginTop: 6, color: colors.subtext }}>
          {t("peopleSubtitle")}
        </Text>

        <View
          style={[
            searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={19} color={colors.subtext} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("commonSearchPeople")}
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[listCard, { backgroundColor: colors.card }]}>
          {filteredUsers.length ? (
            filteredUsers.map((user) => (
              <Pressable
                key={user.userId}
                onPress={() => handleOpenUser(user)}
                style={userRow}
              >
                <UserAvatar user={user} size={52} />
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
            <View style={{ paddingVertical: 18 }}>
              <Text style={{ color: colors.subtext }}>
                {t("commonNoPeopleFound")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const searchBox = {
  marginTop: 18,
  height: 52,
  borderRadius: 26,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  borderWidth: 1,
};

const listCard = {
  marginTop: 18,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 28,
  shadowColor: "#000000",
  shadowOpacity: 0.04,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

const userRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
};
