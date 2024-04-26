import { useCallback, useEffect, MutableRefObject, useContext } from 'react';
import { ChatSDK } from 'module/SDK';
import { RootContext } from '../store/rootContext';
import { useClient } from './useClient';
import { getStore } from '../store';
import { getCvsIdFromMessage, getGroupItemFromGroupsById } from '../utils';
import { useGroupMembersAttributes } from '../hooks/useAddress';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import ts from 'typescript';
import { ProviderProps } from '../store/Provider';

const useEventHandler = (props: ProviderProps) => {
  const { initConfig, features } = props;
  const rootStore = getStore();
  const { messageStore, threadStore, conversationStore, addressStore } = rootStore;
  const client = rootStore.client;
  const { useUserInfo } = initConfig;

  useEffect(() => {
    client?.addEventHandler?.('UIKitMessage', {
      onTextMessage: message => {
        messageStore.receiveMessage(message);
      },
      onImageMessage: message => {
        messageStore.receiveMessage(message);
      },
      onFileMessage: message => {
        messageStore.receiveMessage(message);
      },
      onAudioMessage: message => {
        messageStore.receiveMessage(message);
      },
      onVideoMessage: message => {
        messageStore.receiveMessage(message);
      },
      onLocationMessage: message => {
        messageStore.receiveMessage(message);
      },
      onCmdMessage: message => {
        const conversationId = getCvsIdFromMessage(message as BaseMessageType);

        const cvs = {
          chatType: message.chatType,
          conversationId: conversationId,
        };
        const { action } = message;
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
      onCustomMessage: message => {
        messageStore.receiveMessage(message);
      },

      onReceivedMessage: message => {
        messageStore.updateMessageStatus(message.mid, 'sent');
        // messageStore.receiveMessage(message);
      },
      onDeliveredMessage: message => {
        messageStore.updateMessageStatus(message.mid as string, 'received');
        // messageStore.receiveMessage(message);
        // messageStore.updateMessageStatus();
      },
      onReadMessage: message => {
        messageStore.updateMessageStatus(message.mid as string, 'read');
      },
      onChannelMessage: message => {
        const { chatType, from = '' } = message;
        if (chatType === 'singleChat') {
          setTimeout(() => {
            rootStore.messageStore.message?.[chatType]?.[from]
              ?.filter(message => {
                return (
                  //@ts-ignore
                  message.status === 'received' &&
                  message.type != 'audio' &&
                  message.type != 'video' &&
                  message.type != 'file' &&
                  message.type != 'combine'
                );
              })
              .forEach(receivedMessage => {
                // @ts-ignore
                messageStore.updateMessageStatus(receivedMessage.mid || receivedMessage.id, 'read');
              });
          }, 10);
        }
      },
      onRecallMessage: message => {
        let chatType: 'singleChat' | 'groupChat' | 'chatRoom' = 'singleChat';
        let conversationId = message.from == rootStore.client.user ? message.to : message.from;
        if (message.to.length == 15 && Number(message.to) > 0) {
          chatType = 'groupChat';
          conversationId = message.to;
        }
        messageStore.recallMessage(
          {
            chatType, // TODO: 'singleChat' | 'groupChat'
            conversationId,
          },
          message.mid,
        );
      },

      onConnected: () => {
        rootStore.setLoginState(true);
      },
      onDisconnected: () => {
        rootStore.setLoginState(false);
      },

      onReactionChange: data => {
        const conversationId = getCvsIdFromMessage(data as unknown as BaseMessageType);

        const cvs = {
          chatType: data.chatType,
          conversationId: conversationId,
        };
        rootStore.messageStore.updateReactions(cvs, data.messageId, data.reactions);
      },
      onModifiedMessage: message => {
        getStore().messageStore.modifyLocalMessage(message.id, message, true);
      },
      onMessagePinEvent: message => {
        const { messageId, conversationType, conversationId, operation, time, operatorId } =
          message;
        switch (operation) {
          case 'pin':
            getStore().pinnedMessagesStore.updatePinnedMessage(
              conversationType,
              conversationId,
              messageId,
              time,
              operatorId,
            );
            getStore().pinnedMessagesStore.pushPinNoticeMessage({
              conversationId,
              conversationType,
              operatorId,
              noticeType: 'pin',
              time,
            });
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
              operatorId,
              noticeType: 'unpin',
              time,
            });
            break;
          default:
            break;
        }
      },
      onGroupEvent: message => {
        const { operation, id } = message;
        const { addressStore, client } = rootStore;
        const groupItem = getGroupItemFromGroupsById(id);
        switch (operation) {
          case 'memberAttributesUpdate':
            // @ts-ignore
            const { userId, attributes } = message;
            addressStore.setGroupMemberAttributes(id, userId, attributes);
            break;
          case 'setAdmin':
            if (groupItem) {
              addressStore.setGroupAdmins(id, [...(groupItem?.admins || []), client.user]);
            }
            break;
          case 'removeAdmin':
            if (groupItem) {
              let admins = [...(groupItem?.admins || [])];
              admins.splice(admins.indexOf(client.user), 1);
              addressStore.setGroupAdmins(id, [...admins]);
            }
            break;
          case 'memberPresence':
            if (groupItem) {
              if (groupItem.members) {
                addressStore.setGroupMembers(id, [{ member: message.from }]);
                useGroupMembersAttributes(id, [message.from]);
              }
            }
            break;
          case 'memberAbsence':
            if (groupItem) {
              if (groupItem.members) {
                addressStore.removeGroupMember(id, message.from);
              }
              if (groupItem.admins) {
                groupItem.admins.includes(message.from) &&
                  addressStore.setGroupAdmins(
                    id,
                    groupItem.admins.filter(item => item !== message.from),
                  );
              }
            }
            break;
          case 'directJoined':
            addressStore.setGroups([
              {
                groupid: id,
                groupname: message.name || '',
              },
            ]);
            break;
          case 'destroy':
            addressStore.removeGroupFromContactList(id);
            break;
          default:
        }
      },
      onGroupChange: message => {
        const { type, gid } = message;
        const { addressStore } = rootStore;
        switch (type) {
          case 'changeOwner':
            addressStore.setGroupOwner(gid, message.to);
            break;
          case 'removedFromGroup':
            if (message.kicked == rootStore.client.user) {
              addressStore.removeGroupFromContactList(gid);
            }
            break;
        }
      },
      onPresenceStatusChange: message => {
        if (features?.conversationList?.item?.presence == false) return;
        const { addressStore } = rootStore;
        message.length > 0 &&
          message.forEach(presenceInfo => {
            const appUserInfo = addressStore.appUsersInfo;
            if (appUserInfo[presenceInfo.userId]) {
              const detailList = presenceInfo.statusDetails;
              let isOnline = false;
              detailList.forEach(item => {
                if (item.status === 1) {
                  isOnline = true;
                }
              });
              appUserInfo[presenceInfo.userId].isOnline = isOnline;
              appUserInfo[presenceInfo.userId].presenceExt = presenceInfo.ext;
              addressStore.setAppUserInfo({ ...appUserInfo });
            }
          });
        const changeList = message.map(item => {
          let status: Record<string, string> = {};
          item.statusDetails.forEach(s => {
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
        conversationStore.setOnlineStatus(changeList);
      },
      // @ts-ignore
      onCombineMessage: (message: BaseMessageType) => {
        messageStore.receiveMessage(message);
      },

      onChatThreadChange: (message: ChatSDK.ThreadChangeInfo) => {
        if (message.operation == 'userRemove') {
          if (
            message.userName == rootStore.client.user &&
            threadStore.currentThread?.info?.id == message.id
          ) {
            threadStore.setThreadVisible(false);
          }
        } else {
          threadStore.updateThreadInfo(message);
        }
      },

      onContactInvited: message => {
        addressStore.addContactRequest({
          ...message,
          type: 'subscribe',
          requestStatus: 'pending',
        });
        if (useUserInfo) {
          addressStore.getUserInfo(message.from);
        }
      },
      onContactDeleted: message => {
        console.log('onContactDeleted', message);
        const { addressStore } = rootStore;
        addressStore.deleteContactFromContactList(message.from);
        // addressStore.removeContact(message.from);
      },
      onContactAdded: message => {
        console.log('onContactAdded', message);

        const { addressStore } = rootStore;
        addressStore.addContactToContactList(message.from);
        // addressStore.addContact(message.from);
      },
      onContactAgreed: message => {
        const { addressStore } = rootStore;
        addressStore.addContactToContactList(message.from);
      },
    });

    return () => {
      client?.removeEventHandler?.('UIKitMessage');
    };
  }, [client]);
};

export { useEventHandler };
