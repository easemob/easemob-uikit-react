import { observable, action, makeObservable, runInAction } from 'mobx';
import { getStore } from './index';
import { ChatSDK } from '../SDK';
import { getGroupItemIndexFromGroupsById, getGroupMemberIndexByUserId } from '../../module/utils';
import { getUsersInfo, checkCharacter } from '../utils';
import { pinyin } from 'pinyin-pro';
import { eventHandler } from '../../eventHandler';
import { rootStore } from 'chatuim2';

export type MemberRole = 'member' | 'owner' | 'admin';

export interface ContactRequest {
  from: string;
  to: string;
  type: 'subscribe';
  status?: string;
  requestStatus: 'pending' | 'accepted' | 'read';
}

export interface MemberItem {
  userId: ChatSDK.UserId;
  role: MemberRole;
  // @ts-ignore
  attributes?: ChatSDK.MemberAttributes;
  silent?: boolean;
  initial?: string;
  name?: string;
}

export interface GroupItem extends ChatSDK.BaseGroupInfo {
  disabled?: boolean;
  info?: ChatSDK.GroupDetailInfo;
  members?: MemberItem[];
  hasMembersNext?: boolean;
  admins?: ChatSDK.UserId[];
  silent?: boolean;
  initial?: string;
  name?: string;
  avatarUrl?: string;
}

export type AppUserInfo = Partial<Record<ChatSDK.ConfigurableKey, any>> & {
  userId: string;
  isOnline?: boolean;
  presenceExt?: string;
};

export type ChatroomInfo = ChatSDK.GetChatRoomDetailsResult & {
  membersId?: string[];
  admins?: string[];
  muteList?: string[];
};

