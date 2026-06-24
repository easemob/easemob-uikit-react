import { useCallback, useEffect, useContext, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { getStore } from '../store/index';
import { getGroupItemFromGroupsById } from '../../module/utils';
import { getUsersInfo } from '../utils';
import { eventHandler } from '../../eventHandler';
const useContacts = () => {
  const rootStore = useContext(RootContext).rootStore;

  const { client, addressStore } = rootStore;

  const [contacts, setContacts] = useState<Array<{ userId: string; nickname: string }>>(
    rootStore.addressStore.contacts,
  );

  useEffect(() => {
    if (rootStore.addressStore.contacts?.length > 0) {
      return;
    }
    rootStore.loginState &&
      Promise.resolve(client.contactManager.getContacts())
        .then(res => {
          const contacts = res?.map(userItem => ({
            userId: userItem.userId,
            nickname: userItem.remark || '',
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
  userList: 'conversation' | 'contacts' | 'blocklist' | null,
  withPresence?: boolean,
) => {
  const rootStore = useContext(RootContext).rootStore;
  useEffect(() => {
    if (!userList) return;
    if (!rootStore.loginState) return;
    const keys = Object.keys(rootStore.addressStore.appUsersInfo);
    const cvsUserIds = rootStore.conversationStore.conversationList
      .filter(item => item.chatType === 'singleChat' && !keys.includes(item.conversationId))
      .map(cvs => cvs.conversationId);
    const contactsUserIds = rootStore.addressStore.contacts
      .filter(item => {
        return !keys.includes(item.userId);
      })
      .map(item => item.userId);
    const blockListUserIds = rootStore.addressStore.blockList.filter(item => !keys.includes(item));

    if (userList === 'blocklist') {
      getUsersInfo({
        userIdList: blockListUserIds,
        withPresence: false,
      }).catch(err => {
        console.warn('get getUsersInfo failed', err);
      });
      return;
    }
    getUsersInfo({
      userIdList: userList == 'conversation' ? cvsUserIds : contactsUserIds,
      withPresence,
    }).catch(err => {
      console.warn('get getUsersInfo failed', err);
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
  const hasNext = addressStore.hasGroupsNext;

  const getJoinedGroupList = () => {
    if (!hasNext) return;
    Promise.resolve(client.groupManager.getJoinedGroupList())
      .then(res => {
        addressStore.setGroups(
          res.map(group => ({
            ...group,
            groupName: group.name,
          })),
        );
        addressStore.setHasGroupsNext(false);
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
  let cursor: string | undefined;
  const { client, addressStore } = getStore();
  const groupItem = getGroupItemFromGroupsById(groupId);
  let hasNext = groupItem?.hasMembersNext;
  if (hasNext === undefined) hasNext = true;

  const getGroupMemberList = () => {
    if (!hasNext) return;
    return client.groupManager
      .getGroupMemberList({
        groupId,
        pageSize,
        cursor,
      })
      .then(res => {
        res?.items && addressStore.setGroupMembers(groupId, res.items as any);
        let userIds =
          res.items?.map(item => {
            return item.user.userId || '';
          }) || [];

        userIds.length && useGroupMembersAttributes(groupId, userIds).getMemberAttributes();
        if (withUserInfo == true) {
          // appUsersInfo 里面有的用户信息不再去获取
          const keys = Object.keys(addressStore.appUsersInfo);
          userIds = userIds.filter(item => !keys.includes(item));
          getUsersInfo({
            userIdList: userIds,
            withPresence: false,
          }).catch(err => {
            console.warn('get getUsersInfo failed', err);
          });
        }

        if (res.hasMore && res.cursor) {
          cursor = res.cursor;
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
      client.groupManager
        .getGroupMembersAttributes({
          groupId,
          userIds: item,
          keys: attributesKeys,
        })
        .then(res => {
          if (res.items) {
            Object.keys(res.items).forEach(key => {
              addressStore.setGroupMemberAttributes(groupId, key, res.items[key]);
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
      client.groupManager
        .getGroupAdminList({
          groupId,
        })
        .then(res => {
          const admins = res.map(item => item.userId);
          addressStore.setGroupAdmins(groupId, admins);
          addressStore.setGroupMembers(
            groupId,
            admins.map(item => {
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
