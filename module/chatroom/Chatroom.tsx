import React, { FC, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Header, { HeaderProps } from '../header';
import MessageInput, { MessageInputProps } from '../messageInput';
import { MessageList, MsgListProps } from '../chat/MessageList';
import { RootContext } from '../store/rootContext';
import Empty from '../empty';
import { useTranslation } from 'react-i18next';
import { chatSDK, ChatSDK } from '../SDK';
import ChatroomMessage from '../chatroomMessage';
import { GiftKeyboard } from '../messageInput/gift';
import Broadcast, { BroadcastProps } from '../../component/broadcast';
import { getUsersInfo } from '../utils/index';
import Modal from '../../component/modal';
import Checkbox from '../../component/checkbox';
import { ChatroomInfo } from '../store/AddressStore';
import { TextMessageType } from 'chatuim2/types/module/types/messageType';
import { eventHandler } from '../../eventHandler';

let reportType: Record<string, string> = {
  tag1: 'Unwelcome commercial content',
  tag2: 'Pornographic or explicit content',
  tag3: 'Child abuse',
  tag4: 'Hate speech or graphic violence',
  tag5: 'Promote terrorism',
  tag6: 'Harassment or bullying',
  tag7: 'Suicide or self harm',
  tag8: 'False information',
  tag9: 'Others',
};

export interface ChatroomProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  renderEmpty?: () => ReactNode; // 自定义渲染没有会话时的内容
  renderHeader?: (roomInfo: ChatroomInfo) => ReactNode; // 自定义渲染 Header
  headerProps?: {
    avatar: ReactNode;
    onAvatarClick?: () => void; // 点击 Header 中 头像的回调
    moreAction?: HeaderProps['moreAction'];
  };
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageInput?: () => ReactNode; // 自定义渲染 MessageInput
  messageInputProps?: MessageInputProps;
  messageListProps?: MsgListProps;
  renderBroadcast?: () => ReactNode;
  broadcastProps?: BroadcastProps;
  chatroomId: string;
  reportType?: Record<string, string>; // 自定义举报内容 {'举报类型': "举报原因"}
}

