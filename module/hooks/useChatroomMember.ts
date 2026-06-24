import { useContext, useRef } from 'react';
import { RootContext } from '../store/rootContext';
import { getUsersInfo } from '../utils';
import { runInAction } from 'mobx';
const pageSize = 20;
const useChatroomMember = (chatroomId: string) => {
  const rootStore = useContext(RootContext).rootStore;
  const { client } = rootStore;
  const nextRef = useRef(true);
  const cursorRef = useRef('');
  const getChatroomMembers = () => {
    client.chatRoomManager
      .getMemberList({
        chatRoomId: chatroomId,
        pageSize,
        cursor: cursorRef.current,
      })
      .then(res => {
        nextRef.current = Boolean(res.hasMore);
        cursorRef.current = res.cursor || '';
        const members = res.items?.map(item => item.user.userId).filter(Boolean) || [];
        const appUserInfo = rootStore.addressStore.appUsersInfo;
        const getInfoMembers = members.filter(user => {
          return !(user in appUserInfo);
        });
        rootStore.addressStore.setChatroomMemberIds(chatroomId, members);
        rootStore.addressStore.updateChatroomMemberCount(chatroomId, members.length);

        if (getInfoMembers.length > 0) {
          getUsersInfo({ userIdList: getInfoMembers, withPresence: false }).catch(err => {
            console.warn('get getUsersInfo failed', err);
          });
        }
      })
      .catch(err => {
        console.warn('get member list failed', err);
      });
  };

  return { getChatroomMembers, next: nextRef.current };
};

const clearPageNum = () => {};
export { useChatroomMember, clearPageNum };
