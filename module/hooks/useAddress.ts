import { useCallback, useEffect, useContext, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { getStore } from '../store/index';
import { getGroupItemFromGroupsById } from '../../module/utils';
import { getUsersInfo } from '../utils';

const useContacts = () => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, addressStore } = rootStore;

  let [contacts, setContacts] = useState<Array<{ userId: string; nickname: string }>>([]);
  useEffect(() => {
    rootStore.loginState &&
      client
        .getContacts()
        .then(res => {
          console.log('联系人列表', res);
          const contacts = res.data?.map(userId => ({
            userId: userId,
            nickname: '',
          }));
          setContacts(contacts || []);
        })
        .catch(err => {
          console.log('获取联系人列表失败', err);
        });
  }, [rootStore.loginState]);
  return contacts;
};

const useUserInfo = () => {
  const rootStore = useContext(RootContext).rootStore;
  useEffect(() => {
    let keys = Object.keys(rootStore.addressStore.appUsersInfo);
    let cvsUserIds = rootStore.conversationStore.conversationList
      .filter(item => item.chatType === 'singleChat' && !keys.includes(item.conversationId))
      .map(cvs => cvs.conversationId);

    getUsersInfo(cvsUserIds);
  }, [rootStore.conversationStore.conversationList.length]);
};


const useGroups = () => {
  const pageSize = 0;
  let pageNum = 200;
  const { client, addressStore } = getStore();
  let hasNext = addressStore.hasGroupsNext;

  const getJoinedGroupList = () => {
    if (!hasNext) return;
    client
      .getJoinedGroups({
        pageNum: pageNum,
        pageSize,
      })
      .then(res => {
        res?.data && addressStore.setGroups(res.data as any);
        if ((res.data?.length || 0) === pageSize) {
          pageNum++;
          getJoinedGroupList();
        } else {
          addressStore.setHasGroupsNext(false);
        }
      });
  };

  return {
    getJoinedGroupList,
  };
};

const useGroupMembers = (groupId: string) => {
  const pageSize = 20;
  let pageNum = 1;
  const { client, addressStore } = getStore();
  let groupItem = getGroupItemFromGroupsById(groupId);
  let hasNext = groupItem?.hasMembersNext;
  if (hasNext === undefined) hasNext = true;

  const getGroupMemberList = () => {
    if (!hasNext) return;
    client
      .listGroupMembers({
        groupId,
        pageNum: pageNum,
        pageSize,
      })
      .then(res => {
        res?.data && addressStore.setGroupMembers(groupId, res.data);
        let userIds =
          res.data?.map(item => {
            // @ts-ignore
            return item.owner || item.member;
          }) || [];

        userIds.length && useGroupMembersAttributes(groupId, userIds).getMemberAttributes();
        if ((res.data?.length || 0) === pageSize) {
          pageNum++;
          getGroupMemberList();
        } else {
          addressStore.setGroupItemHasMembersNext(groupId, false);
        }
      });
  };

  return {
    getGroupMemberList,
  };
};

const useGroupMembersAttributes = (
  groupId: string,
  userIds: string[],
  attributesKeys?: string[],
) => {
  const { client, addressStore } = getStore();
  const getMemberAttributes = () => {
    client
      .getGroupMembersAttributes({
        groupId,
        userIds,
        keys: attributesKeys,
      })
      .then(res => {
        if (res.data) {
          Object.keys(res.data).forEach(key => {
            res?.data && addressStore.setGroupMemberAttributes(groupId, key, res.data[key]);
          });
        }
      });
  };

  return {
    getMemberAttributes,
  };
};

export {
  useContacts,
  useGroups,
  useUserInfo,
  useGroupMembers,
  useGroupMembersAttributes,
};
