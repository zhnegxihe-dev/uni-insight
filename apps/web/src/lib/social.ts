import { prisma } from "./prisma";

/**
 * D 部分：通知中心 + 关注 + 聊天（社交层）
 * - 通知：回复/采纳/star/关注/举报结果 → notifications 表
 * - 关注：Follow 表；互相关注才能自由聊天，未互关每人最多发 1 条
 */

export type NotificationType = "reply" | "accept" | "star" | "favorite" | "follow" | "report_result" | "system";

/** 创建通知（不通知自己） */
export async function notify(userId: string, type: NotificationType, payload: Record<string, unknown>): Promise<void> {
  if (!userId) return;
  await prisma.notification.create({
    data: { userId, type, payload: JSON.stringify(payload) },
  });
}

/** 未读数：通知 + 消息 */
export async function getUnreadCounts(userId: string): Promise<{ notifications: number; messages: number }> {
  const [notifications, messages] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.message.count({
      where: {
        readAt: null,
        conversation: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        NOT: { senderId: userId },
      },
    }),
  ]);
  return { notifications, messages };
}

/** 是否已关注 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  return Boolean(
    await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    })
  );
}

/** 是否互相关注 */
export async function isMutual(a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  const [ab, ba] = await Promise.all([isFollowing(a, b), isFollowing(b, a)]);
  return ab && ba;
}

/** 关注 / 取关（toggle），并通知被关注者 */
export async function toggleFollow(followerId: string, followingId: string): Promise<{ following: boolean }> {
  if (followerId === followingId) {
    throw new Error("不能关注自己");
  }
  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return { following: false };
  }
  await prisma.follow.create({ data: { followerId, followingId } });
  return { following: true };
}

/** 会话 key：两个用户 id 排序拼接，保证一对一唯一 */
export function conversationKey(a: string, b: string): { userAId: string; userBId: string } {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export async function getOrCreateConversation(userAId: string, userBId: string) {
  const { userAId: a, userBId: b } = conversationKey(userAId, userBId);
  const existing = await prisma.conversation.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  if (existing) return existing;
  return prisma.conversation.create({ data: { userAId: a, userBId: b } });
}

export interface SendMessageResult {
  ok: boolean;
  error?: string;
  messageId?: string;
  limited?: boolean;
}

/**
 * 发送消息：
 * - 互相关注 → 可自由聊天；
 * - 未互关 → 该会话中发送者已发过 1 条则拒绝（只能发一条“打招呼”），直到互关解锁。
 */
export async function sendMessage(
  senderId: string,
  toUserId: string,
  content: string
): Promise<SendMessageResult> {
  const text = content.trim();
  if (!text) return { ok: false, error: "消息内容不能为空" };
  if (text.length > 500) return { ok: false, error: "消息最多 500 字" };
  if (senderId === toUserId) return { ok: false, error: "不能给自己发消息" };

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser) return { ok: false, error: "用户不存在" };

  const mutual = await isMutual(senderId, toUserId);
  const conversation = await getOrCreateConversation(senderId, toUserId);

  if (!mutual) {
    const sentCount = await prisma.message.count({
      where: { conversationId: conversation.id, senderId },
    });
    if (sentCount >= 1) {
      return {
        ok: false,
        error: "你们还没有互相关注，只能发送一条打招呼消息。关注对方并与对方互相关注后即可畅聊。",
        limited: true,
      };
    }
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId, content: text },
    select: { id: true },
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });
  await notify(toUserId, "reply", {
    type: "message",
    actorId: senderId,
    content: text.slice(0, 50),
    conversationId: conversation.id,
  });
  return { ok: true, messageId: message.id, limited: !mutual };
}

/** 会话列表（带对方信息、最后一条消息、未读数） */
export async function getConversationList(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      userB: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const unreadRows = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { readAt: null, NOT: { senderId: userId } },
    _count: { id: true },
  });
  const unreadMap = new Map(unreadRows.map((row) => [row.conversationId, row._count.id]));

  return conversations.map((conversation) => {
    const other = conversation.userAId === userId ? conversation.userB : conversation.userA;
    return {
      id: conversation.id,
      other: { id: other.id, nickname: other.nickname, verifiedSchools: other.verifiedSchools, level: other.level },
      lastMessage: conversation.messages[0] ?? null,
      unread: unreadMap.get(conversation.id) ?? 0,
      updatedAt: conversation.updatedAt,
    };
  });
}

/** 会话详情（消息 + 对方信息 + 是否互关） */
export async function getConversationDetail(userId: string, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      userA: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      userB: { select: { id: true, nickname: true, verifiedSchools: true, level: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        select: { id: true, senderId: true, content: true, createdAt: true, readAt: true },
      },
    },
  });
  if (!conversation) return null;
  if (conversation.userAId !== userId && conversation.userBId !== userId) return null;

  const other = conversation.userAId === userId ? conversation.userB : conversation.userA;
  return {
    id: conversation.id,
    other,
    mutual: await isMutual(userId, other.id),
    messages: conversation.messages,
  };
}

/** 标记会话已读（我收到的消息） */
export async function markConversationRead(userId: string, conversationId: string): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!conversation) return;
  if (conversation.userAId !== userId && conversation.userBId !== userId) return;
  await prisma.message.updateMany({
    where: { conversationId, readAt: null, NOT: { senderId: userId } },
    data: { readAt: new Date() },
  });
}
