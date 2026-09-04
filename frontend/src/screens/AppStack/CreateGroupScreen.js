import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useChat } from "../../context/ChatContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

export default function CreateGroupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const { users, createGroupConversation, openConversation } = useChat();
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [groupTitle, setGroupTitle] = useState("");
  const [query, setQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const canCreateGroup = Boolean(
    groupTitle.trim() && selectedMemberIds.length && !isCreating,
  );

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
      showSuccess(t("createGroupCreated"));
      navigation.replace("ChatScreen", {
        title: conversation.title,
        peerUser: conversation.otherUser,
      });
    } catch (error) {
      showError(getErrorMessage(error, t("createGroupUnable")));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[backButton, { backgroundColor: colors.card }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={{ marginLeft: 12 }}>
            <Text
              style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}
            >
              {t("createGroupTitle")}
            </Text>
            <Text style={{ marginTop: 3, color: colors.subtext }}>
              {t("createGroupSubtitle")}
            </Text>
          </View>
        </View>

        <View
          style={[
            card,
            {
              marginTop: 18,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[label, { color: colors.text }]}>
            {t("createGroupName")}
          </Text>
          <TextInput
            value={groupTitle}
            onChangeText={setGroupTitle}
            placeholder={t("createGroupNamePlaceholder")}
            placeholderTextColor={colors.subtext}
            style={[
              input,
              { backgroundColor: colors.input, color: colors.text },
            ]}
          />

          <Text style={[label, { marginTop: 16, color: colors.text }]}>
            {t("commonSearchUsername")}
          </Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("commonSearchPeople")}
            placeholderTextColor={colors.subtext}
            style={[
              input,
              { backgroundColor: colors.input, color: colors.text },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[label, { color: colors.text }]}>
            {t("commonMembers")}
          </Text>
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
                    <Text style={{ color: colors.text, fontWeight: "800" }}>
                      {user.username}
                    </Text>
                    <Text style={{ marginTop: 3, color: colors.subtext }}>
                      {user.status === "online"
                        ? t("commonActiveNow")
                        : t("commonOffline")}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? colors.primary : colors.subtext}
                  />
                </Pressable>
              );
            })
          ) : (
            <Text style={{ marginTop: 12, color: colors.subtext }}>
              {t("commonNoUsersFound")}
            </Text>
          )}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: insets.bottom + 16,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          onPress={handleCreateGroup}
          disabled={!canCreateGroup}
          style={[
            createButton,
            {
              backgroundColor: canCreateGroup
                ? colors.primary
                : colors.primarySoft,
            },
          ]}
        >
          <Text
            style={{
              color: canCreateGroup ? colors.white : colors.primary,
              fontWeight: "800",
            }}
          >
            {isCreating ? t("commonCreating") : t("createGroupTitle")}
          </Text>
        </Pressable>
      </View>
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
  padding: 16,
  borderRadius: 24,
  borderWidth: 1,
};

const label = {
  fontSize: 14,
  fontWeight: "800",
};

const input = {
  marginTop: 10,
  paddingHorizontal: 14,
  paddingVertical: 13,
  borderRadius: 16,
};

const memberRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
};

const createButton = {
  height: 50,
  borderRadius: 25,
  alignItems: "center",
  justifyContent: "center",
};
