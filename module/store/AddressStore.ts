import { observable, action, makeObservable } from 'mobx';
import { getStore } from './index';
import { AgoraChat } from 'agora-chat';
import { getGroupItemIndexFromGroupsById, getGroupMemberIndexByUserId } from '../../module/utils';
import { getUsersInfo } from '../utils';
import { aC } from 'vitest/dist/types-f302dae9';
export type MemberRole = 'member' | 'owner' | 'admin';

export interface MemberItem {
  userId: AgoraChat.UserId;
  role: MemberRole;
  // @ts-ignore
  attributes?: AgoraChat.MemberAttributes;
}

export interface GroupItem extends AgoraChat.BaseGroupInfo {
  disabled?: boolean;
  info?: AgoraChat.GroupDetailInfo;
  members?: MemberItem[];
  hasMembersNext?: boolean;
  admins?: AgoraChat.UserId[];
}

export type AppUserInfo = Partial<Record<AgoraChat.ConfigurableKey, any>> & {
  userId: string;
  isOnline?: boolean;
  presenceExt?: string;
};

export type ChatroomInfo = AgoraChat.GetChatRoomDetailsResult & {
  members?: {
    [key: string]: AppUserInfo;
  };
  admins?: string[];
  muteList?: string[];
};

class AddressStore {
  appUsersInfo: Record<string, AppUserInfo>;
  contacts: [];
  groups: GroupItem[];
  hasGroupsNext: boolean;
  chatroom: ChatroomInfo[];
  searchList: any;
  thread: {
    [key: string]: AgoraChat.ThreadChangeInfo[];
  };
  constructor() {
    this.appUsersInfo = {};
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    this.thread = {};
    makeObservable(this, {
      appUsersInfo: observable,
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      hasGroupsNext: observable,
      thread: observable,
      setHasGroupsNext: action,
      setContacts: action,
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
      clear: action,
    });
  }

  setAppUserInfo = (appUsersInfo: Record<string, AppUserInfo>) => {
    this.appUsersInfo = appUsersInfo;
  };

  setContacts(contacts: any) {
    this.contacts = contacts;
  }

  setGroups(groups: GroupItem[]) {
    let currentGroupsId = this.groups.map(item => item.groupid);
    let filteredGroups = groups.filter(
      ({ groupid }) => !currentGroupsId.find(id => id === groupid),
    );
    this.groups = [...this.groups, ...filteredGroups];
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

  setGroupMembers(groupId: string, membersList: AgoraChat.GroupMember[]) {
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
      this.groups[idx].members = [...(this.groups[idx].members || []), ...filteredMembers];
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

  setGroupMemberAttributes(
    groupId: string,
    userId: string,
    // @ts-ignore
    attributes: AgoraChat.MemberAttributes,
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
      getUsersInfo({ userIdList: [userId], withPresence: false }).then(() => {
        userInfo = this.appUsersInfo?.[userId];
      });
    }
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
      console.log('找到了', this.chatroom[idx]);
      this.chatroom[idx].muteList = [...muteList];
      console.log('找到了', this.chatroom[idx]);
    }
  };

  muteChatRoomMember = (chatroomId: string, userId: string, muteDuration?: number) => {
    if (!chatroomId || !userId) throw 'chatroomId or userId is empty';
    const rootStore = getStore();
    return rootStore.client
      .muteChatRoomMember({
        chatRoomId: chatroomId,
        username: userId, //message.from as string,
        muteDuration: muteDuration || 60 * 60 * 24 * 30,
      })
      .then(res => {
        console.log('禁言成功', res);
        this.addUserToMuteList(chatroomId, userId);
      });
  };

  getChatroomMuteList = (chatroomId: string) => {
    if (!chatroomId) throw 'chatroomId is empty';
    const rootStore = getStore();
    return rootStore.client.getChatRoomMutelist({ chatRoomId: chatroomId }).then(res => {
      console.log('获取禁言列表成功', res);
      const muteList = res.data?.map(item => item.user) || [];
      this.setChatroomMuteList(chatroomId, muteList);
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
        console.log('取消禁言成功', res);
        this.removeUserFromMuteList(chatroomId, userId);
      });
  };
  removeUserFromMuteList = (chatroomId: string, userId: string) => {
    let idx = this.chatroom.findIndex(item => item.id === chatroomId);
    if (idx > -1) {
      const muteList = this.chatroom[idx].muteList || [];
      this.chatroom[idx].muteList = muteList.filter(item => item !== userId);
    }
  };

  setSearchList(searchList: any) {
    this.searchList = searchList;
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
