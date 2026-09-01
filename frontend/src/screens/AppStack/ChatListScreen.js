import React, { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ConversationItem from "../../components/ConversationItem";
import UserAvatar from "../../components/UserAvatar";
import { useChat } from "../../context/ChatContext";
import { colors } from "../../styles/colors";
import { formatDateLabel } from "../../utils/formatters";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";

export default function ChatListScreen({ navigation }) {
  const {
    conversations,
    users,
    refreshChatData,
    searchMessages,
    searchResults,
    isLoading,
    openConversation,
  } = useChat();
  const [query, setQuery] = useState("");

  const usersWithoutConversation = useMemo(() => {
    const usedIds = new Set(
      conversations.map((item) => item.otherUser?.userId),
    );
    return users.filter((item) => !usedIds.has(item.userId));
  }, [users, conversations]);

  const storyUsers = useMemo(() => users.slice(0, 8), [users]);

  const handleOpenConversation = async (item) => {
    await openConversation(item);
    navigation.navigate("ChatScreen", {
      title: item.otherUser?.username || item.username,
      peerUser: item.otherUser || item,
    });
  };

  const handleSearch = async (text) => {
    setQuery(text);
    await searchMessages(text);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PAGE_BG }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 30,
      }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refreshChatData} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: "800", color: TEXT }}>
          ChatApp
        </Text>
        <Pressable
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CARD_BG,
            shadowColor: "#000000",
            shadowOpacity: 0.05,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Ionicons name="search-outline" size={20} color={TEXT} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 8 }}
      >
        <View style={{ alignItems: "center", marginRight: 16 }}>
          <Pressable
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: "#d0d6e2",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: CARD_BG,
            }}
          >
            <Ionicons name="add" size={26} color={SUBTEXT} />
          </Pressable>
          <Text style={{ marginTop: 8, fontSize: 12, color: SUBTEXT }}>
            New
          </Text>
        </View>

        {storyUsers.map((item) => (
          <Pressable
            key={item.userId}
            onPress={() => handleOpenConversation(item)}
            style={{ alignItems: "center", marginRight: 16 }}
          >
            <UserAvatar user={item} size={64} />
            <Text
              numberOfLines={1}
              style={{ marginTop: 8, maxWidth: 68, fontSize: 12, color: TEXT }}
            >
              {item.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "800", color: TEXT }}>
          Chats
        </Text>
        <Ionicons name="ellipsis-horizontal" size={22} color={SUBTEXT} />
      </View>

      <View
        style={{
          marginTop: 16,
          paddingHorizontal: 16,
          borderRadius: 18,
          backgroundColor: CARD_BG,
          borderWidth: 1,
          borderColor: "#eef1f5",
        }}
      >
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search message content"
          placeholderTextColor={SUBTEXT}
          style={{ paddingVertical: 14, color: TEXT }}
        />
      </View>

      {!!query.trim() && (
        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 22,
            backgroundColor: CARD_BG,
          }}
        >
          <Text style={{ fontWeight: "700", color: TEXT }}>Search Results</Text>
          {searchResults.length ? (
            searchResults.map((item) => (
              <View
                key={item.messageId}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#eef1f5",
                }}
              >
                <Text style={{ color: TEXT }}>{item.content}</Text>
                <Text style={{ marginTop: 6, fontSize: 12, color: SUBTEXT }}>
                  {formatDateLabel(item.createdAt)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ marginTop: 8, color: SUBTEXT }}>
              No messages found.
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          marginTop: 18,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 28,
          backgroundColor: CARD_BG,
          shadowColor: "#000000",
          shadowOpacity: 0.04,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 2,
        }}
      >
        {conversations.length ? (
          conversations.map((item) => (
            <ConversationItem
              key={item.conversationId}
              conversation={item}
              onPress={() => handleOpenConversation(item)}
            />
          ))
        ) : (
          <View style={{ paddingVertical: 20 }}>
            <Text style={{ color: SUBTEXT }}>
              No conversations yet. Start one below.
            </Text>
          </View>
        )}
      </View>

      {usersWithoutConversation.length ? (
        <View
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 24,
            backgroundColor: CARD_BG,
          }}
        >
          <Text style={{ fontWeight: "700", color: TEXT }}>Start New Chat</Text>
          {usersWithoutConversation.map((item) => (
            <Pressable
              key={item.userId}
              onPress={() => handleOpenConversation(item)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <UserAvatar user={item} size={48} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: TEXT, fontWeight: "700" }}>
                  {item.username}
                </Text>
                <Text style={{ marginTop: 4, color: SUBTEXT }}>
                  {item.status}
                </Text>
              </View>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor:
                    item.status === "online" ? "#41c95c" : "#d7dbe3",
                }}
              />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View
        style={{
          marginTop: 24,
          alignItems: "center",
        }}
      >
        <Pressable
          style={{
            minWidth: 156,
            height: 48,
            paddingHorizontal: 22,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1f1f23",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700" }}>
            + New Chat
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
