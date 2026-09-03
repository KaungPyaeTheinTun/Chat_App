import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";
import { formatDateLabel } from "../../utils/formatters";

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
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
      showError(getErrorMessage(error, t("searchUnable")));
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
        t("commonConversation"),
      peerUser: conversation.otherUser,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: colors.background,
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
              backgroundColor: colors.card,
            }}
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
            <Ionicons name="search-outline" size={19} color={colors.subtext} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={handleSearch}
              placeholder={t("searchMessages")}
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
        {!query.trim() ? (
          <View style={[emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="search-outline" size={28} color={colors.primary} />
            <Text style={[emptyTitle, { color: colors.text }]}>
              {t("searchYourMessages")}
            </Text>
            <Text style={[emptyText, { color: colors.subtext }]}>
              {t("searchHint")}
            </Text>
          </View>
        ) : searchResults.length ? (
          searchResults.map((message) => {
            const conversation = conversationsById[message.conversationId];
            const user =
              conversation?.conversationType === "group"
                ? {
                    username: conversation.title || t("commonGroupChat"),
                    avatarUrl: conversation.avatarUrl,
                  }
                : conversation?.otherUser ||
                  usersById[message.senderId] ||
                  usersById[message.receiverId];

            return (
              <Pressable
                key={message.messageId}
                onPress={() => handleOpenResult(message)}
                style={[
                  resultCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
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
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontWeight: "800",
                      }}
                    >
                      {conversation?.conversationType === "group"
                        ? conversation.title || t("commonGroupChat")
                        : user?.username || t("commonConversation")}
                    </Text>
                    <Text
                      style={{
                        marginLeft: 12,
                        color: colors.subtext,
                        fontSize: 12,
                      }}
                    >
                      {formatDateLabel(message.createdAt)}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 5,
                      color: colors.subtext,
                      lineHeight: 20,
                    }}
                  >
                    {message.messageType === "image"
                      ? t("commonPhoto")
                      : message.content}
                  </Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={[emptyCard, { backgroundColor: colors.card }]}>
            <Text style={[emptyTitle, { color: colors.text }]}>
              {isSearching ? t("searchSearching") : t("searchNoResults")}
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

const resultCard = {
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
  marginTop: 10,
  fontSize: 18,
  fontWeight: "800",
};

const emptyText = {
  marginTop: 8,
  textAlign: "center",
  lineHeight: 20,
};
