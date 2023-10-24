import { useContext } from 'react';
import { RootContext } from '../store/rootContext';
import { getUsersInfo } from '../utils';
const pageSize = 20;
let pageNum = 1;
const useChatroomMember = (chatroomId: string) => {
  const rootStore = useContext(RootContext).rootStore;
  const { client } = rootStore;
  let next = true;
  const getConversationList = () => {
    console.log('获取成员');
    client
      .listChatRoomMembers({
        chatRoomId: chatroomId,
        pageSize,
        pageNum: pageNum,
      })
      .then(res => {
        if ((res.data?.length || 0) < pageSize) {
          next = false;
        } else {
          next = true;
          pageNum++;
        }
        const members =
          res.data?.map(item => {
            return item.member || item.owner;
          }) || [];
        const appUserInfo = rootStore.addressStore.appUsersInfo;
        const getInfoMembers = members.filter(user => {
          return !(user in appUserInfo);
        });
        rootStore.addressStore.setChatroomMemberIds(chatroomId, members);
        if (getInfoMembers.length > 0) {
          console.log('去获取个人信息', getInfoMembers);
          getUsersInfo({ userIdList: getInfoMembers });
        }
      })
      .catch(err => {
        console.warn('get member list failed', err);
      });
  };

  return { getConversationList, next };
};

export { useChatroomMember };
