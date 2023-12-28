//生成 chatroomMember 组件
import React, { useEffect, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../component/config/index';
import { AppUserInfo } from '../store/index';
import { observer } from 'mobx-react-lite';
import Header, { HeaderProps } from '../header';
import Search from '../../component/input/Search';
import ScrollList from '../../component/scrollList';
import UserItem, { UserItemProps, UserInfoData } from '../../component/userItem';
import { useChatroomMember } from '../hooks/useChatroomMember';
import { RootContext } from '../store/rootContext';
import Tabs from '../../component/tabs';
import Empty from '../empty';
import Icon from '../../component/icon';
import Modal from '../../component/modal';
import { useTranslation } from 'react-i18next';
import { eventHandler } from '../../eventHandler';
import { ChatSDK } from '../SDK';
import { i } from 'vitest/dist/index-2f5b6168';
export interface ChatroomMemberProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  chatroomId: string;
  renderHeader?: (cvs: {
    chatType: 'singleChat' | 'groupChat' | 'chatRoom';
    conversationId: string;
    name?: string;
    unreadCount?: number;
  }) => ReactNode; // 自定义渲染 Header
  headerProps?: {
    avatar: ReactNode;
    onAvatarClick?: () => void; // 点击 Header 中 头像的回调
    moreAction?: HeaderProps['moreAction'];
    onCloseClick?: () => void; // 点击 Header 中 关闭按钮的回调
    content?: ReactNode; // Header 中间的内容
  };

  memberListProps?: {
    search?: boolean;
    placeholder?: string;
    renderEmpty?: () => ReactNode;
    renderItem?: (item: AppUserInfo) => ReactNode;
    UserItemProps?: UserItemProps;
  };

  muteListProps?: {
    search?: boolean;
    placeholder?: string;
    renderEmpty?: () => ReactNode;
    renderItem?: (item: AppUserInfo) => ReactNode;
    UserItemProps?: UserItemProps;
  };
}

const MemberScrollList = ScrollList<AppUserInfo>();

