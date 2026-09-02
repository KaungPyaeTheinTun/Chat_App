const BaseService = require("./base/BaseService");
const ValidationException = require("../exceptions/ValidationException");

class ConversationService extends BaseService {
  constructor({
    conversationRepository,
    conversationMemberRepository,
    userRepository,
    cacheService,
    logger,
  }) {
    super({
      repository: conversationRepository,
      cacheService,
      logger,
      notFoundMessage: "Conversation not found.",
    });
    this.conversationRepository = conversationRepository;
    this.conversationMemberRepository = conversationMemberRepository;
    this.userRepository = userRepository;
  }

  serializeMember(row) {
    return {
      userId: row.user_id,
      username: row.username,
      email: row.email,
      avatarUrl: row.avatar_url,
      status: row.status,
      lastSeenAt: row.last_seen_at,
      role: row.role,
      joinedAt: row.joined_at,
    };
  }

  async serializeConversationRow(row) {
    const members = await this.conversationMemberRepository.listActiveMembers(
      row.conversation_id,
    );

    return {
      conversationId: row.conversation_id,
      conversationType: row.conversation_type,
      title: row.title,
      avatarUrl: row.avatar_url,
      createdBy: row.created_by,
      memberRole: row.member_role,
      isArchived: Boolean(row.is_archived),
      isMuted: Boolean(row.is_muted),
      isPinned: Boolean(row.is_pinned),
      lastReadMessageId: row.last_read_message_id,
      lastReadAt: row.last_read_at,
      lastMessageId: row.last_message_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      unreadCount: Number(row.unread_count || 0),
      members: members.map((member) => this.serializeMember(member)),
      lastMessage: row.last_message_id
        ? {
            messageId: row.last_message_id,
            clientMessageId: row.last_message_client_message_id,
            content: row.last_message_content,
            messageType: row.last_message_type,
            senderId: row.last_message_sender_id,
            receiverId: row.last_message_receiver_id,
            deliveryState: row.last_message_delivery_state,
            createdAt: row.last_message_created_at,
          }
        : null,
      otherUser:
        row.conversation_type === "direct"
          ? {
              userId: row.other_user_id,
              username: row.other_username,
              email: row.other_user_email,
              avatarUrl: row.other_user_avatar_url,
              status: row.other_user_status,
              lastSeenAt: row.other_user_last_seen_at,
            }
          : null,
    };
  }

  async getConversationForUserOrFail(userId, conversationId) {
    const membership =
      await this.conversationMemberRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    if (!membership || membership.left_at || membership.is_deleted) {
      throw new ValidationException("Conversation not found.");
    }

    return this.conversationRepository.findById(conversationId);
  }

  async getOwnerGroupForUserOrFail(userId, conversationId) {
    const membership =
      await this.conversationMemberRepository.findByConversationAndUser(
        conversationId,
        userId,
      );
    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (
      !membership ||
      membership.left_at ||
      membership.is_deleted ||
      !conversation ||
      conversation.conversation_type !== "group"
    ) {
      throw new ValidationException("Group conversation not found.");
    }

    if (membership.role !== "owner" && conversation.created_by !== userId) {
      throw new ValidationException(
        "Only the group owner can manage this group.",
      );
    }

    return conversation;
  }

  async invalidateMemberCaches(conversationId) {
    const memberIds =
      await this.conversationMemberRepository.listActiveMemberIds(
        conversationId,
      );

    await Promise.all(
      memberIds.map((memberId) =>
        this.cacheService.del(this.cacheService.userConversationsKey(memberId)),
      ),
    );

    return memberIds;
  }

  async listForUser(userId, options = {}) {
    const key = this.cacheService.userConversationsKey(userId);
    const cached = await this.cacheService.get(key);
    if (cached && !options.includeArchived) {
      return cached;
    }

    const rows = await this.conversationRepository.listForUser(userId, options);
    const conversations = await Promise.all(
      rows.map((row) => this.serializeConversationRow(row)),
    );

    if (!options.includeArchived) {
      await this.cacheService.set(key, conversations);
    }

    return conversations;
  }

  async createDirect(userId, peerUserId) {
    if (!peerUserId || userId === peerUserId) {
      throw new ValidationException("A different user is required.");
    }

    const peer = await this.userRepository.findById(peerUserId);
    if (!peer) {
      throw new ValidationException("User not found.");
    }

    const conversation = await this.conversationRepository.getOrCreate(
      userId,
      peerUserId,
      this.conversationMemberRepository,
    );

    await this.cacheService.del(this.cacheService.userConversationsKey(userId));
    await this.cacheService.del(
      this.cacheService.userConversationsKey(peerUserId),
    );
    return this.getById(conversation.conversation_id);
  }

