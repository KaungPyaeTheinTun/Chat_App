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

export default function UserSearchScreen({ navigation }) {
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
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable onPress={() => navigation.goBack()} style={backButton}>
            <Ionicons name="chevron-back" size={24} color={TEXT} />
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
              backgroundColor: CARD_BG,
              borderWidth: 1,
              borderColor: "#eef1f5",
            }}
          >
            <Ionicons name="person-add-outline" size={19} color={SUBTEXT} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search username"
              placeholderTextColor={SUBTEXT}
              style={{
                flex: 1,
                marginLeft: 10,
                color: TEXT,
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
              style={userRow}
            >
              <UserAvatar user={user} size={50} />
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
          <View style={emptyCard}>
            <Text style={emptyTitle}>No users found</Text>
            <Text style={emptyText}>Try a different username.</Text>
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
  backgroundColor: CARD_BG,
};

const userRow = {
  marginTop: 12,
  padding: 14,
  borderRadius: 22,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "#eef1f5",
};

const emptyCard = {
  marginTop: 24,
  padding: 22,
  borderRadius: 24,
  alignItems: "center",
  backgroundColor: CARD_BG,
};

const emptyTitle = {
  color: TEXT,
  fontSize: 18,
  fontWeight: "800",
};

const emptyText = {
  marginTop: 8,
  color: SUBTEXT,
  textAlign: "center",
};
