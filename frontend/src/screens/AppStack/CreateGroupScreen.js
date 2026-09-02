import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const { users, createGroupConversation, openConversation } = useChat();
  const [groupTitle, setGroupTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      user.username?.toLowerCase().includes(needle),
    );
  }, [query, users]);

  const toggleMember = (userId) => {
    setSelectedMemberIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || !selectedMemberIds.length || isCreating) {
      return;
    }

    setIsCreating(true);
    try {
      const conversation = await createGroupConversation({
        title: groupTitle.trim(),
        memberIds: selectedMemberIds,
      });
      await openConversation(conversation);
      showSuccess("Group created.");
      navigation.replace("ChatScreen", {
        title: conversation.title,
        peerUser: conversation.otherUser,
      });
    } catch (error) {
      showError(getErrorMessage(error, "Unable to create group."));
    } finally {
      setIsCreating(false);
    }
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
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: TEXT, fontSize: 24, fontWeight: "800" }}>
              Create Group
            </Text>
            <Text style={{ marginTop: 3, color: SUBTEXT }}>
              Search usernames and add members
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={card}>
          <Text style={label}>Group name</Text>
          <TextInput
            value={groupTitle}
            onChangeText={setGroupTitle}
            placeholder="Enter group name"
            placeholderTextColor={SUBTEXT}
            style={input}
          />

          <Text style={[label, { marginTop: 16 }]}>Search username</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            placeholderTextColor={SUBTEXT}
            style={input}
          />
        </View>

        <View style={[card, { marginTop: 16 }]}>
          <Text style={label}>Members</Text>
          {filteredUsers.length ? (
            filteredUsers.map((user) => {
              const isSelected = selectedMemberIds.includes(user.userId);
              return (
                <Pressable
                  key={user.userId}
                  onPress={() => toggleMember(user.userId)}
                  style={memberRow}
                >
                  <UserAvatar user={user} size={44} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: TEXT, fontWeight: "800" }}>
                      {user.username}
                    </Text>
                    <Text style={{ marginTop: 3, color: SUBTEXT }}>
                      {user.status || "offline"}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? BLUE : SUBTEXT}
                  />
                </Pressable>
              );
            })
          ) : (
            <Text style={{ marginTop: 12, color: SUBTEXT }}>
              No users found.
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleCreateGroup}
          style={[
            createButton,
            {
              backgroundColor:
                groupTitle.trim() && selectedMemberIds.length
                  ? BLUE
                  : "#c8d7f8",
            },
          ]}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>
            {isCreating ? "Creating..." : "Create Group"}
          </Text>
        </Pressable>
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

const card = {
  padding: 16,
  borderRadius: 24,
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "#eef1f5",
};

const label = {
  color: TEXT,
  fontSize: 14,
  fontWeight: "800",
};

const input = {
  marginTop: 10,
  paddingHorizontal: 14,
  paddingVertical: 13,
  borderRadius: 16,
  backgroundColor: PAGE_BG,
  color: TEXT,
};

const memberRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
};

const createButton = {
  marginTop: 18,
  height: 50,
  borderRadius: 25,
  alignItems: "center",
  justifyContent: "center",
};
