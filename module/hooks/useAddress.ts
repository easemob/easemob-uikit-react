import { useCallback, useEffect, MutableRefObject, useContext, useState } from 'react';
import AC, { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
import type { ServerCvs } from '../conversation/ConversationList';
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

export interface GroupData {
  //   disabled: 'true' | 'false';
  groupid: string;
  groupname: string;
}

const useUserInfo = (userIds?: string[]) => {
  const rootStore = useContext(RootContext).rootStore;
  const { client, addressStore } = rootStore;

  let [userInfo, setUserInfo] = useState<{
    [key: string]: AgoraChat.UpdateOwnUserInfoParams;
  }>();

  useEffect(() => {
    let userIdsToGet = userIds;

    const cvsUserIds: string[] = [];
    rootStore.conversationStore.conversationList.forEach(item => {
      if (item.chatType === 'singleChat') {
        cvsUserIds.push(item.conversationId);
      }
    });
    if (!userIdsToGet) {
      userIdsToGet = cvsUserIds;
    }
    console.log('pppp', {
      userId: userIdsToGet,
      properties: 'nickname',
    });
    if (userIdsToGet.length == 0) return;
    rootStore.loginState &&
      client
        .fetchUserInfoById(userIdsToGet, 'nickname')
        .then(res => {
          console.log('获取用户属性', res);
          setUserInfo(res.data || {});
        })
        .catch(err => {
          console.log('获取群组列表失败', err);
        });
  }, [rootStore.loginState, rootStore.conversationStore.conversationList.length]);
  return userInfo;
};

const useGroups = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { client, addressStore } = rootStore;

  let [groups, setGroups] = useState<Array<GroupData>>([]);
  useEffect(() => {
    rootStore.loginState &&
      client
        .getJoinedGroups({
          pageNum: 1,
          pageSize: 500,
        })
        .then(res => {
          console.log('群组列表', res);
          setGroups(res.data || []);
        })
        .catch(err => {
          console.log('获取群组列表失败', err);
        });
  }, [rootStore.loginState, rootStore.conversationStore.conversationList.length]);
  return groups;
};

export { useContacts, useGroups, useUserInfo };
