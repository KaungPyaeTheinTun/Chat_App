import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";
import { colors } from "../../styles/colors";
import { formatDateLabel } from "../../utils/formatters";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const {
    conversations,
    users,
    searchResults,
    searchMessages,
    openConversation,
  } = useChat();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const conversationsById = useMemo(
    () =>
      conversations.reduce((accumulator, conversation) => {
        accumulator[conversation.conversationId] = conversation;
        return accumulator;
      }, {}),
    [conversations],
  );

  const usersById = useMemo(
    () =>
      users.reduce((accumulator, user) => {
        accumulator[user.userId] = user;
        return accumulator;
      }, {}),
    [users],
  );

  const handleSearch = async (text) => {
    setQuery(text);
    setIsSearching(Boolean(text.trim()));

    try {
      await searchMessages(text);
    } catch (error) {
      showError(getErrorMessage(error, "Unable to search messages."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenResult = async (message) => {
    const conversation = conversationsById[message.conversationId] || {
      conversationId: message.conversationId,
      otherUser:
        usersById[message.senderId] || usersById[message.receiverId] || null,
    };

    await openConversation(conversation);
    navigation.navigate("ChatScreen", {
      title:
        conversation.title ||
        conversation.otherUser?.username ||
        "Conversation",
      peerUser: conversation.otherUser,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: PAGE_BG,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CARD_BG,
            }}
          >
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
            <Ionicons name="search-outline" size={19} color={SUBTEXT} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={handleSearch}
              placeholder="Search messages"
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
        {!query.trim() ? (
          <View style={emptyCard}>
            <Ionicons name="search-outline" size={28} color={colors.primary} />
            <Text style={emptyTitle}>Search your messages</Text>
            <Text style={emptyText}>
              Type a word or phrase to find conversations.
            </Text>
          </View>
        ) : searchResults.length ? (
          searchResults.map((message) => {
            const conversation = conversationsById[message.conversationId];
            const user =
              conversation?.conversationType === "group"
                ? {
                    username: conversation.title || "Group chat",
                    avatarUrl: conversation.avatarUrl,
                  }
                : conversation?.otherUser ||
                  usersById[message.senderId] ||
                  usersById[message.receiverId];

            return (
              <Pressable
                key={message.messageId}
                onPress={() => handleOpenResult(message)}
                style={resultCard}
              >
                <UserAvatar user={user} size={46} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ flex: 1, color: TEXT, fontWeight: "800" }}
                    >
                      {conversation?.conversationType === "group"
                        ? conversation.title || "Group chat"
                        : user?.username || "Conversation"}
                    </Text>
                    <Text
                      style={{ marginLeft: 12, color: SUBTEXT, fontSize: 12 }}
                    >
                      {formatDateLabel(message.createdAt)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 5,
                      color: SUBTEXT,
                      lineHeight: 20,
                    }}
                  >
                    {message.messageType === "image"
                      ? "Photo"
                      : message.content}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={emptyCard}>
            <Text style={emptyTitle}>
              {isSearching ? "Searching..." : "No results found"}
            </Text>
            <Text style={emptyText}>Try another keyword.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const resultCard = {
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
  marginTop: 10,
  color: TEXT,
  fontSize: 18,
  fontWeight: "800",
};

const emptyText = {
  marginTop: 8,
  color: SUBTEXT,
  textAlign: "center",
  lineHeight: 20,
};