class AddressStore {
  appUsersInfo: Record<string, AppUserInfo>;
  contacts: { userId: string; nickname: string; silent?: boolean; remark?: string }[];
  groups: GroupItem[];
  hasGroupsNext: boolean;
  chatroom: ChatroomInfo[];
  searchList: any;
  requests: ContactRequest[];
  thread: {
    [key: string]: ChatSDK.ThreadChangeInfo[];
  };
  constructor() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
    this.requests = [];
    makeObservable(this, {
      appUsersInfo: observable,
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      hasGroupsNext: observable,
      thread: observable,
      requests: observable,
      setHasGroupsNext: action,
      setContacts: action,
      deleteContactFromContactList: action,
      deleteContact: action,
      setGroups: action,
      setGroupMembers: action,
      setGroupMemberAttributes: action,
      setAppUserInfo: action,
      setChatroom: action,
      updateGroupName: action,
      removeGroupMember: action,
      setChatroomAdmins: action,
      setChatroomMuteList: action,
      getChatroomMuteList: action,
      removeUserFromMuteList: action,
      unmuteChatRoomMember: action,
      removerChatroomMember: action,
      getSilentModeForConversations: action,
      setSilentModeForConversationSync: action,
      getGroupInfo: action,
      modifyGroup: action,
      destroyGroup: action,
      leaveGroup: action,
      addContactRequest: action,
      readContactInvite: action,
      createGroup: action,
      inviteToGroup: action,
      setGroupOwner: action,
      addContactToContactList: action,
      removeGroupFromContactList: action,
      clear: action,
      setContactRemark: action,
      updateGroupAvatar: action,
    });
  }

  setAppUserInfo = (appUsersInfo: Record<string, AppUserInfo>) => {
    this.appUsersInfo = appUsersInfo;
  };

  setContacts(contacts: any) {
    this.contacts = contacts;
  }
  setContactRemark(userId: string, remark: string) {
    const rootStore = getStore();
    rootStore.client
      .setContactRemark({
        userId,
        remark,
      })
      .then(() => {
        runInAction(() => {
          this.contacts = this.contacts.map(item => {
            if (item.userId === userId) {
              item.remark = remark;
            }
            return item;
          });
          if (rootStore.conversationStore.currentCvs.conversationId === userId) {
            rootStore.conversationStore.currentCvs.name = remark;
          }
        });
        eventHandler.dispatchSuccess('setContactRemark');
      })
      .catch((error: any) => {
        eventHandler.dispatchError('setContactRemark', error);
      });
  }
  deleteContact(userId: string) {
    const rootStore = getStore();
    rootStore.client
      .deleteContact(userId)
      .then(() => {
        this.deleteContactFromContactList(userId);
        eventHandler.dispatchSuccess('deleteContact');
      })
      .catch(error => {
        eventHandler.dispatchError('deleteContact', error);
      });
  }
  deleteContactFromContactList(userId: string) {
    this.contacts = this.contacts.filter(item => item.userId !== userId);
  }

  addContactToContactList(userId: string) {
    // 先判断这个人是不是已经在联系人列表
    let found = this.contacts.find(item => item.userId === userId);
    if (found) {
      return;
    }
    this.getUserInfo(userId).then(userInfo => {
      const name = userInfo.nickname || userId;
      let initial = '#';
      if (checkCharacter(name.substring(0, 1)) == 'en') {
        initial = name.substring(0, 1).toUpperCase();
      } else if (checkCharacter(name.substring(0, 1)) == 'zh') {
        initial = pinyin(name.substring(0, 1), { toneType: 'none' })[0][0].toUpperCase();
      } else {
        initial = '#';
      }

      runInAction(() => {
        let found = this.contacts.find(item => item.userId === userId);
        if (found) {
          return;
        }

        this.contacts.push({
          userId,
          nickname: userInfo.nickname,
          // @ts-ignore
          name: userInfo.nickname,
          remark: '',
          avatar: userInfo.avatarurl,
          initial: initial,
        });
        this.contacts = [...this.contacts];
      });
    });
  }

  setGroups(groups: GroupItem[]) {
    let currentGroupsId = this.groups.map(item => item.groupid);
    let filteredGroups = groups.filter(
      ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    );
    this.groups = [...this.groups, ...filteredGroups];
  }

  updateGroupAvatar(groupId: string, avatar: string) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].avatarUrl = avatar;
      this.groups = [...this.groups];
    }
  }

  updateGroupName(groupId: string, groupName: string) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].groupname = groupName;
      this.groups = [...this.groups];
    }
  }

  setHasGroupsNext(hasNext: boolean) {
    this.hasGroupsNext = hasNext;
  }

  setGroupMembers(groupId: string, membersList: ChatSDK.GroupMember[]) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      let currentMembers = this.groups[idx]?.members?.map(item => item.userId);
      let filteredMembers = membersList
        .filter(
          //@ts-ignore
          item => !currentMembers?.find(id => id === (item.owner || item.member)),
        )
        .map<MemberItem>(member => {
          return {
            //@ts-ignore
            userId: member.owner || member.member,
            //@ts-ignore

            role: this.groups[idx].admins?.includes(member.owner || member.member)
              ? 'admin'
              : //@ts-ignore
              member?.owner
              ? 'owner'
              : 'member',
          };
        });
      runInAction(() => {
        this.groups[idx].members = [...(this.groups[idx].members || []), ...filteredMembers];
      });
    }
  }

  removeGroupMember(groupId: string, userId: string) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      if (this.groups[idx].members) {
        this.groups[idx].members = this.groups[idx].members?.filter(item => item.userId !== userId);
      }
    }
  }

  setGroupItemHasMembersNext(groupId: string, hasNext: boolean) {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].hasMembersNext = hasNext;
    }
  }
  setGroupMemberAttributesAsync = (
    groupId: string,
    userId: string,
    attributes: ChatSDK.MemberAttributes,
  ) => {
    const rootStore = getStore();
    rootStore.client
      .setGroupMemberAttributes({
        groupId,
        userId,
        memberAttributes: attributes,
      })
      .then(res => {
        this.setGroupMemberAttributes(groupId, userId, attributes);
        eventHandler.dispatchSuccess('setGroupMemberAttributes');
      })
      .catch(error => {
        eventHandler.dispatchError('setGroupMemberAttributes', error);
      });
  };
  setGroupMemberAttributes(
    groupId: string,
    userId: string,
    // @ts-ignore
    attributes: ChatSDK.MemberAttributes,
  ) {
    let groupIdx = getGroupItemIndexFromGroupsById(groupId);
    let idx = getGroupMemberIndexByUserId(this.groups[groupIdx], userId) ?? -1;
    if (idx > -1) {
      let memberList = this.groups[groupIdx].members || [];
      memberList[idx].attributes = attributes;
    }
  }

  setGroupAdmins = (groupId: string, admins: string[]) => {
    let idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].admins = [...admins];
    }
  };

  getUserInfo = (userId: string) => {
    let userInfo = this.appUsersInfo?.[userId];
    if (!userInfo) {
      return getUsersInfo({ userIdList: [userId], withPresence: false }).then(() => {
        userInfo = this.appUsersInfo?.[userId];
        runInAction(() => {
          this.appUsersInfo[userId] = userInfo;
        });
        return userInfo;
      });
    }
    return Promise.resolve(userInfo);
  };

  getUserInfoWithPresence = (userIdList: string[]) => {
    getUsersInfo({ userIdList });
  };

  setChatroom(chatroom: any) {
    this.chatroom = chatroom;
    // let currentGroupsId = this.groups.map(item => item.groupid);
    // let filteredGroups = groups.filter(
    //   ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    // );
    // this.groups = [...this.groups, ...filteredGroups];
  }

  setChatroomAdmins = (chatroomId: string, admins: string[]) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].admins = [...admins];
    }
  };

  addUserToMuteList = (chatroomId: string, userId: string) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = [...muteList, userId];
    }
  };

  setChatroomMuteList = (chatroomId: string, muteList: string[]) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].muteList = [...muteList];
    }
  };

  muteChatRoomMember = (chatroomId: string, userId: string, muteDuration?: number) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      if (muteList.includes(userId)) return Promise.resolve();
    }
    return rootStore.client
      .muteChatRoomMember({
        chatRoomId: chatroomId,
        username: userId, //message.from as string,
        muteDuration: muteDuration || 60 * 60 * 24 * 30,
      })
      .then(res => {
        this.addUserToMuteList(chatroomId, userId);
        eventHandler.dispatchSuccess('muteChatRoomMember');
      })
      .catch(error => {
        eventHandler.dispatchError('muteChatRoomMember', error);
      });
  };

  getChatroomMuteList = (chatroomId: string) => {
    if (!chatroomId) throw 'chatroomId is empty';
    const rootStore = getStore();
    return rootStore.client
      .getChatRoomMutelist({ chatRoomId: chatroomId })
      .then(res => {
        const muteList = res.data?.map(item => item.user) || [];
        this.setChatroomMuteList(chatroomId, muteList);
        eventHandler.dispatchSuccess('getChatRoomMutelist');
      })
      .catch(error => {
        eventHandler.dispatchError('getChatRoomMutelist', error);
      });
  };

  unmuteChatRoomMember = (chatroomId: string, userId: string) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    return rootStore.client
      .unmuteChatRoomMember({
        chatRoomId: chatroomId,
        username: userId, //message.from as string,
      })
      .then(res => {
        this.removeUserFromMuteList(chatroomId, userId);
        eventHandler.dispatchSuccess('unmuteChatRoomMember');
      })
      .catch(error => {
        eventHandler.dispatchError('unmuteChatRoomMember', error);
      });
  };
  removeUserFromMuteList = (chatroomId: string, userId: string) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = muteList.filter(item => item !== userId);
    }
  };

  setChatroomMemberIds = (chatroomId: string, membersId: string[]) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].membersId = [
        ...new Set([...(this.chatroom[idx].membersId || []), ...membersId]),
      ];
    }
  };

  removerChatroomMember = (chatroomId: string, userId: string) => {
    const rootStore = getStore();
    rootStore.client
      .removeChatRoomMember({
        chatRoomId: chatroomId,
        username: userId,
      })
      .then(() => {
        let idx = this.chatroom.findIndex(item => item.id === chatroomId);
        if (idx > -1) {
          this.chatroom[idx].membersId = this.chatroom[idx].membersId?.filter(
            item => item !== userId,
          );
        }
        eventHandler.dispatchSuccess('removeChatRoomMember');
      })
      .catch(error => {
        eventHandler.dispatchError('removeChatRoomMember', error);
      });
  };

  setSearchList(searchList: any) {
    this.searchList = searchList;
  }
  getSilentModeForConversations(
    cvs: { conversationId: string; chatType: 'singleChat' | 'groupChat' }[],
  ) {
    if (!cvs || cvs.length == 0) {
      return;
    }
    const cvsList = cvs.map(item => {
      return {
        id: item.conversationId,
        type: item.chatType,
      };
    });
    const rootStore = getStore();
    rootStore.client
      .getSilentModeForConversations({
        conversationList: cvsList,
      })
      .then((res: any) => {
        const userSetting = res.data.user;
        const groupSetting = res.data.group;
        runInAction(() => {
          this.contacts.forEach(item => {
            if (userSetting[item.userId] && userSetting[item.userId]?.type == 'NONE') {
              item.silent = true;
            } else if (userSetting[item.userId]) {
              item.silent = false;
            }
          });
          this.groups.forEach(item => {
            if (groupSetting[item.groupid] && groupSetting[item.groupid]?.type == 'AT') {
              item.silent = true;
            } else if (groupSetting[item.groupid]) {
              item.silent = false;
            }
          });
        });

        eventHandler.dispatchSuccess('getSilentModeForConversations');
      })
      .catch(error => {
        eventHandler.dispatchError('getSilentModeForConversations', error);
      });
  }

  setSilentModeForConversationSync(
    cvs: { conversationId: string; chatType: 'singleChat' | 'groupChat' },
    silent: boolean,
  ) {
    if (cvs.chatType === 'singleChat') {
      this.contacts.forEach(item => {
        if (item.userId === cvs.conversationId) {
          item.silent = silent;
        }
      });
    } else if (cvs.chatType === 'groupChat') {
      this.groups.forEach(item => {
        if (item.groupid === cvs.conversationId) {
          item.silent = silent;
        }
      });
    }
  }
  setSilentModeForConversation(
    cvs: { conversationId: string; chatType: 'singleChat' | 'groupChat' },
    silent: boolean,
  ) {
    const rootStore = getStore();
    if (silent) {
      rootStore.client
        .setSilentModeForConversation({
          conversationId: cvs.conversationId,
          type: cvs.chatType as ChatSDK.CONVERSATIONTYPE,
          options: {
            paramType: 0,
            remindType: (cvs.chatType == 'groupChat' ? 'AT' : 'NONE') as ChatSDK.SILENTMODETYPE,
          },
        })
        .then((res: any) => {
          rootStore.conversationStore.setSilentModeForConversationSync(cvs, true);
          this.setSilentModeForConversationSync(cvs, true);
          eventHandler.dispatchSuccess('setSilentModeForConversation');
        })
        .catch(error => {
          eventHandler.dispatchError('setSilentModeForConversation', error);
        });
    } else {
      rootStore.client
        .clearRemindTypeForConversation({
          conversationId: cvs.conversationId,
          type: cvs.chatType as ChatSDK.CONVERSATIONTYPE,
        })
        .then((res: any) => {
          rootStore.conversationStore.setSilentModeForConversationSync(cvs, false);

          this.setSilentModeForConversationSync(cvs, false);
          eventHandler.dispatchSuccess('clearRemindTypeForConversation');
        })
        .catch(error => {
          eventHandler.dispatchError('clearRemindTypeForConversation', error);
        });
    }
  }

  getGroupInfo(groupId: string) {
    const rootStore = getStore();
    rootStore.client
      .getGroupInfo({
        groupId: groupId,
      })
      .then(res => {
        runInAction(() => {
          const found = this.groups.filter(item => item.groupid === groupId);
          if (found.length === 0) {
            this.groups.push({
              info: res.data?.[0],
              groupid: groupId,
              groupname: res.data?.[0].name || '',
            });
          } else {
            found[0].info = res.data?.[0];
          }
        });

        eventHandler.dispatchSuccess('getGroupInfo');
      })
      .catch(error => {
        eventHandler.dispatchError('getGroupInfo', error);
      });
  }

  modifyGroup(groupId: string, groupName: string, description: string) {
    const rootStore = getStore();
    rootStore.client
      .modifyGroup({
        groupId,
        groupName,
        description,
      })
      .then(() => {
        this.groups.forEach(item => {
          if (item.groupid === groupId) {
            runInAction(() => {
              item.groupname = groupName;

              if (item.info) {
                item.info.description = description;
                item.info.name = groupName;
              }
              if (rootStore.conversationStore.currentCvs.conversationId === groupId) {
                rootStore.conversationStore.currentCvs.name = groupName;
              }
              if (rootStore.messageStore.currentCVS.conversationId === groupId) {
                rootStore.messageStore.currentCVS.name = groupName;
              }
            });
          }
        });
        const conversation = rootStore.conversationStore.conversationList.find(item => {
          return item.conversationId === groupId;
        });
        if (conversation) {
          conversation.name = groupName;
        }
        conversation && rootStore.conversationStore.modifyConversation(conversation);
        eventHandler.dispatchSuccess('modifyGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('modifyGroup', error);
      });
  }

  destroyGroup(groupId: string) {
    const rootStore = getStore();
    rootStore.client
      .destroyGroup({
        groupId,
      })
      .then(() => {
        runInAction(() => {
          this.groups = this.groups.filter(item => item.groupid !== groupId);
        });

        rootStore.conversationStore.deleteConversation({
          chatType: 'groupChat',
          conversationId: groupId,
        });
        eventHandler.dispatchSuccess('destroyGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('destroyGroup', error);
      });
  }

  leaveGroup(groupId: string) {
    const rootStore = getStore();
    rootStore.client
      .leaveGroup({
        groupId,
      })
      .then(() => {
        runInAction(() => {
          this.groups = this.groups.filter(item => item.groupid !== groupId);
        });

        rootStore.conversationStore.deleteConversation({
          chatType: 'groupChat',
          conversationId: groupId,
        });
        eventHandler.dispatchSuccess('leaveGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('leaveGroup', error);
      });
  }

  addContact(userId: string) {
    const rootStore = getStore();
    rootStore.client
      .addContact(userId, '')
      .then(() => {
        eventHandler.dispatchSuccess('addContact');
      })
      .catch(error => {
        eventHandler.dispatchError('addContact', error);
      });
  }

  addContactRequest(request: ContactRequest) {
    let foundIndex = this.requests.findIndex(
      item => item.from === request.from && item.to === request.to,
    );
    if (foundIndex >= 0) {
      this.requests[foundIndex] = request;
    } else {
      this.requests.push(request);
    }
    this.requests = [...this.requests];
  }

  acceptContactInvite(userId: string) {
    const rootStore = getStore();
    rootStore.client.acceptContactInvite(userId);
    this.requests.forEach(item => {
      if (item.from === userId) {
        item.requestStatus = 'accepted';
      }
    });
    this.requests = [...this.requests];
  }

  readContactInvite(userId: string) {
    this.requests.forEach(item => {
      if (item.from === userId && item.requestStatus === 'pending') {
        item.requestStatus = 'read';
      }
    });
    this.requests = [...this.requests];
  }

  createGroup(members: string[]) {
    const rootStore = getStore();
    // groupname 是前三个用户的昵称， 其中第一个用户是自己
    const groupnameArr = members.slice(0, 2).map(item => {
      return rootStore.addressStore.appUsersInfo?.[item]?.nickname || item;
    });
    groupnameArr.unshift(
      rootStore.addressStore.appUsersInfo?.[rootStore.client.user]?.nickname ||
        rootStore.client.user,
    );
    const groupName = groupnameArr.join('、');

    rootStore.client
      .createGroup({
        data: {
          groupname: groupName,
          members,
          desc: groupName,
          public: false,
          approval: false,
          allowinvites: true,
          inviteNeedConfirm: false,
          maxusers: 1000,
        },
      })
      .then((res: ChatSDK.AsyncResult<ChatSDK.CreateGroupResult>) => {
        runInAction(() => {
          const groupMembers = members.map(item => {
            return {
              userId: item,
              role: 'member' as 'member' | 'owner' | 'admin',
            };
          });
          groupMembers.push({
            userId: rootStore.client.user,
            role: 'owner',
          });
          let initial = '#';
          if (checkCharacter(groupName.substring(0, 1)) == 'en') {
            initial = groupName.substring(0, 1).toUpperCase();
          } else if (checkCharacter(groupName.substring(0, 1)) == 'zh') {
            initial = pinyin(groupName.substring(0, 1), { toneType: 'none' })[0][0].toUpperCase();
          }

          this.groups.push({
            disabled: false,
            groupid: res.data?.groupid || '',
            initial: initial,
            name: groupName,
            groupname: groupName,
            members: groupMembers,
          });
        });
        rootStore.conversationStore.addConversation({
          chatType: 'groupChat',
          conversationId: res.data?.groupid || '',
          name: groupName,
          lastMessage: {} as any,
          unreadCount: 0,
        });
        rootStore.conversationStore.setCurrentCvs({
          chatType: 'groupChat',
          conversationId: res.data?.groupid || '',
          name: groupName,
        });
        eventHandler.dispatchSuccess('createGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('createGroup', error);
      });
  }

  inviteToGroup(groupId: string, userIds: string[]) {
    const rootStore = getStore();
    rootStore.client
      .inviteUsersToGroup({
        groupId: groupId,
        users: userIds,
      })
      .then(res => {
        eventHandler.dispatchSuccess('inviteToGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('inviteToGroup', error);
      });
  }
  removeGroupMembers(groupId: string, userIds: string[]) {
    const rootStore = getStore();
    rootStore.client
      .removeGroupMembers({
        groupId: groupId,
        users: userIds,
      })
      .then(res => {
        eventHandler.dispatchSuccess('removeGroupMembers');
      })
      .catch(error => {
        eventHandler.dispatchError('removeGroupMembers', error);
      });
  }
  setGroupOwner(groupId: string, userId: string) {
    this.groups.forEach(item => {
      if (item.groupid === groupId) {
        item.members?.forEach(member => {
          if (member.userId === userId) {
            member.role = 'owner';
          } else if (member.role === 'owner') {
            member.role = 'member';
          }
        });
        if (item.info) {
          item.info.owner = userId;
        }
      }
    });
    this.groups = [...this.groups];
  }
  changeGroupOwner(groupId: string, newOwner: string) {
    const rootStore = getStore();
    rootStore.client
      .changeGroupOwner({
        groupId: groupId,
        newOwner: newOwner,
      })
      .then(res => {
        this.setGroupOwner(groupId, newOwner);
        eventHandler.dispatchSuccess('changeGroupOwner');
      })
      .catch(error => {
        eventHandler.dispatchError('changeGroupOwner', error);
      });
  }
  removeGroupFromContactList(groupId: string) {
    this.groups = this.groups.filter(item => item.groupid !== groupId);
  }
  clear() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
  }
}

export default AddressStore;
