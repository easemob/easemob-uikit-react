//生成 chatroomMember 组件
import React, { useEffect, useContext } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../component/config/index';
import Avatar from '../../component/avatar';
import { AppUserInfo, getStore } from '../store/index';
import { observer } from 'mobx-react-lite';
import { getUsersInfo } from '../utils/index';
import Button from '../../component/button';
import Header from '../header';
import Search from '../../component/input/Search';
import ScrollList from '../../component/scrollList';
import { ConversationItem } from '../conversation/ConversationItem';
import UserItem, { UserInfoData } from '../../component/userItem';
import { useChatroomMember } from '../hooks/useChatroomMember';
import { RootContext } from '../store/rootContext';
import Tabs from '../../component/tabs';
import Empty from '../empty';
import Icon from '../../component/icon';
import Modal from '../../component/modal';
const mockData = [];
for (let i = 0; i < 50; i++) {
  mockData.push({
    userId: 'zd' + i,
    nickname: 'zd' + i,
  });
}

export interface ChatroomMemberProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  chatroomId: string;
}

const MemberScrollList = ScrollList<AppUserInfo>();

const ChatroomMember = (props: ChatroomMemberProps) => {
  const { prefix, className, style, chatroomId } = props;
  if (!chatroomId) throw new Error('chatroomId is required');
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { addressStore } = rootStore;
  const { getConversationList } = useChatroomMember(chatroomId);
  useEffect(() => {
    if (!rootStore.loginState) return;
    const chatroomData = addressStore.chatroom.filter(item => item.id === chatroomId)[0];
    if (!chatroomData) {
      rootStore.client.getChatRoomDetails({ chatRoomId: chatroomId }).then(res => {
        console.log('聊天室详情', res);
        // @ts-ignore TODO: getChatRoomDetails 类型错误 data 是数组
        rootStore.addressStore.setChatroom(res.data as AgoraChat.GetChatRoomDetailsResult);
        getConversationList();
      });
    } else {
      getConversationList();
    }
  }, [rootStore.loginState]);

  const chatroomData = addressStore.chatroom.filter(item => item.id === chatroomId)[0] || {};
  const owner = chatroomData.owner || '';
  console.log('-----chatroomData', chatroomData);
  const appUsersInfo = addressStore.appUsersInfo;
  const membersId = chatroomData.membersId || [];
  console.log('-----membersId', membersId);

  const [modalOpen, setModalOpen] = React.useState(false);
  useEffect(() => {
    if (rootStore.loginState && owner == rootStore.client.user) {
      rootStore.addressStore.getChatroomMuteList(chatroomId);
    }
  }, [rootStore.loginState, owner]);

  const membersData = membersId.map(userId => {
    return {
      ...appUsersInfo[userId],
      userId,
    };
  });
  console.log('-----membersData', membersData);
  const [waitRemoveUserID, setWaitRemoveUserID] = React.useState('');
  const muteMember = (data: UserInfoData) => {
    console.log(data);
    addressStore.muteChatRoomMember(chatroomId, data.userId);
  };
  const removeMember = (data: UserInfoData) => {
    console.log(data);
    setWaitRemoveUserID(data.userId);
    setModalOpen(true);
  };
  const handleRemove = () => {
    addressStore.removerChatroomMember(chatroomId, waitRemoveUserID);
    setModalOpen(false);
  };
  const allMoreAction = {
    visible: owner == rootStore.client.user,
    actions: [
      {
        content: 'Mute',
        onClick: muteMember,
      },
      {
        content: 'Remove',
        onClick: removeMember,
      },
    ],
  };

  const unmuteMember = (data: UserInfoData) => {
    console.log(data);
    addressStore.unmuteChatRoomMember(chatroomId, data.userId);
  };
  const mutedMoreAction = {
    visible: owner == rootStore.client.user,
    actions: [
      {
        content: 'Unmute',
        onClick: unmuteMember,
      },
    ],
  };

  //   let allDataToRender = membersData
  const [allDataToRender, setAllDataToRender] = React.useState(membersData);
  const [muteDataToRender, setMuteDataToRender] = React.useState(chatroomData?.muteList);
  useEffect(() => {
    setAllDataToRender(membersData);
  }, [membersData.length, Object.keys(appUsersInfo).length]);

  useEffect(() => {
    setMuteDataToRender(chatroomData?.muteList);
  }, [chatroomData?.muteList?.length]);

  const handleAllSearch = e => {
    console.log(e.target.value);
    const data = membersData.filter(item => {
      return item.nickname.includes(e.target.value);
    });
    setAllDataToRender(data);
    if (e.target.value == '') {
      setAllDataToRender(membersData);
    }
  };

  const renderAllList = () => {
    return membersData.length > 0 ? (
      <div className={`${'cui'}-member-list`} style={{ flex: '1', overflow: 'hidden' }}>
        <div style={{ margin: '6px 12px' }}>
          <Search onChange={handleAllSearch}></Search>
        </div>

        <MemberScrollList
          //   loading={true}
          hasMore={true}
          data={allDataToRender}
          scrollDirection="down"
          loadMoreItems={() => {
            console.log('加载更多');
            getConversationList();
          }}
          renderItem={item => {
            return (
              <UserItem
                key={item.userId}
                data={{
                  userId: item.userId,
                  nickname: item.nickname,
                  avatarUrl: item.avatarurl,
                  description: owner == item.userId ? 'owner' : '',
                }}
                moreAction={owner == item.userId ? { visible: false, actions: [] } : allMoreAction}
              />
            );
          }}
        ></MemberScrollList>
      </div>
    ) : (
      <Empty text="" icon={<Icon type="EMPTY" width={120} height={120}></Icon>}></Empty>
    );
  };

  const handleMutedSearch = e => {
    console.log(e.target.value);
    const data = chatroomData?.muteList?.filter(item => {
      const userName = appUsersInfo[item]?.nickname || '';
      return userName.includes(e.target.value);
    });
    setMuteDataToRender(data || []);
    if (e.target.value == '') {
      setMuteDataToRender(chatroomData?.muteList);
    }
  };

  const renderMutedList = () => {
    return (chatroomData?.muteList?.length || 0) > 0 ? (
      <div className={`${'cui'}-member-list`} style={{ flex: '1', overflow: 'hidden' }}>
        <div style={{ margin: '6px 12px' }}>
          <Search onChange={handleMutedSearch}></Search>
        </div>

        {muteDataToRender?.map(userId => {
          return (
            <UserItem
              key={userId}
              moreAction={mutedMoreAction}
              data={{
                userId: userId,
                nickname: appUsersInfo[userId]?.nickname,
                avatarUrl: appUsersInfo[userId]?.avatarurl,
              }}
            />
          );
        })}
      </div>
    ) : (
      <Empty text="" icon={<Icon type="EMPTY" width={120} height={120}></Icon>}></Empty>
    );
  };
  const handleClose = () => {};

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chatroom-member', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  return (
    <div className={classString} style={{ ...style }}>
      <Header
        close={true}
        content="Participants"
        avatar={<div></div>}
        onClickClose={handleClose}
      ></Header>
      <div className="chatroom-member-line"></div>
      {owner == rootStore.client.user ? (
        <Tabs
          tabs={[
            {
              label: 'ALL',
              key: 'all',
              content: renderAllList(),
            },
            {
              label: 'MUTED',
              key: 'muted',
              content: renderMutedList(),
            },
          ]}
        ></Tabs>
      ) : (
        renderAllList()
      )}
      <Modal
        title="Remove"
        okText="Remove"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
        }}
        onOk={handleRemove}
      >
        <div>Want to remove {appUsersInfo[waitRemoveUserID]?.nickname || waitRemoveUserID}</div>
      </Modal>
    </div>
  );
};

export default observer(ChatroomMember);
