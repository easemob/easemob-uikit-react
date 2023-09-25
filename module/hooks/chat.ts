import { useCallback, useEffect, MutableRefObject, useContext } from 'react';
import AC, { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
import { useClient } from './useClient';
import { getStore } from '../store';
import { getCvsIdFromMessage, getGroupItemFromGroupsById } from '../utils';
import { useGroupMembersAttributes } from '../hooks/useAddress';
const useEventHandler = () => {
  const rootStore = useContext(RootContext);
  const { messageStore, threadStore } = rootStore.rootStore;
  const client = useClient();
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
        const conversationId = getCvsIdFromMessage(message as unknown as AgoraChat.MessageBody);

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
            rootStore.rootStore.messageStore.message?.[chatType]?.[from]
              .filter(message => {
                //@ts-ignore
                return message.status === 'received';
              })
              .map(receivedMessage => {
                // @ts-ignore
                receivedMessage.status = 'read';
              });
          }, 10);
        }
      },
      onRecallMessage: message => {
        let chatType: 'singleChat' | 'groupChat' = 'singleChat';
        let conversationId =
          message.from == rootStore.rootStore.client.user ? message.to : message.from;
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
        rootStore.rootStore.setLoginState(true);
      },
      onDisconnected: () => {
        rootStore.rootStore.setLoginState(false);
      },

      onReactionChange: data => {
        const conversationId = getCvsIdFromMessage(data as unknown as AgoraChat.MessageBody);

        const cvs = {
          chatType: data.chatType,
          conversationId: conversationId,
        };
        rootStore.rootStore.messageStore.updateReactions(cvs, data.messageId, data.reactions);
      },
      onModifiedMessage: message => {
        getStore().messageStore.modifyLocalMessage(message.id, message, true);
      },
      onGroupEvent: message => {
        const { operation, id } = message;
        const { addressStore, client } = rootStore.rootStore;
        const groupItem = getGroupItemFromGroupsById(id);
        switch (operation) {
          case 'memberAttributesUpdate':
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
          default:
        }
      },
      onPresenceStatusChange: message => {
        const { addressStore } = rootStore.rootStore;
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
      },
      // @ts-ignore
      onCombineMessage: (message: AgoraChat.MessageBody) => {
        messageStore.receiveMessage(message);
      },

      onChatThreadChange: (message: AgoraChat.ThreadChangeInfo) => {
        if (message.operation == 'userRemove') {
          if (
            message.userName == rootStore.rootStore.client.user &&
            threadStore.currentThread?.info?.id == message.id
          ) {
            threadStore.setThreadVisible(false);
          }
        } else {
          threadStore.updateThreadInfo(message);
        }
      },
    });

    return () => {
      client?.removeEventHandler?.('UIKitMessage');
    };
  }, [client]);
};

export { useEventHandler };
