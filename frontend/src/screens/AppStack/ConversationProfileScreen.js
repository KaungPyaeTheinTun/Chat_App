import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ConfirmationModal from "../../components/ConfirmationModal";
import UserAvatar from "../../components/UserAvatar";
import { useToast, getErrorMessage } from "../../components/ToastProvider";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const PAGE_BG = "#f6f7fb";
const CARD_BG = "#ffffff";
const TEXT = "#17191f";
const SUBTEXT = "#8b93a5";
const BLUE = "#3b82f6";
const DANGER = "#ef4444";

export default function ConversationProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const {
    activeConversation,
    conversations,
    users,
    updateGroupProfile,
    uploadGroupAvatar,
    addGroupMembers,
    removeGroupMember,
  } = useChat();
  const conversation =
    activeConversation?.conversationId === route.params?.conversationId
      ? activeConversation
      : conversations.find(
          (item) => item.conversationId === route.params?.conversationId,
        );
  const peerUser = conversation?.otherUser || route.params?.peerUser;
  const isGroup = conversation?.conversationType === "group";
  const isOwner =
    isGroup &&
    (conversation?.memberRole === "owner" ||
      conversation?.createdBy === user?.userId);
  const [groupTitle, setGroupTitle] = useState(conversation?.title || "");
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setGroupTitle(conversation?.title || "");
  }, [conversation?.title]);

  const memberIds = useMemo(
    () => new Set((conversation?.members || []).map((member) => member.userId)),
    [conversation?.members],
  );

  const availableUsers = useMemo(() => {
    const needle = memberQuery.trim().toLowerCase();
    return users.filter((item) => {
      if (memberIds.has(item.userId)) {
        return false;
      }
      return !needle || item.username?.toLowerCase().includes(needle);
    });
  }, [memberIds, memberQuery, users]);

  const profileUser = isGroup
    ? {
        username: conversation?.title || "Group chat",
        avatarUrl: conversation?.avatarUrl,
      }
    : peerUser;

  const handlePickGroupImage = async () => {
    if (!isOwner || !conversation?.conversationId) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    try {
      await uploadGroupAvatar(conversation.conversationId, result.assets[0]);
      showSuccess("Group image updated.");
    } catch (error) {
      showError(getErrorMessage(error, "Unable to update group image."));
    }
  };

  const handleSaveGroupName = async () => {
    if (!isOwner || !conversation?.conversationId || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await updateGroupProfile(conversation.conversationId, {
        title: groupTitle.trim(),
      });
      showSuccess("Group name updated.");
    } catch (error) {
      showError(getErrorMessage(error, "Unable to update group name."));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectedMember = (memberId) => {
    setSelectedMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const handleAddMembers = async () => {
    if (
      !isOwner ||
      !selectedMemberIds.length ||
      !conversation?.conversationId
    ) {
      return;
    }

    try {
      await addGroupMembers(conversation.conversationId, selectedMemberIds);
      setSelectedMemberIds([]);
      setMemberQuery("");
      showSuccess("Members added.");
    } catch (error) {
      showError(getErrorMessage(error, "Unable to add members."));
    }
  };

  const handleRemoveMember = async (member) => {
    if (!isOwner || !conversation?.conversationId) {
      return;
    }

    setConfirmation({
      title: "Kick member",
      message: `Remove ${member.username} from this group?`,
      confirmLabel: "Kick",
      icon: "person-remove-outline",
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await removeGroupMember(conversation.conversationId, member.userId);
          showSuccess("Member removed.");
        } catch (error) {
          showError(getErrorMessage(error, "Unable to remove member."));
        }
      },
    });
  };

  if (!conversation && !peerUser) {
    return (
      <View style={{ flex: 1, backgroundColor: PAGE_BG, padding: 20 }}>
        <Text style={{ color: TEXT }}>Profile not found.</Text>
      </View>
    );
  }

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
          <Text
            style={{
              marginLeft: 12,
              color: TEXT,
              fontSize: 24,
              fontWeight: "800",
            }}
          >
            Profile
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 34,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={profileCard}>
          <Pressable onPress={handlePickGroupImage} disabled={!isOwner}>
            <UserAvatar user={profileUser} size={92} />
            {isOwner ? (
              <View style={cameraBadge}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </View>
            ) : null}
          </Pressable>
          <Text
            style={{
              marginTop: 14,
              color: TEXT,
              fontSize: 22,
              fontWeight: "800",
            }}
          >
            {isGroup ? conversation?.title || "Group chat" : peerUser?.username}
          </Text>
          <Text style={{ marginTop: 6, color: SUBTEXT }}>
            {isGroup
              ? `${conversation?.members?.length || 0} members`
              : peerUser?.email}
          </Text>
          {!isGroup ? (
            <View style={statusPill}>
              <Text style={{ color: SUBTEXT, fontWeight: "800" }}>
                {peerUser?.status === "online" ? "Active now" : "Offline"}
              </Text>
            </View>
          ) : null}
        </View>

        {isGroup && isOwner ? (
          <View style={card}>
            <Text style={sectionTitle}>Edit Group</Text>
            <TextInput
              value={groupTitle}
              onChangeText={setGroupTitle}
              placeholder="Group name"
              placeholderTextColor={SUBTEXT}
              style={input}
            />
            <Pressable onPress={handleSaveGroupName} style={primaryButton}>
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                {isSaving ? "Saving..." : "Save Group Name"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isGroup ? (
          <View style={card}>
            <Text style={sectionTitle}>Members</Text>
            {(conversation?.members || []).map((member) => {
              const memberIsOwner =
                member.role === "owner" ||
                member.userId === conversation.createdBy;
              return (
                <View key={member.userId} style={memberRow}>
                  <UserAvatar user={member} size={44} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={{ color: TEXT, fontWeight: "800" }}>
                        {member.username}
                      </Text>
                      <View
                        style={[
                          rolePill,
                          memberIsOwner ? { backgroundColor: "#e9f9ee" } : null,
                        ]}
                      >
                        <Text
                          style={{
                            color: memberIsOwner ? "#20a246" : SUBTEXT,
                            fontSize: 10,
                            fontWeight: "800",
                          }}
                        >
                          {memberIsOwner ? "Owner" : "Member"}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ marginTop: 3, color: SUBTEXT }}>
                      {member.status || "offline"}
                    </Text>
                  </View>
                  {isOwner && !memberIsOwner ? (
                    <Pressable
                      onPress={() => handleRemoveMember(member)}
                      style={kickButton}
                    >
                      <Text style={{ color: DANGER, fontWeight: "800" }}>
                        Kick
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {isGroup && isOwner ? (
          <View style={card}>
            <Text style={sectionTitle}>Add Member</Text>
            <TextInput
              value={memberQuery}
              onChangeText={setMemberQuery}
              placeholder="Search username"
              placeholderTextColor={SUBTEXT}
              style={input}
            />
            {availableUsers.map((item) => {
              const isSelected = selectedMemberIds.includes(item.userId);
              return (
                <Pressable
                  key={item.userId}
                  onPress={() => toggleSelectedMember(item.userId)}
                  style={memberRow}
                >
                  <UserAvatar user={item} size={42} />
                  <Text
                    style={{
                      marginLeft: 12,
                      flex: 1,
                      color: TEXT,
                      fontWeight: "800",
                    }}
                  >
                    {item.username}
                  </Text>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? BLUE : SUBTEXT}
                  />
                </Pressable>
              );
            })}
            <Pressable
              onPress={handleAddMembers}
              style={[
                primaryButton,
                {
                  backgroundColor: selectedMemberIds.length ? BLUE : "#c8d7f8",
                },
              ]}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                Add Selected Members
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationModal
        visible={Boolean(confirmation)}
        title={confirmation?.title}
        message={confirmation?.message}
        confirmLabel={confirmation?.confirmLabel}
        danger
        icon={confirmation?.icon}
        onConfirm={confirmation?.onConfirm}
        onCancel={() => setConfirmation(null)}
      />
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

const profileCard = {
  padding: 22,
  borderRadius: 28,
  alignItems: "center",
  backgroundColor: CARD_BG,
};

const card = {
  marginTop: 16,
  padding: 16,
  borderRadius: 24,
  backgroundColor: CARD_BG,
  borderWidth: 1,
  borderColor: "#eef1f5",
};

const sectionTitle = {
  color: TEXT,
  fontSize: 16,
  fontWeight: "800",
};

const input = {
  marginTop: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  borderRadius: 16,
  backgroundColor: PAGE_BG,
  color: TEXT,
};

const primaryButton = {
  marginTop: 14,
  height: 46,
  borderRadius: 23,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: BLUE,
};

const memberRow = {
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 12,
};

const rolePill = {
  marginLeft: 8,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 999,
  backgroundColor: "#f2f4f8",
};

const kickButton = {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 16,
  backgroundColor: "#fff1f2",
};

const cameraBadge = {
  position: "absolute",
  right: 0,
  bottom: 2,
  width: 30,
  height: 30,
  borderRadius: 15,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: BLUE,
  borderWidth: 3,
  borderColor: CARD_BG,
};

const statusPill = {
  marginTop: 14,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 16,
  backgroundColor: "#f2f4f8",
};
