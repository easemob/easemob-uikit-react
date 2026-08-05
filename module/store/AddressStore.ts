import { observable, action, makeObservable, runInAction } from 'mobx';
import { getStore } from './index';
import type { ChatSDK } from '../SDK';
import { getGroupItemIndexFromGroupsById, getGroupMemberIndexByUserId } from '../../module/utils';
import { getCurrentUserId, getUsersInfo, checkCharacter } from '../utils';
import { pinyin } from 'pinyin-pro';
import { eventHandler } from '../../eventHandler';

export type MemberRole = 'member' | 'owner' | 'admin';

export interface ContactRequest {
  from: string;
  to: string;
  type: 'subscribe';
  status?: string;
  requestStatus: 'pending' | 'accepted' | 'read';
}

export interface MemberItem {
  userId: string;
  role: MemberRole;
  attributes?: Record<string, string>;
  silent?: boolean;
  initial?: string;
  name?: string;
}

export interface GroupItem {
  groupId: string;
  name: string;
  groupName?: string;
  description?: string;
  memberCount?: number;
  public?: boolean;
  joinApprovalRequired?: boolean;
  allowInvites?: boolean;
  maxMembers?: number;
  role?: MemberRole;
  disabled?: boolean;
  info?: Record<string, any>;
  members?: MemberItem[];
  hasMembersNext?: boolean;
  admins?: string[];
  silent?: boolean;
  initial?: string;
  avatarUrl?: string;
}

export type AppUserInfo = Record<string, any> & {
  userId: string;
  nickname?: string;
  avatarUrl?: string;
  /** @deprecated Use avatarUrl instead. Kept for compatibility with older UIKit integrations. */
  avatarurl?: string;
  isOnline?: boolean;
  presenceExt?: string;
};

export type AppUserInfoMap = Record<string, AppUserInfo>;
export type AppUserInfoProviderResult = AppUserInfo[] | AppUserInfoMap;
export type AppUserInfoProvider = (
  userIds: string[],
) => Promise<AppUserInfoProviderResult> | AppUserInfoProviderResult;