const Chatroom = (props: ChatroomProps) => {
  const { t } = useTranslation();
  const {
    renderEmpty,
    renderHeader,
    headerProps,
    renderMessageInput,
    messageInputProps,
    renderMessageList,
    messageListProps,
    renderBroadcast,
    broadcastProps,
    chatroomId,
    prefix,
    className,
    style,
    reportType: reportTypeProps,
  } = props;
  if (reportTypeProps) {
    reportType = reportTypeProps;
  }
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const globalConfig = features?.chatroom;
  const themeMode = theme?.mode || 'light';

  const [isEmpty, setIsEmpty] = useState(false);

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chatroom', prefix);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const sendJoinedNoticeMessage = () => {
    const myInfo = rootStore.addressStore.appUsersInfo[rootStore.client.user] || {};
    const chatroom_uikit_userInfo = {
      userId: myInfo?.userId,
      nickname: myInfo?.nickname,
      avatarURL: myInfo?.avatarurl,
      gender: Number(myInfo?.gender),
      identify: myInfo?.ext?.identify,
    };

    const options = {
      type: 'custom',
      to: chatroomId,
      chatType: 'chatRoom',
      customEvent: 'CHATROOMUIKITUSERJOIN',
      customExts: {},
      ext: {
        chatroom_uikit_userInfo,
      },
    } as ChatSDK.CreateCustomMsgParameters;
    const customMsg = chatSDK.message.create(options);
    rootStore.messageStore.sendMessage(customMsg);
  };

  useEffect(() => {
    if (!rootStore.loginState) return;
    if (!chatroomId) {
      setIsEmpty(true);
      return;
    }
    setIsEmpty(false);
    rootStore.client
      .getChatRoomDetails({ chatRoomId: chatroomId })
      .then(res => {
        // @ts-ignore TODO: getChatRoomDetails 类型错误 data 是数组
        rootStore.addressStore.setChatroom(res.data as ChatSDK.GetChatRoomDetailsResult);
        // @ts-ignore
        const owner = res.data?.[0]?.owner;
        if (owner == rootStore.client.user) {
          rootStore.addressStore.getChatroomMuteList(chatroomId);
        }
        eventHandler.dispatchSuccess('getChatRoomDetails');
      })
      .catch(err => {
        eventHandler.dispatchError('getChatRoomDetails', err);
      });

    //   rootStore.conversationStore.setCurrentCvs(chatroomId);
    rootStore.client
      .joinChatRoom({ roomId: chatroomId })
      .then(() => {
        eventHandler.dispatchSuccess('joinChatRoom');
        getUsersInfo({
          userIdList: [rootStore.client.user],
          withPresence: false,
        })
          ?.then(() => {
            sendJoinedNoticeMessage();
            eventHandler.dispatchSuccess('fetchUserInfoById');
          })
          .catch(error => {
            eventHandler.dispatchError('fetchUserInfoById', error);
          });

        // rootStore.client
        //   .getChatRoomAdmin({ chatRoomId: chatroomId })
        //   .then(res => {
        //     console.log('聊天室管理员', res);
        //     rootStore.addressStore.setChatroomAdmins(chatroomId, res.data || []);
        //   })
      })
      .catch((err: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('joinChatRoom', err);
      });

    return () => {
      rootStore.client
        .leaveChatRoom({
          roomId: chatroomId,
        })
        .then(() => {
          eventHandler.dispatchSuccess('leaveChatRoom');
        })
        .catch(err => {
          eventHandler.dispatchError('leaveChatRoom', err);
        });
    };
  }, [chatroomId, rootStore.loginState]);

  // config messageInput
  let messageInputConfig: MessageInputProps = {
    actions: [
      {
        name: 'TEXTAREA',
        visible: true,
      },
      {
        name: 'EMOJI',
        visible: true,
      },
      {
        name: 'GIFT',
        visible: true,
        icon: (
          <GiftKeyboard
            conversation={{
              chatType: 'chatRoom',
              conversationId: chatroomId,
            }}
          ></GiftKeyboard>
        ),
      },
      {
        name: 'MORE',
        visible: false,
      },
    ],
  };
  if (globalConfig?.messageInput) {
    messageInputConfig.actions = messageInputConfig.actions?.filter(item => {
      if (item.name == 'EMOJI' && globalConfig?.messageInput?.emoji == false) {
        return false;
      }

      if (item.name == 'GIFT' && globalConfig?.messageInput?.gift == false) {
        return false;
      }

      return true;
    });
  }

  const chatroomData =
    rootStore.addressStore.chatroom.filter(item => item.id === chatroomId)[0] || {};
  const appUsersInfo = rootStore.addressStore.appUsersInfo;
  const broadcast = rootStore.messageStore.message.broadcast;
  const [reportMessageId, setReportMessageId] = useState('');
  const handleReport = (message: any) => {
    setReportOpen(true);
    setReportMessageId(message.mid || message.id);
  };
  const renderChatroomMessage = (msg: any) => {
    if (msg.type == 'txt' || msg.type == 'custom') {
      return <ChatroomMessage message={msg} key={msg.mid || msg.id} onReport={handleReport} />;
    }
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [checkedType, setCheckedType] = useState('');
  const handleCheckChange = (type: string) => {
    setCheckedType(type);
  };
  const handleReportMessage = () => {
    rootStore.client
      .reportMessage({
        reportType: checkedType,
        reportReason: reportType[checkedType],
        messageId: reportMessageId,
      })
      .then(() => {
        eventHandler.dispatchSuccess('reportMessage');
        setReportOpen(false);
        setCheckedType('');
      })
      .catch(err => {
        eventHandler.dispatchError('reportMessage', err);
      });
  };

  const handleBroadcastFinish = () => {
    rootStore.messageStore.shiftBroadcastMessage();
  };
  return (
    <div className={classString} style={{ ...style }}>
      {isEmpty ? (
        renderEmpty ? (
          renderEmpty()
        ) : (
          <Empty text={t('Enter chatroom to start chatting')}></Empty>
        )
      ) : (
        <>
          {renderHeader ? (
            renderHeader(chatroomData)
          ) : (
            <Header
              avatarSrc={appUsersInfo[chatroomData.owner]?.avatarurl}
              content={chatroomData.name || chatroomId}
              subtitle={appUsersInfo[chatroomData.owner]?.nickname || chatroomData.owner}
              suffixIcon={
                <Icon
                  type="PERSON_DOUBLE_FILL"
                  onClick={() => {}}
                  color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                ></Icon>
              }
              {...headerProps}
            ></Header>
          )}
          <p></p>

          <div style={{ position: 'relative', flex: '1', overflow: 'hidden', display: 'flex' }}>
            {typeof renderBroadcast == 'function'
              ? renderBroadcast()
              : broadcast.length > 0 && (
                  <Broadcast
                    loop={0}
                    delay={1}
                    play={true}
                    onCycleComplete={handleBroadcastFinish}
                    style={{
                      position: 'absolute',
                      width: 'calc(100% - 24px)',
                      zIndex: 9,
                      margin: '12px',
                    }}
                    {...broadcastProps}
                  >
                    <div>{(broadcast[0] as TextMessageType)?.msg || ''}</div>
                  </Broadcast>
                )}
            {renderMessageList ? (
              renderMessageList()
            ) : (
              <MessageList
                renderMessage={renderChatroomMessage}
                conversation={{
                  chatType: 'chatRoom',
                  conversationId: chatroomId,
                }}
                {...messageListProps}
              ></MessageList>
            )}
          </div>

          {renderMessageInput ? (
            renderMessageInput()
          ) : (
            <MessageInput
              placeHolder={t("Let's Chat") as string}
              conversation={{
                chatType: 'chatRoom',
                conversationId: chatroomId,
              }}
              {...messageInputConfig}
              {...messageInputProps}
            ></MessageInput>
          )}
        </>
      )}
      <Modal
        open={reportOpen}
        title={t('report')}
        okText={t('report')}
        cancelText={t('cancel')}
        onOk={handleReportMessage}
        onCancel={() => {
          setReportOpen(false);
        }}
      >
        <div>
          {Object.keys(reportType).map((item, index) => {
            return (
              <div className="report-item" key={index}>
                <div>{t(reportType[item] as string)}</div>
                <Checkbox
                  checked={checkedType === item}
                  onChange={() => {
                    handleCheckChange(item);
                  }}
                ></Checkbox>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

export default observer(Chatroom);