  async createGroup(userId, { title, memberIds = [] }) {
    if (!title?.trim()) {
      throw new ValidationException("Group name is required.");
    }

    const uniqueMemberIds = Array.from(
      new Set(memberIds.map(Number).filter((id) => id && id !== userId)),
    );

    if (!uniqueMemberIds.length) {
      throw new ValidationException("Choose at least one group member.");
    }

    const conversation = await this.conversationRepository.createGroup(
      {
        title: title.trim(),
        createdBy: userId,
        memberIds: uniqueMemberIds,
      },
      this.conversationMemberRepository,
    );

    for (const memberId of [userId, ...uniqueMemberIds]) {
      await this.cacheService.del(
        this.cacheService.userConversationsKey(memberId),
      );
    }

    return this.getById(conversation.conversation_id);
  }

  async updatePreferences(userId, conversationId, preferences) {
    await this.getConversationForUserOrFail(userId, conversationId);
    await this.conversationMemberRepository.updatePreferences(
      conversationId,
      userId,
      {
        is_archived: preferences.isArchived,
        is_muted: preferences.isMuted,
        is_pinned: preferences.isPinned,
        is_deleted: preferences.isDeleted,
      },
    );
    await this.cacheService.del(this.cacheService.userConversationsKey(userId));
    return { conversationId };
  }

  async leaveConversation(userId, conversationId) {
    const conversation = await this.getConversationForUserOrFail(
      userId,
      conversationId,
    );

    if (conversation.conversation_type === "direct") {
      await this.conversationMemberRepository.updatePreferences(
        conversationId,
        userId,
        { is_deleted: true },
      );
    } else {
      await this.conversationMemberRepository.markLeft(conversationId, userId);
    }

    await this.cacheService.del(this.cacheService.userConversationsKey(userId));
    return { conversationId };
  }

  async updateGroupProfile(userId, conversationId, { title, avatarUrl } = {}) {
    await this.getOwnerGroupForUserOrFail(userId, conversationId);

    const updates = {};
    if (title !== undefined) {
      if (!title?.trim()) {
        throw new ValidationException("Group name is required.");
      }
      updates.title = title.trim();
    }
    if (avatarUrl !== undefined) {
      updates.avatar_url = avatarUrl;
    }

    if (Object.keys(updates).length) {
      await this.conversationRepository.update(conversationId, updates);
    }

    await this.invalidateMemberCaches(conversationId);
    return this.getById(conversationId);
  }

  async addGroupMembers(userId, conversationId, memberIds = []) {
    await this.getOwnerGroupForUserOrFail(userId, conversationId);
    const uniqueMemberIds = Array.from(
      new Set(memberIds.map(Number).filter((id) => id && id !== userId)),
    );

    if (!uniqueMemberIds.length) {
      throw new ValidationException("Choose at least one member to add.");
    }

    for (const memberId of uniqueMemberIds) {
      const user = await this.userRepository.findById(memberId);
      if (!user) {
        throw new ValidationException("User not found.");
      }
    }

    await this.conversationMemberRepository.addMembers(
      conversationId,
      uniqueMemberIds.map((memberId) => ({ userId: memberId, role: "member" })),
    );

    await this.invalidateMemberCaches(conversationId);
    return this.getById(conversationId);
  }

  async removeGroupMember(userId, conversationId, memberId) {
    const conversation = await this.getOwnerGroupForUserOrFail(
      userId,
      conversationId,
    );
    const memberToRemove = Number(memberId);

    if (!memberToRemove || memberToRemove === userId) {
      throw new ValidationException("The group owner cannot be removed.");
    }

    if (memberToRemove === conversation.created_by) {
      throw new ValidationException("The group owner cannot be removed.");
    }

    await this.conversationMemberRepository.markLeft(
      conversationId,
      memberToRemove,
    );
    await this.cacheService.del(
      this.cacheService.userConversationsKey(memberToRemove),
    );
    await this.invalidateMemberCaches(conversationId);
    return this.getById(conversationId);
  }

  async getById(conversationId) {
    const row = await this.getByIdOrFail(conversationId);
    const members =
      await this.conversationMemberRepository.listActiveMembers(conversationId);
    return {
      conversationId: row.conversation_id,
      conversationType: row.conversation_type,
      title: row.title,
      avatarUrl: row.avatar_url,
      createdBy: row.created_by,
      lastMessageId: row.last_message_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      members: members.map((member) => this.serializeMember(member)),
    };
  }
}

module.exports = ConversationService;