export type ChatroomInfo = Record<string, any> & {
  id: string;
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
    [key: string]: any[];
  };
  blockList: string[];
  constructor() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
    this.requests = [];
    this.blockList = [];
    makeObservable(this, {
      appUsersInfo: observable,
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      hasGroupsNext: observable,
      thread: observable,
      requests: observable,
      blockList: observable,
      setHasGroupsNext: action,
      setContacts: action,
      deleteContactFromContactList: action,
      deleteContact: action,
      setGroups: action,
      ensureGroupInList: action,
      setGroupMembers: action,
      setGroupMemberAttributes: action,
      setAppUserInfo: action,
      mergeAppUserInfo: action,
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
      getBlockList: action,
      addUsersToBlocklist: action,
      removeUserFromBlocklist: action,
      updateChatroomMemberCount: action,
    });
  }

  setAppUserInfo = (appUsersInfo: Record<string, AppUserInfo>) => {
    this.appUsersInfo = this.normalizeAppUsersInfoMap(appUsersInfo);
  };

  mergeAppUserInfo = (appUsersInfo: Record<string, AppUserInfo> | AppUserInfo[]) => {
    const normalized = this.normalizeAppUsersInfo(appUsersInfo);
    const merged = { ...this.appUsersInfo };
    Object.keys(normalized).forEach(userId => {
      merged[userId] = this.normalizeAppUserInfo(
        {
          ...merged[userId],
          ...normalized[userId],
        },
        userId,
      );
    });
    this.appUsersInfo = merged;
  };

  resolveUserInfo = (userId?: string): AppUserInfo => {
    if (!userId) {
      return { userId: '' };
    }
    return this.appUsersInfo[userId] || { userId };
  };

  hasUserInfo = (userId: string) => {
    const userInfo = this.appUsersInfo[userId];
    return Boolean(userInfo && (userInfo.nickname || userInfo.avatarUrl || userInfo.avatarurl));
  };

  ensureUserInfos = (
    userIds: string[],
    options: { withPresence?: boolean; force?: boolean } = {},
  ) => {
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    const requestUserIds = options.force
      ? uniqueUserIds
      : uniqueUserIds.filter(userId => !this.hasUserInfo(userId));
    if (requestUserIds.length === 0) {
      return Promise.resolve({});
    }
    return getUsersInfo({
      userIdList: requestUserIds,
      withPresence: options.withPresence,
      force: options.force,
    });
  };

  setContacts(contacts: any) {
    this.contacts = contacts;
  }
  setContactRemark(userId: string, remark: string) {
    const rootStore = getStore();
    rootStore.client.contactManager
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
    rootStore.client.contactManager
      .deleteContact({ userId })
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
    delete this.appUsersInfo[userId];
  }

  async addContactToContactList(userId: string, widthPresence = false) {
    // 先判断这个人是不是已经在联系人列表
    const found = this.contacts.find(item => item.userId === userId);
    if (found) {
      return;
    }
    // 如果收到了这个人的消息，消息里有个人信息就不去获取了, 也有一种可能现在没有这个人的信息，但是获取用户属性过程中收到了这个人的消息，但是用户属性还是会覆盖，要处理以哪个为准（有了就不获取，获取后有了就不再重新赋值）
    let userInfo = this.appUsersInfo[userId];
    if (!userInfo) {
      try {
        userInfo = (await this.getUserInfo(userId, widthPresence, true)) || { userId };
      } catch (error) {
        console.log('addContactToContactList error');
      }
    }

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
      const found = this.contacts.find(item => item.userId === userId);
      if (found) {
        return;
      }

      this.contacts.push({
        userId,
        nickname: userInfo.nickname,
        remark: '',
      } as any);
      this.contacts = [...this.contacts];
    });
  }

  setGroups(groups: GroupItem[]) {
    const currentGroupsId = this.groups.map(item => item.groupId);
    const filteredGroups = groups.filter(
      ({ groupId }) => !currentGroupsId.find(id => id === groupId),
    );
    this.groups = [...this.groups, ...filteredGroups];
  }

  updateGroupAvatar(groupId: string, avatar: string) {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].avatarUrl = avatar;
      this.groups = [...this.groups];
    }
    // 更新会话列表里的头像
    const rootStore = getStore();
    const conversation = rootStore.conversationStore.conversationList.find(
      item => item.conversationId === groupId,
    );
    if (conversation) {
      conversation.avatarUrl = avatar;
      rootStore.conversationStore.modifyConversation(conversation);
    }
  }

  updateGroupName(groupId: string, groupName: string) {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].name = groupName;
      this.groups[idx].groupName = groupName;
      this.groups = [...this.groups];
    }
  }

  setHasGroupsNext(hasNext: boolean) {
    this.hasGroupsNext = hasNext;
  }

  /** Ensure a joined group exists locally (e.g. invitee onMembersJoined before getGroupInfo). */
  ensureGroupInList(groupId: string, groupName?: string) {
    if (!groupId) return;
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      if (groupName && !this.groups[idx].groupName && !this.groups[idx].name) {
        this.groups[idx].groupName = groupName;
        this.groups[idx].name = groupName;
      }
      return;
    }
    this.groups.push({
      groupId,
      groupName: groupName || '',
      name: groupName || '',
      members: [],
    } as GroupItem);
  }

  /** Normalize SDK4/SDK5 group member payloads to MemberItem.userId + role. */
  private normalizeGroupMemberEntry(member: any, admins?: string[]): MemberItem | null {
    const userId = member?.user?.userId || member?.userId || member?.owner || member?.member || '';
    if (!userId) return null;

    let role: MemberRole = 'member';
    if (member?.role === 'owner' || member?.role === 'admin' || member?.role === 'member') {
      role = member.role;
    } else if (member?.owner && !member?.member && !member?.user && !member?.userId) {
      // SDK4 shape: { owner: userId }
      role = 'owner';
    } else if (admins?.includes(userId)) {
      role = 'admin';
    }

    return { userId, role };
  }

  setGroupMembers(
    groupId: string,
    membersList: Array<
      | { userId?: string; member?: string; owner?: string; role?: MemberRole }
      | { user?: { userId?: string }; role?: MemberRole }
    >,
  ) {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      const currentMembers = this.groups[idx]?.members?.map(item => item.userId) || [];
      const filteredMembers = membersList
        .map(member => this.normalizeGroupMemberEntry(member, this.groups[idx].admins))
        .filter((item): item is MemberItem => Boolean(item?.userId))
        .filter(item => !currentMembers.includes(item.userId));
      runInAction(() => {
        this.groups[idx].members = [...(this.groups[idx].members || []), ...filteredMembers];
      });
    }
  }

  removeGroupMember(groupId: string, userId: string) {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      if (this.groups[idx].members) {
        this.groups[idx].members = this.groups[idx].members?.filter(item => item.userId !== userId);
      }
    }
  }

  setGroupItemHasMembersNext(groupId: string, hasNext: boolean) {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].hasMembersNext = hasNext;
    }
  }
  setGroupMemberAttributesAsync = (
    groupId: string,
    userId: string,
    attributes: Record<string, string>,
  ) => {
    const rootStore = getStore();
    rootStore.client.groupManager
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
  setGroupMemberAttributes(groupId: string, userId: string, attributes: Record<string, string>) {
    const groupIdx = getGroupItemIndexFromGroupsById(groupId);
    const idx = getGroupMemberIndexByUserId(this.groups[groupIdx], userId) ?? -1;
    if (idx > -1) {
      const memberList = this.groups[groupIdx].members || [];
      memberList[idx].attributes = attributes;
    }
  }

  setGroupAdmins = (groupId: string, admins: string[]) => {
    const idx = getGroupItemIndexFromGroupsById(groupId);
    if (idx > -1) {
      this.groups[idx].admins = [...admins];
    }
  };

  getUserInfo = (userId: string, withPresence: boolean = false, force = false) => {
    let userInfo = this.appUsersInfo?.[userId];
    if (!userInfo || force) {
      return getUsersInfo({ userIdList: [userId], withPresence, force })
        .then(() => {
          userInfo = this.appUsersInfo?.[userId];
          runInAction(() => {
            if (userInfo) {
              this.appUsersInfo[userId] = this.normalizeAppUserInfo(userInfo, userId);
            }
          });
          return userInfo;
        })
        .catch(err => {
          console.warn('get getUsersInfo failed', err);
        });
    }
    return Promise.resolve(userInfo);
  };

  getUserInfoWithPresence = (userIdList: string[]) => {
    this.ensureUserInfos(userIdList).catch(err => {
      console.warn('get getUsersInfo failed', err);
    });
  };

  normalizeAppUsersInfo = (appUsersInfo: Record<string, AppUserInfo> | AppUserInfo[]) => {
    return Array.isArray(appUsersInfo)
      ? appUsersInfo.reduce<AppUserInfoMap>((result, item) => {
          if (!item?.userId) return result;
          result[item.userId] = this.normalizeAppUserInfo(item, item.userId);
          return result;
        }, {})
      : this.normalizeAppUsersInfoMap(appUsersInfo);
  };

  normalizeAppUsersInfoMap = (appUsersInfo: Record<string, AppUserInfo>) => {
    return Object.keys(appUsersInfo || {}).reduce<AppUserInfoMap>((result, userId) => {
      const item = appUsersInfo[userId];
      if (!item) return result;
      const normalizedUserId = item.userId || userId;
      result[normalizedUserId] = this.normalizeAppUserInfo(item, normalizedUserId);
      return result;
    }, {});
  };

  normalizeAppUserInfo = (userInfo: AppUserInfo, fallbackUserId?: string): AppUserInfo => {
    const userId = userInfo.userId || fallbackUserId || '';
    const avatarUrl = userInfo.avatarUrl ?? userInfo.avatarurl;
    return {
      ...userInfo,
      userId,
      avatarUrl,
      avatarurl: userInfo.avatarurl ?? avatarUrl,
    };
  };

  setChatroom(chatroom: any) {
    this.chatroom = chatroom;
    // let currentGroupsId = this.groups.map(item => item.groupId);
    // let filteredGroups = groups.filter(
    //   ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    // );
    // this.groups = [...this.groups, ...filteredGroups];
  }

  updateChatroomMemberCount(roomId: string, count: number) {
    const idx = this.chatroom.findIndex(item => item.id === roomId);
    if (idx > -1) {
      this.chatroom[idx].affiliations_count = count;
    }
  }

  setChatroomAdmins = (chatroomId: string, admins: string[]) => {
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].admins = [...admins];
    }
  };

  addUserToMuteList = (chatroomId: string, userId: string) => {
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = [...muteList, userId];
    }
  };

  setChatroomMuteList = (chatroomId: string, muteList: string[]) => {
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      this.chatroom[idx].muteList = [...muteList];
    }
  };

  muteChatRoomMember = (chatroomId: string, userId: string, muteDuration?: number) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      if (muteList.includes(userId)) return Promise.resolve();
    }
    return rootStore.client.chatRoomManager
      .muteMembers({
        chatRoomId: chatroomId,
        userIds: [userId],
        duration: muteDuration || 60 * 60 * 24 * 30,
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
    return rootStore.client.chatRoomManager
      .getMuteList({ chatRoomId: chatroomId })
      .then(res => {
        const muteList = res?.map((item: any) => item.userId || item.user || item) || [];
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
    return rootStore.client.chatRoomManager
      .unmuteMembers({
        chatRoomId: chatroomId,
        userIds: [userId],
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
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = muteList.filter(item => item !== userId);
    }
  };

  setChatroomMemberIds = (chatroomId: string, membersId: string[]) => {
    const idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      runInAction(() => {
        this.chatroom[idx].membersId = [
          ...new Set([...(this.chatroom[idx].membersId || []), ...membersId]),
        ];
      });
    }
  };

  removerChatroomMember = (chatroomId: string, userId: string) => {
    const rootStore = getStore();
    rootStore.client.chatRoomManager
      .removeMembers({
        chatRoomId: chatroomId,
        userIds: [userId],
      })
      .then(() => {
        const idx = this.chatroom.findIndex(item => item.id === chatroomId);
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
        conversationId: item.conversationId,
        conversationType: item.chatType,
      };
    });
    const rootStore = getStore();
    rootStore.client.pushManager
      .getConversationSilentModes({
        conversationList: cvsList,
      })
      .then((res: any) => {
        const conversations = res.conversations || [];
        runInAction(() => {
          this.contacts.forEach(item => {
            const setting = conversations.find(
              (conversation: any) => conversation.conversationId === item.userId,
            );
            if (setting?.rule?.remindType) item.silent = setting.rule.remindType === 'NONE';
          });
          this.groups.forEach(item => {
            const setting = conversations.find(
              (conversation: any) => conversation.conversationId === item.groupId,
            );
            if (setting?.rule?.remindType) item.silent = setting.rule.remindType === 'AT';
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
        if (item.groupId === cvs.conversationId) {
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
      rootStore.client.pushManager
        .setConversationSilentMode({
          conversationId: cvs.conversationId,
          conversationType: cvs.chatType,
          rule: {
            mode: 'REMIND_TYPE',
            remindType: cvs.chatType == 'groupChat' ? 'AT' : 'NONE',
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
      rootStore.client.pushManager
        .clearConversationRemindType({
          conversationId: cvs.conversationId,
          conversationType: cvs.chatType,
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
    rootStore.client.groupManager
      .getGroupInfo({
        groupId: groupId,
      })
      .then(group => {
        runInAction(() => {
          const found = this.groups.filter(item => item.groupId === groupId);
          if (found.length === 0) {
            this.groups.push({
              ...group,
              info: group,
              groupId,
              name: group.name || '',
              groupName: group.name || '',
            });
          } else {
            found[0].info = group;
            found[0].name = group.name || found[0].name;
            found[0].groupName = group.name || found[0].groupName;
            if (group.role) {
              found[0].role = group.role;
            }
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
    rootStore.client.groupManager
      .updateGroupInfo({
        groupId,
        name: groupName,
        description,
      })
      .then(() => {
        this.groups.forEach(item => {
          if (item.groupId === groupId) {
            runInAction(() => {
              item.name = groupName;

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
    rootStore.client.groupManager
      .destroyGroup({
        groupId,
      })
      .then(() => {
        runInAction(() => {
          this.groups = this.groups.filter(item => item.groupId !== groupId);
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
    rootStore.client.groupManager
      .leaveGroup({
        groupId,
      })
      .then(() => {
        runInAction(() => {
          this.groups = this.groups.filter(item => item.groupId !== groupId);
          rootStore.messageStore.message.groupChat[groupId] = [];
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
    rootStore.client.contactManager
      .addContact({ userId, message: '' })
      .then(() => {
        eventHandler.dispatchSuccess('addContact');
      })
      .catch(error => {
        eventHandler.dispatchError('addContact', error);
      });
  }

  addContactRequest(request: ContactRequest) {
    const foundIndex = this.requests.findIndex(
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
    rootStore.client.contactManager.acceptContactInvite({ userId });
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
  // TODO: 增加群名称，群头像等参数，传头像的话，创建会话时增加avatarUrl字段
  createGroup(members: string[]) {
    const rootStore = getStore();
    const currentUserId = getCurrentUserId(rootStore.client);
    // groupname 是前三个用户的昵称， 其中第一个用户是自己
    const groupnameArr = members.slice(0, 2).map(item => {
      return rootStore.addressStore.resolveUserInfo(item).nickname || item;
    });
    groupnameArr.unshift(
      rootStore.addressStore.resolveUserInfo(currentUserId).nickname || currentUserId,
    );
    const groupName = groupnameArr.join('、');

    rootStore.client.groupManager
      .createGroup({
        name: groupName,
        description: groupName,
        memberIds: members,
        public: false,
        joinApprovalRequired: false,
        allowInvites: true,
        inviteNeedConfirm: false,
        maxMembers: 1000,
      })
      .then((res: { groupId: string }) => {
        runInAction(() => {
          const groupMembers = members.map(item => {
            return {
              userId: item,
              role: 'member' as 'member' | 'owner' | 'admin',
            };
          });
          groupMembers.push({
            userId: currentUserId,
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
            groupId: res.groupId || '',
            initial: initial,
            name: groupName,
            groupName: groupName,
            role: 'owner',
            members: groupMembers,
            info: {
              groupId: res.groupId || '',
              name: groupName,
              role: 'owner',
              owner: { userId: currentUserId },
            },
          });
        });

        rootStore.conversationStore.addConversation({
          chatType: 'groupChat',
          conversationId: res.groupId || '',
          name: groupName,
          lastMessage: {} as any,
          unreadCount: 0,
          // avatarUrl: group?.avatarUrl,
        });
        rootStore.conversationStore.setCurrentCvs({
          chatType: 'groupChat',
          conversationId: res.groupId || '',
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
    rootStore.client.groupManager
      .inviteUsersToGroup({
        groupId: groupId,
        userIds,
      })
      .then(res => {
        // 直接将用户加入群组， 然后在群组成员列表添加这个用户
        this.groups.forEach(item => {
          if (item.groupId === groupId) {
            const groupMembers = userIds.map(item => {
              return {
                userId: item,
                role: 'member' as 'member' | 'owner' | 'admin',
              };
            });
            item.members = [...(item.members || []), ...groupMembers];
          }
        });
        eventHandler.dispatchSuccess('inviteToGroup');
      })
      .catch(error => {
        eventHandler.dispatchError('inviteToGroup', error);
      });
  }
  removeGroupMembers(groupId: string, userIds: string[]) {
    const rootStore = getStore();
    rootStore.client.groupManager
      .removeGroupMembers({
        groupId: groupId,
        userIds,
      })
      .then(res => {
        // 直接移除成员，然后在成员列表删除这个user
        userIds.forEach(userId => {
          this.removeGroupMember(groupId, userId);
        });

        eventHandler.dispatchSuccess('removeGroupMembers');
      })
      .catch(error => {
        eventHandler.dispatchError('removeGroupMembers', error);
      });
  }
  setGroupOwner(groupId: string, userId: string) {
    this.groups.forEach(item => {
      if (item.groupId === groupId) {
        item.members?.forEach(member => {
          if (member.userId === userId) {
            member.role = 'owner';
          } else if (member.role === 'owner') {
            member.role = 'member';
          }
        });
        if (item.info) {
          // Keep SDK5-compatible owner shape while also supporting string compares
          item.info.owner = { userId };
        }
        const currentUserId = getCurrentUserId(getStore().client);
        if (userId === currentUserId) {
          item.role = 'owner';
          if (item.info) item.info.role = 'owner';
        } else if (item.role === 'owner') {
          item.role = 'member';
          if (item.info) item.info.role = 'member';
        }
      }
    });
    this.groups = [...this.groups];
  }
  changeGroupOwner(groupId: string, newOwner: string) {
    const rootStore = getStore();
    rootStore.client.groupManager
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
    this.groups = this.groups.filter(item => item.groupId !== groupId);
  }

  getBlockList() {
    const rootStore = getStore();
    rootStore.client.contactManager
      .getBlocklist()
      .then(res => {
        runInAction(() => {
          this.blockList = res.map((item: any) => item.userId || item.user || item);
        });
        eventHandler.dispatchSuccess('getBlockList');
      })
      .catch(error => {
        eventHandler.dispatchError('getBlockList', error);
      });
  }

  addUsersToBlocklist(userIdList: string[]) {
    const rootStore = getStore();
    rootStore.client.contactManager
      .addUsersToBlocklist({
        userIds: userIdList,
      })
      .then(res => {
        runInAction(() => {
          this.blockList = [...this.blockList, ...userIdList];
        });

        eventHandler.dispatchSuccess('addUsersToBlocklist');
      })
      .catch(error => {
        eventHandler.dispatchError('addUsersToBlocklist', error);
      });
  }

  removeUserFromBlocklist(userIdList: string[]) {
    const rootStore = getStore();
    rootStore.client.contactManager
      .removeUserFromBlocklist({
        userIds: userIdList,
      })
      .then(res => {
        runInAction(() => {
          this.blockList = this.blockList.filter(item => !userIdList.includes(item));
        });
        eventHandler.dispatchSuccess('removeUserFromBlocklist');
      })
      .catch(error => {
        eventHandler.dispatchError('removeUserFromBlocklist', error);
      });
  }

  publishPresence(description: string) {
    const rootStore = getStore();
    const currentUserId = getCurrentUserId(rootStore.client);
    rootStore.client.presenceManager
      .publishPresence({
        customStatus: description,
      })
      .then(res => {
        runInAction(() => {
          this.appUsersInfo[currentUserId] = {
            ...this.appUsersInfo[currentUserId],
            presenceExt: description,
          };
        });
        eventHandler.dispatchSuccess('publishPresence');
      })
      .catch(error => {
        eventHandler.dispatchError('publishPresence', error);
      });
  }
  clear() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
    this.blockList = [];
  }
}
export default AddressStore;
export { AddressStore };
