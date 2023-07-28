import { observable, action, makeObservable } from 'mobx';
import { getStore } from './index';
import { AgoraChat } from 'agora-chat';
import { useGroupMembersAttributes } from '../hooks/useAddress';
import { getGroupItemIndexFromGroupsById, getGroupMemberIndexByUserId } from '../../module/utils';

export type MemberRole = 'member' | 'owner';

export interface MemberItem {
  userId: AgoraChat.UserId;
  role: MemberRole;
  attributes?: AgoraChat.MemberAttributes;
}

export interface GroupItem extends AgoraChat.BaseGroupInfo {
  disabled?: boolean;
  info?: AgoraChat.GroupDetailInfo;
  members?: MemberItem[];
  hasMembersNext?: boolean;
}

class AddressStore {
  contacts: [];
  groups: GroupItem[];
  hasGroupsNext: boolean;
  chatroom: any;
  searchList: any;
  constructor() {
    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.hasGroupsNext = true;
    this.searchList = [];
    makeObservable(this, {
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      setHasGroupsNext: action,
      setContacts: action,
      setGroups: action,
      setGroupMembers: action,
      setChatroom: action,
    });
  }

  getGroupMembers({
    groupId,
    pageNum = 1,
    pageSize = 20,
  }: {
    groupId: string;
    pageNum: number;
    pageSize: number;
  }) {
    const { client } = getStore();
    client
      .listGroupMembers({
        groupId,
        pageNum,
        pageSize,
      })
      .then(res => {});
  }

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
            role: member?.owner ? 'owner' : 'member',
          };
        });
      this.groups[idx].members = [...(this.groups[idx].members || []), ...filteredMembers];
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
    attributes: AgoraChat.MemberAttributes,
  ) {
    let groupIdx = getGroupItemIndexFromGroupsById(groupId);
    let idx = getGroupMemberIndexByUserId(this.groups[groupIdx], userId) || -1;
    if (idx > -1) {
      let memberList = this.groups[groupIdx].members || [];
      memberList[idx].attributes = attributes;
    }
  }

  setChatroom(chatroom: any) {
    this.chatroom = chatroom;
  }

  setSearchList(searchList: any) {
    this.searchList = searchList;
  }
}

export default AddressStore;
