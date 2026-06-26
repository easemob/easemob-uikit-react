import { useCallback, useEffect, MutableRefObject, useContext } from 'react';
import type { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import { useClient } from './useClient';
import { getStore } from '../store';
import {
  getCurrentUserId,
  getCvsIdFromMessage,
  getGroupItemFromGroupsById,
  getMessageId,
} from '../utils';
import { useGroupMembersAttributes } from '../hooks/useAddress';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import ts from 'typescript';
import { ProviderProps } from '../store/Provider';
import { runInAction } from 'mobx';

type ConversationLocator = {
  conversationType?: ChatSDK.ChatConversationType;
  conversationId?: string;
  chatType?: ChatSDK.ChatConversationType;
};

type PinnedMessageChangedPayload = ConversationLocator & {
  messageId: string;
  operation: 'pin' | 'unpin';
  pinTime?: number;
  operatorId?: string;
  timestamp?: number;
};

const useEventHandler = (props: ProviderProps, client: any) => {
  const { initConfig, features } = props;
  const rootStore = getStore();
  const { messageStore, threadStore, conversationStore, addressStore } = rootStore;
  const currentUserId = getCurrentUserId(client);

  useEffect(() => {
    client?.addEventHandler?.('UIKitMessage', {
      onMessage: (message: ChatSDK.Message) => {
        if (message.type !== 'cmd') {
          messageStore.receiveMessage(message);
          return;
        }
        const conversationId = getCvsIdFromMessage(message as BaseMessageType);

        const cvs = {
          chatType: message.conversationType,
          conversationId: conversationId,
        };
        const action = (message.body as Record<string, any>)?.action;
        switch (action) {
          case 'TypingBegin':
            messageStore.setTyping(cvs, true);
            break;
          case 'TypingEnd':
            messageStore.setTyping(cvs, false);
            break;
          default:
            messageStore.receiveMessage(message);
            break;
        }
      },

      '__internal:onMessageSent': (message: ChatSDK.Message) => {
        messageStore.updateMessageStatus(getMessageId(message), 'sent');
      },
      onMessageDelivered: (message: { messageId: string }) => {
        messageStore.updateMessageStatus(message.messageId, 'received');
      },
      onMessageRead: (messages: readonly { messageId: string }[]) => {
        messages.forEach(msg => messageStore.updateMessageStatus(msg.messageId, 'read'));
      },
      onConversationRead: (message: ConversationLocator) => {
        const chatType = message.conversationType || message.chatType;
        const conversationId = message.conversationId || '';
        if (chatType === 'singleChat') {
          setTimeout(() => {
            rootStore.messageStore.message?.[chatType]?.[conversationId]
              ?.filter((message: BaseMessageType) => {
                return (
                  message.status === 'received' &&
                  message.type != 'voice' &&
                  message.type != 'audio' &&
                  message.type != 'video' &&
                  message.type != 'file' &&
                  message.type != 'combine'
                );
              })
              .forEach((receivedMessage: BaseMessageType) => {
                messageStore.updateMessageStatus(getMessageId(receivedMessage), 'read');
              });
          }, 10);
        }
      },
      onMessageRecalled: (message: ConversationLocator & { messageId: string }) => {
        const chatType = message.conversationType || message.chatType || 'singleChat';
        const conversationId = message.conversationId || '';
        messageStore.recallMessage(
          {
            chatType,
            conversationId,
          },
          message.messageId,
        );
      },

      onConnected: () => {
        console.log('onConnected');
        rootStore.setLoginState(true);
        // 延迟读取 sync 数据，确保 enableSyncData 同步完成后 store 有数据
        setTimeout(() => {
          if (addressStore.contacts?.length === 0) {
            const res = client.contactManager.getContacts();
            if (res?.length > 0) {
              addressStore.setContacts(
                res.map((item: any) => ({
                  userId: item.userId,
                  nickname: item.remark || '',
                  remark: item.remark,
                })),
              );
            }
          }
          if (addressStore.groups?.length === 0) {
            const groups = client.groupManager.getJoinedGroupList();
            if (groups?.length > 0) {
              addressStore.setGroups(groups.map((g: any) => ({ ...g, groupName: g.name })));
            }
          }
        }, 2000);
      },
      onDisconnected: () => {
        rootStore.setLoginState(false);
      },

      onSyncDataFinished: (payload: any) => {
        console.log('onSyncDataFinished', payload);
        const { dataType, status } = payload;
        if (status !== 'success') return;
        if (dataType === 'contact') {
          const res = client.contactManager.getContacts();
          const contacts = (res as any[])?.map((item: any) => ({
            userId: item.userId,
            nickname: item.remark || '',
            remark: item.remark,
          }));
          addressStore.setContacts(contacts || []);
        } else if (dataType === 'group') {
          const res = client.groupManager.getJoinedGroupList();
          addressStore.setGroups(
            (res as any[]).map((group: any) => ({ ...group, groupName: group.name })),
          );
        } else if (dataType === 'conversation') {
          const res = client.chatManager.getConversationList();
          const conversations = res
            ?.filter((cvs: any) => !cvs.lastMessage?.chatThread)
            ?.map((cvs: any) => ({
              chatType: cvs.conversationType,
              conversationId: cvs.conversationId,
              lastMessage: cvs.lastMessage || {},
              unreadCount: cvs.unreadCount || 0,
              isPinned: cvs.isPinned,
              name: cvs.conversationName,
              avatarUrl: cvs.conversationAvatar,
            }));
          conversationStore.setConversation(conversations);
        }
      },

      onReactionChanged: (data: any) => {
        const conversationId = getCvsIdFromMessage(data as unknown as BaseMessageType);

        const cvs = {
          chatType: data.conversationType || data.chatType,
          conversationId: conversationId,
        };
        rootStore.messageStore.updateReactions(cvs, data.messageId, data.reactions);
      },
      onMessageUpdated: (message: { messageId: string; message: Partial<ChatSDK.Message> }) => {
        getStore().messageStore.modifyLocalMessage(
          message.messageId,
          { ...message.message, msgServerId: message.messageId } as ChatSDK.Message,
          true,
        );
      },
      onPinnedMessageChanged: (message: PinnedMessageChangedPayload) => {
        const { messageId, operation, operatorId } = message;
        const conversationType = message.conversationType || message.chatType || 'singleChat';
        const conversationId = message.conversationId || '';
        const time = message.pinTime || message.timestamp || Date.now();
        switch (operation) {
          case 'pin':
            getStore().pinnedMessagesStore.updatePinnedMessage(
              conversationType,
              conversationId,
              messageId,
              time,
              operatorId || '',
            );
            getStore().pinnedMessagesStore.pushPinNoticeMessage({
              conversationId,
              conversationType,
              operatorId: operatorId || '',
              noticeType: 'pin',
              time,
            });
            // Only one message is allowed to be pinned in the chat room
            if (conversationType === 'chatRoom') {
              const pinedMsg = getStore().messageStore.message[conversationType][
                conversationId
                //@ts-ignore
              ].find(item => getMessageId(item) === messageId);
              if (pinedMsg) {
                getStore().pinnedMessagesStore.clearPinnedMessages(
                  conversationType,
                  conversationId,
                );
                getStore().pinnedMessagesStore.pushPinnedMessage(conversationType, conversationId, {
                  operatorId: operatorId || '',
                  pinnedAt: time,
                  messageId,
                  conversationId,
                  conversationType,
                  message: pinedMsg as ChatSDK.Message,
                });
              }
            }
            break;
          case 'unpin':
            getStore().pinnedMessagesStore.deletePinnedMessage(
              conversationType,
              conversationId,
              messageId,
            );
            getStore().pinnedMessagesStore.pushPinNoticeMessage({
              conversationId,
              conversationType,
              operatorId: operatorId || '',
              noticeType: 'unpin',
              time,
            });
            break;
          default:
            break;
        }
      },
      onGroupMemberAttributeChanged: (message: any) => {
        addressStore.setGroupMemberAttributes(
          message.groupId,
          message.user?.userId || message.userId || message.from,
          message.attribute || {},
        );
      },
      onAdminAdded: (message: any) => {
        const groupItem = getGroupItemFromGroupsById(message.groupId);
        const adminId = message.administrator?.userId;
        if (groupItem && adminId) {
          addressStore.setGroupAdmins(message.groupId, [...(groupItem.admins || []), adminId]);
        }
      },
      onAdminRemoved: (message: any) => {
        const groupItem = getGroupItemFromGroupsById(message.groupId);
        const adminId = message.administrator?.userId;
        if (groupItem && adminId) {
          addressStore.setGroupAdmins(
            message.groupId,
            (groupItem.admins || []).filter(item => item !== adminId),
          );
        }
      },
      onMembersJoined: (message: any) => {
        const members = (message.members || []).map((member: any) => ({
          member: member.userId,
        }));
        addressStore.setGroupMembers(message.groupId, members);
        useGroupMembersAttributes(
          message.groupId,
          members.map((member: any) => member.member),
        );
      },
      onMembersExited: (message: any) => {
        (message.members || []).forEach((member: any) => {
          if (member.userId) {
            addressStore.removeGroupMember(message.groupId, member.userId);
            const groupItem = getGroupItemFromGroupsById(message.groupId);
            if (groupItem?.admins?.includes(member.userId)) {
              addressStore.setGroupAdmins(
                message.groupId,
                groupItem.admins.filter(item => item !== member.userId),
              );
            }
          }
        });
      },
      onOwnerChanged: (message: any) => {
        if (message.newOwner?.userId) {
          addressStore.setGroupOwner(message.groupId, message.newOwner.userId);
        }
      },
      onUserRemoved: (message: any) => {
        addressStore.removeGroupFromContactList(message.groupId);
      },
      onGroupDestroyed: (message: any) => {
        addressStore.removeGroupFromContactList(message.groupId);
      },
      onPresenceStatusChange: (message: any) => {
        if (features?.conversationList?.item?.presence == false) return;
        const { addressStore } = rootStore;
        message.length > 0 &&
          message.forEach((presenceInfo: any) => {
            const appUserInfo = addressStore.appUsersInfo;
            if (appUserInfo[presenceInfo.userId]) {
              const detailList = presenceInfo.statusDetails;
              let isOnline = false;
              detailList.forEach((item: any) => {
                if (item.status === 1) {
                  isOnline = true;
                }
              });

              runInAction(() => {
                appUserInfo[presenceInfo.userId].isOnline = isOnline;
                appUserInfo[presenceInfo.userId].presenceExt = presenceInfo.ext;
                addressStore.setAppUserInfo({ ...appUserInfo });
              });
            }
          });
        const changeList = message.map((item: any) => {
          const status: Record<string, string> = {};
          item.statusDetails.forEach((s: any) => {
            status[s.device] = String(s.status);
          });
          return {
            ...item,
            uid: item.userId,
            status: status,
            expiry: item.expire,
            last_time: item.lastTime,
            presenceExt: item.ext,
          };
        });
        conversationStore.setOnlineStatus(changeList as any);
      },
      // @ts-ignore
      onCombineMessage: (message: BaseMessageType) => {
        messageStore.receiveMessage(message);
      },

      onChatThreadCreated: (message: any) => {
        threadStore.updateThreadInfo({
          ...message,
          operation: 'create',
          id: message.chatThreadId,
          name: message.chatThreadName,
          operator: message.operatorId,
        });
      },
      onChatThreadUpdated: (message: any) => {
        threadStore.updateThreadInfo({
          ...message,
          operation: 'update',
          id: message.chatThreadId,
          name: message.chatThreadName,
          operator: message.operatorId,
        });
      },
      onChatThreadDestroyed: (message: any) => {
        threadStore.updateThreadInfo({
          ...message,
          operation: 'destroy',
          id: message.chatThreadId,
          operator: message.operatorId,
        });
      },
      onChatThreadUserRemoved: (message: any) => {
        if (
          message.memberId === currentUserId &&
          threadStore.currentThread?.info?.id === message.chatThreadId
        ) {
          threadStore.setThreadVisible(false);
        }
        threadStore.updateThreadInfo({
          ...message,
          operation: 'userRemove',
          id: message.chatThreadId,
          operator: message.operatorId,
          userName: message.memberId,
        });
      },

      onContactInvited: (message: any) => {
        addressStore.addContactRequest({
          ...message,
          type: 'subscribe',
          requestStatus: 'pending',
        });
        if (rootStore.shouldAutoFetchUserInfo()) {
          addressStore.getUserInfo(message.from);
        }
      },
      onContactDeleted: (message: any) => {
        console.log('onContactDeleted', message);
        const { addressStore } = rootStore;
        addressStore.deleteContactFromContactList(message.from);
      },
      onContactAdded: (message: any) => {
        console.log('onContactAdded', message);

        const { addressStore } = rootStore;
        const presence = features?.conversationList?.item?.presence ?? false;
        addressStore.addContactToContactList(message.from, presence);
      },
      onContactAgreed: (message: any) => {
        const { addressStore } = rootStore;
        const presence = features?.conversationList?.item?.presence ?? false;
        addressStore.addContactToContactList(message.from, presence);
      },
      onMultiDeviceConversation: (message: any) => {
        console.log('onMultiDeviceEvent', message);
        if (message.operation === 'setSilentModeForConversation') {
          rootStore.conversationStore.setSilentModeForConversationSync(
            {
              chatType: (message as any).type,
              conversationId: (message as any).conversationId,
            },
            true,
          );
          rootStore.addressStore.setSilentModeForConversationSync(
            {
              chatType: (message as any).type,
              conversationId: (message as any).conversationId,
            },
            true,
          );
        } else if (message.operation === 'removeSilentModeForConversation') {
          rootStore.conversationStore.setSilentModeForConversationSync(
            {
              chatType: (message as any).type,
              conversationId: (message as any).conversationId,
            },
            false,
          );
          rootStore.addressStore.setSilentModeForConversationSync(
            {
              chatType: (message as any).type,
              conversationId: (message as any).conversationId,
            },
            false,
          );
        }
      },
      // Chatroom events (via ChatRoomManager dispatch)
      '__chatroom:onRemovedFromChatRoom': (message: any) => {
        const chatRoomId = message?.chatRoomId;
        if (chatRoomId) {
          // Clear chatroom messages when user is removed
          messageStore.message.chatRoom[chatRoomId] = [];
        }
      },
      '__chatroom:onChatRoomDestroyed': (message: any) => {
        const chatRoomId = message?.chatRoomId;
        if (chatRoomId) {
          messageStore.message.chatRoom[chatRoomId] = [];
        }
      },
      '__chatroom:onMuteListAdded': (message: any) => {
        const chatRoomId = message?.chatRoomId;
        const userIds = message?.userIds || [];
        if (chatRoomId && userIds.includes(currentUserId)) {
          addressStore.chatroom.forEach(item => {
            if (item.id === chatRoomId) {
              (item as any).muted = true;
            }
          });
        }
      },
      '__chatroom:onMuteListRemoved': (message: any) => {
        const chatRoomId = message?.chatRoomId;
        const userIds = message?.userIds || [];
        if (chatRoomId && userIds.includes(currentUserId)) {
          addressStore.chatroom.forEach(item => {
            if (item.id === chatRoomId) {
              (item as any).muted = false;
            }
          });
        }
      },
    });

    return () => {
      client?.removeEventHandler?.('UIKitMessage');
    };
  }, [client]);
};

export { useEventHandler };
