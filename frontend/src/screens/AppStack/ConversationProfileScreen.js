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
import { useLocalization } from "../../context/LocalizationContext";
import { useTheme } from "../../context/ThemeContext";

export default function ConversationProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const { colors } = useTheme();
  const { t } = useLocalization();
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
        username: conversation?.title || t("commonGroupChat"),
        avatarUrl: conversation?.avatarUrl,
      }
    : peerUser;

  const handlePickGroupImage = async () => {
    if (!isOwner || !conversation?.conversationId) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError(t("chatPhotoPermission"));
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
      showSuccess(t("profileGroupImageUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, t("profileUnableGroupImage")));
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
      showSuccess(t("profileGroupNameUpdated"));
    } catch (error) {
      showError(getErrorMessage(error, t("profileUnableGroupName")));
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
      showSuccess(t("profileMembersAdded"));
    } catch (error) {
      showError(getErrorMessage(error, t("profileUnableAddMembers")));
    }
  };

  const handleRemoveMember = async (member) => {
    if (!isOwner || !conversation?.conversationId) {
      return;
    }

    setConfirmation({
      title: t("profileKickMember"),
      message: t("profileKickConfirm", { name: member.username }),
      confirmLabel: t("commonKick"),
      icon: "person-remove-outline",
      onConfirm: async () => {
        setConfirmation(null);
        try {
          await removeGroupMember(conversation.conversationId, member.userId);
          showSuccess(t("profileMemberRemoved"));
        } catch (error) {
          showError(getErrorMessage(error, t("profileUnableRemoveMember")));
        }
      },
    });
  };

  if (!conversation && !peerUser) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}
      >
        <Text style={{ color: colors.text }}>{t("profileNotFound")}</Text>
      </View>
    );
  }

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
          <Text
            style={{
              marginLeft: 12,
              color: colors.text,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            {t("profileTitle")}
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
        <View style={[profileCard, { backgroundColor: colors.card }]}>
          <Pressable onPress={handlePickGroupImage} disabled={!isOwner}>
            <UserAvatar user={profileUser} size={92} />
            {isOwner ? (
              <View
                style={[
                  cameraBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.card,
                  },
                ]}
              >
                <Ionicons name="camera" size={16} color="#ffffff" />
              </View>
            ) : null}
          </Pressable>
          <Text
            style={{
              marginTop: 14,
              color: colors.text,
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            {isGroup
              ? conversation?.title || t("commonGroupChat")
              : peerUser?.username}
          </Text>
          <Text style={{ marginTop: 6, color: colors.subtext }}>
            {isGroup
              ? t("commonMembersCount", {
                  count: conversation?.members?.length || 0,
                })
              : peerUser?.email}
          </Text>
          {!isGroup ? (
            <View
              style={[statusPill, { backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ color: colors.subtext, fontWeight: "800" }}>
                {peerUser?.status === "online"
                  ? t("commonActiveNow")
                  : t("commonOffline")}
              </Text>
            </View>
          ) : null}
        </View>

        {isGroup && isOwner ? (
          <View
            style={[
              card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[sectionTitle, { color: colors.text }]}>
              {t("profileEditGroup")}
            </Text>
            <TextInput
              value={groupTitle}
              onChangeText={setGroupTitle}
              placeholder={t("createGroupName")}
              placeholderTextColor={colors.subtext}
              style={[
                input,
                { backgroundColor: colors.input, color: colors.text },
              ]}
            />
            <Pressable
              onPress={handleSaveGroupName}
              style={[primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                {isSaving ? t("commonSaving") : t("profileSaveGroupName")}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {isGroup ? (
          <View
            style={[
              card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[sectionTitle, { color: colors.text }]}>
              {t("commonMembers")}
            </Text>
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
                      <Text style={{ color: colors.text, fontWeight: "800" }}>
                        {member.username}
                      </Text>
                      <View
                        style={[
                          rolePill,
                          {
                            backgroundColor: memberIsOwner
                              ? colors.accent
                              : colors.surfaceMuted,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: memberIsOwner
                              ? colors.success
                              : colors.subtext,
                            fontSize: 10,
                            fontWeight: "800",
                          }}
                        >
                          {memberIsOwner ? t("commonOwner") : t("commonMember")}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ marginTop: 3, color: colors.subtext }}>
                      {member.status === "online"
                        ? t("commonActiveNow")
                        : t("commonOffline")}
                    </Text>
                  </View>
                  {isOwner && !memberIsOwner ? (
                    <Pressable
                      onPress={() => handleRemoveMember(member)}
                      style={[
                        kickButton,
                        { backgroundColor: colors.dangerSoft },
                      ]}
                    >
                      <Text style={{ color: colors.danger, fontWeight: "800" }}>
                        {t("commonKick")}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {isGroup && isOwner ? (
          <View
            style={[
              card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[sectionTitle, { color: colors.text }]}>
              {t("profileAddMember")}
            </Text>
            <TextInput
              value={memberQuery}
              onChangeText={setMemberQuery}
              placeholder={t("commonSearchUsername")}
              placeholderTextColor={colors.subtext}
              style={[
                input,
                { backgroundColor: colors.input, color: colors.text },
              ]}
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
                      color: colors.text,
                      fontWeight: "800",
                    }}
                  >
                    {item.username}
                  </Text>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? colors.primary : colors.subtext}
                  />
                </Pressable>
              );
            })}
            <Pressable
              onPress={handleAddMembers}
              style={[
                primaryButton,
                {
                  backgroundColor: selectedMemberIds.length
                    ? colors.primary
                    : colors.primarySoft,
                },
              ]}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                {t("profileAddSelectedMembers")}
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
};

const profileCard = {
  padding: 22,
  borderRadius: 28,
  alignItems: "center",
};

const card = {
  marginTop: 16,
  padding: 16,
  borderRadius: 24,
  borderWidth: 1,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: "800",
};

const input = {
  marginTop: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  borderRadius: 16,
};

const primaryButton = {
  marginTop: 14,
  height: 46,
  borderRadius: 23,
  alignItems: "center",
  justifyContent: "center",
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
};

const kickButton = {
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 16,
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
  borderWidth: 3,
};

const statusPill = {
  marginTop: 14,
  paddingHorizontal: 12,
  paddingVertical: 7,
  borderRadius: 16,
};
