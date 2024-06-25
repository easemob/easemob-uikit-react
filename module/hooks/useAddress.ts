import { useCallback, useEffect, useContext, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { getStore } from '../store/index';
import { getGroupItemFromGroupsById } from '../../module/utils';
import { getUsersInfo } from '../utils';
import { ChatSDK } from 'module/SDK';
import { eventHandler } from '../../eventHandler';
const useContacts = () => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, addressStore } = rootStore;

  let [contacts, setContacts] = useState<Array<{ userId: string; nickname: string }>>(
    rootStore.addressStore.contacts,
  );

  useEffect(() => {
    if (rootStore.addressStore.contacts?.length > 0) {
      return;
    }
    rootStore.loginState &&
      client
        .getAllContacts()
        .then((res: ChatSDK.AsyncResult<ChatSDK.ContactItem[]>) => {
          const contacts = res.data?.map(userItem => ({
            userId: userItem.userId,
            nickname: '',
            remark: userItem.remark,
          }));
          setContacts(contacts || []);
          addressStore.setContacts(contacts);
          eventHandler.dispatchSuccess('getAllContacts');
        })
        .catch(err => {
          console.warn('get contacts failed', err);
          eventHandler.dispatchError('getAllContacts', err);
        });
  }, [rootStore.loginState]);
  return contacts;
};

const useUserInfo = (
  userList: 'conversation' | 'contacts' | 'blocklist',
  withPresence?: boolean,
) => {
  const rootStore = useContext(RootContext).rootStore;
  useEffect(() => {
    if (!rootStore.loginState) return;
    let keys = Object.keys(rootStore.addressStore.appUsersInfo);
    let cvsUserIds = rootStore.conversationStore.conversationList
      .filter(item => item.chatType === 'singleChat' && !keys.includes(item.conversationId))
      .map(cvs => cvs.conversationId);
    let contactsUserIds = rootStore.addressStore.contacts
      .filter(item => {
        return !keys.includes(item.userId);
      })
      .map(item => item.userId);
    let blockListUserIds = rootStore.addressStore.blockList.filter(item => !keys.includes(item));

    if (userList === 'blocklist') {
      getUsersInfo({
        userIdList: blockListUserIds,
        withPresence: false,
      });
      return;
    }
    getUsersInfo({
      userIdList: userList == 'conversation' ? cvsUserIds : contactsUserIds,
      withPresence,
    });
  }, [
    rootStore.conversationStore.conversationList.length,
    rootStore.addressStore.contacts.length,
    rootStore.addressStore.blockList.length,
    rootStore.loginState,
  ]);
};

const useGroups = () => {
  const pageSize = 200;
  let pageNum = 1;
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
        eventHandler.dispatchSuccess('getJoinedGroups');
      })
      .catch(error => {
        eventHandler.dispatchError('getJoinedGroups', error);
      });
  };

  return {
    getJoinedGroupList,
  };
};

const useGroupMembers = (groupId: string, withUserInfo: boolean) => {
  if (!groupId) return {};
  const pageSize = 20;
  let pageNum = 1;
  const { client, addressStore } = getStore();
  let groupItem = getGroupItemFromGroupsById(groupId);
  let hasNext = groupItem?.hasMembersNext;
  if (hasNext === undefined) hasNext = true;

  const getGroupMemberList = () => {
    if (!hasNext) return;
    return client
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
        if (withUserInfo == true) {
          // appUsersInfo 里面有的用户信息不再去获取
          let keys = Object.keys(addressStore.appUsersInfo);
          userIds = userIds.filter(item => !keys.includes(item));
          getUsersInfo({
            userIdList: userIds,
            withPresence: false,
          });
        }

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
    let groupUserIds = [];
    if (userIds.length > 10) {
      // 如果用户数量大于10，分组，每组10个userId去调用getMemberAttributes
      for (let i = 0; i < userIds.length; i += 10) {
        groupUserIds.push(userIds.slice(i, i + 10));
      }
    } else {
      groupUserIds = [userIds];
    }

    groupUserIds.forEach(item => {
      client
        .getGroupMembersAttributes({
          groupId,
          userIds: item,
          keys: attributesKeys,
        })
        .then(res => {
          if (res.data) {
            Object.keys(res.data).forEach(key => {
              res?.data && addressStore.setGroupMemberAttributes(groupId, key, res.data[key]);
            });
          }
        });
    });
    // client
    //   .getGroupMembersAttributes({
    //     groupId,
    //     userIds,
    //     keys: attributesKeys,
    //   })
    //   .then(res => {
    //     if (res.data) {
    //       Object.keys(res.data).forEach(key => {
    //         res?.data && addressStore.setGroupMemberAttributes(groupId, key, res.data[key]);
    //       });
    //     }
    //   });
  };

  return {
    getMemberAttributes,
  };
};

const useGroupAdmins = (groupId: string) => {
  const { client, addressStore } = getStore();
  const groupItem = getGroupItemFromGroupsById(groupId);
  const getGroupAdmins = () => {
    if (!groupItem?.admins) {
      client
        .getGroupAdmin({
          groupId,
        })
        .then(res => {
          addressStore.setGroupAdmins(groupId, res.data || []);
          addressStore.setGroupMembers(
            groupId,
            (res.data || []).map(item => {
              return {
                member: item,
              };
            }),
          );
        });
    }
  };

  return { getGroupAdmins };
};

export {
  useContacts,
  useGroups,
  useUserInfo,
  useGroupMembers,
  useGroupAdmins,
  useGroupMembersAttributes,
};