const ChatroomMember = (props: ChatroomMemberProps) => {
  const {
    prefix,
    className,
    style,
    chatroomId,
    headerProps,
    renderHeader,
    memberListProps,
    muteListProps,
  } = props;

  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const globalConfig = features?.chatroomMember;
  const themeMode = theme?.mode || 'light';
  const { addressStore } = rootStore;
  const { getConversationList } = useChatroomMember(chatroomId);
  useEffect(() => {
    if (!rootStore.loginState || !chatroomId) return;
    const chatroomData = addressStore.chatroom.filter(item => item.id === chatroomId)[0];
    if (!chatroomData) {
      rootStore.client
        .getChatRoomDetails({ chatRoomId: chatroomId })
        .then(res => {
          // @ts-ignore TODO: getChatRoomDetails 类型错误 data 是数组
          rootStore.addressStore.setChatroom(res.data as ChatSDK.GetChatRoomDetailsResult);
          getConversationList();
          eventHandler.dispatchSuccess('getChatRoomDetails');
        })
        .catch(err => {
          eventHandler.dispatchError('getChatRoomDetails', err);
        });
    } else {
      getConversationList();
    }
  }, [rootStore.loginState, chatroomId]);

  const chatroomData = addressStore.chatroom.filter(item => item.id === chatroomId)[0] || {};
  const owner = chatroomData.owner || '';
  const appUsersInfo = addressStore.appUsersInfo;
  const membersId = chatroomData.membersId || [];

  const [modalOpen, setModalOpen] = React.useState(false);
  useEffect(() => {
    if (rootStore.loginState && owner == rootStore.client.user && chatroomId) {
      rootStore.addressStore.getChatroomMuteList(chatroomId);
    }
  }, [rootStore.loginState, owner, chatroomId]);

  const membersData = membersId.map(userId => {
    return {
      ...appUsersInfo[userId],
      userId,
    };
  });
  const [waitRemoveUserID, setWaitRemoveUserID] = React.useState('');
  const muteMember = (data: UserInfoData) => {
    addressStore.muteChatRoomMember(chatroomId, data.userId);
  };
  const removeMember = (data: UserInfoData) => {
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
        content: 'mute',
        onClick: muteMember,
      },
      {
        content: 'remove',
        onClick: removeMember,
      },
    ],
  };

  if (globalConfig) {
    allMoreAction.actions = allMoreAction.actions.filter(item => {
      if (item.content == 'mute' && globalConfig?.mute == false) {
        return false;
      }
      if (item.content == 'remove' && globalConfig?.mute == false) {
        return false;
      }
      return true;
    });
  }

  const unmuteMember = (data: UserInfoData) => {
    addressStore.unmuteChatRoomMember(chatroomId, data.userId);
  };
  const mutedMoreAction = {
    visible: owner == rootStore.client.user,
    actions: [
      {
        content: t('unmute'),
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

  const handleAllSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const data = membersData.filter(item => {
      return item.nickname?.includes(e.target.value) || item.userId?.includes(e.target.value);
    });
    setAllDataToRender(data);
    if (e.target.value == '') {
      setAllDataToRender(membersData);
    }
  };

  const renderAllList = () => {
    return membersData.length > 0 ? (
      <div className={`${'cui'}-member-list`} style={{ flex: '1', overflow: 'hidden' }}>
        {(memberListProps?.search == true || typeof memberListProps?.search == 'undefined') && (
          <div style={{ margin: '6px 12px' }}>
            <Search onChange={handleAllSearch} placeholder={memberListProps?.placeholder}></Search>
          </div>
        )}

        <MemberScrollList
          loading={true}
          hasMore={true}
          data={allDataToRender}
          scrollDirection="down"
          loadMoreItems={() => {
            getConversationList();
          }}
          renderItem={
            memberListProps?.renderItem
              ? item => {
                  return memberListProps?.renderItem?.(item);
                }
              : item => {
                  let actionConfig = allMoreAction;
                  if (muteDataToRender?.includes(item.userId)) {
                    actionConfig = {
                      visible: owner == rootStore.client.user,
                      actions: [
                        {
                          content: 'remove',
                          onClick: removeMember,
                        },
                      ],
                    };
                  }
                  return (
                    <UserItem
                      key={item.userId}
                      data={{
                        userId: item.userId,
                        nickname: item.nickname,
                        avatarUrl: item.avatarurl,
                        description: owner == item.userId ? (t('owner') as string) : '',
                      }}
                      moreAction={
                        owner == item.userId ? { visible: false, actions: [] } : actionConfig
                      }
                      {...memberListProps?.UserItemProps}
                    />
                  );
                }
          }
        ></MemberScrollList>
      </div>
    ) : memberListProps?.renderEmpty ? (
      memberListProps?.renderEmpty?.()
    ) : (
      <Empty text="" icon={<Icon type="EMPTY" width={120} height={120}></Icon>}></Empty>
    );
  };

  const handleMutedSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const data = chatroomData?.muteList?.filter(item => {
      const userName = appUsersInfo[item]?.nickname || appUsersInfo[item]?.userId || '';
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
    ) : muteListProps?.renderEmpty ? (
      muteListProps?.renderEmpty?.()
    ) : (
      <Empty text="" icon={<Icon type="EMPTY" width={120} height={120}></Icon>}></Empty>
    );
  };
  const handleClose = () => {
    headerProps?.onCloseClick?.();
  };

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chatroom-member', prefix);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  if (!chatroomId) {
    console.warn('chatroomId is required');
    return null;
  }
  return (
    <div className={classString} style={{ ...style }}>
      {renderHeader ? (
        renderHeader({
          chatType: 'chatRoom',
          conversationId: chatroomId,
        })
      ) : (
        <Header
          close={true}
          content={t('Participants')}
          avatar={<div></div>}
          onClickClose={handleClose}
          {...headerProps}
        ></Header>
      )}

      <div className="chatroom-member-line"></div>
      {owner == rootStore.client.user && globalConfig?.mute != false ? (
        <Tabs
          tabs={[
            {
              label: t('all'),
              key: 'all',
              content: renderAllList(),
            },
            {
              label: t('muted'),
              key: 'muted',
              content: renderMutedList(),
            },
          ]}
        ></Tabs>
      ) : (
        renderAllList()
      )}
      <Modal
        title={t('remove')}
        okText={t('remove')}
        cancelText={t('cancel')}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
        }}
        onOk={handleRemove}
      >
        <div>
          {t('wantToRemove')} {appUsersInfo[waitRemoveUserID]?.nickname || waitRemoveUserID}
        </div>
      </Modal>
    </div>
  );
};

export default observer(ChatroomMember);
