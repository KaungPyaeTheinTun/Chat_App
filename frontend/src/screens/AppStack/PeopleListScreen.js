import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";

export default function PeopleListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { users, openConversation } = useChat();
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
    <ScrollView
      style={{ flex: 1, backgroundColor: PAGE_BG }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 18,
        paddingBottom: 30,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ color: TEXT, fontSize: 28, fontWeight: "800" }}>
        People
      </Text>
      <Text style={{ marginTop: 6, color: SUBTEXT }}>
        Search users and start a conversation.
      </Text>

      <View style={searchBox}>
        <Ionicons name="search-outline" size={19} color={SUBTEXT} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          placeholderTextColor={SUBTEXT}
          style={{
            flex: 1,
            marginLeft: 10,
            color: TEXT,
            fontSize: 15,
          }}
        />
      </View>

      <View style={listCard}>
        {filteredUsers.length ? (
          filteredUsers.map((user) => (
            <Pressable
              key={user.userId}
              onPress={() => handleOpenUser(user)}
              style={userRow}
            >
              <UserAvatar user={user} size={52} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800" }}>
                  {user.username}
                </Text>
                <Text style={{ marginTop: 4, color: SUBTEXT }}>
                  {user.status || "offline"}
                </Text>
              </View>
              <Ionicons name="chatbubble-outline" size={20} color={SUBTEXT} />
            </Pressable>
          ))
        ) : (
          <View style={{ paddingVertical: 18 }}>
            <Text style={{ color: SUBTEXT }}>No people found.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const searchBox = {
  marginTop: 18,
  height: 52,
  borderRadius: 26,
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "#eef1f5",
};

const listCard = {
  marginTop: 18,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 28,
  backgroundColor: CARD_BG,
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
