import React, { FC, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Header, { HeaderProps } from '../header';
import MessageEditor, { MessageEditorProps } from '../messageEditor';
import { MessageList, MsgListProps } from '../chat/MessageList';
import { RootContext } from '../store/rootContext';
import Empty from '../empty';
import { useTranslation } from 'react-i18next';
import { chatSDK, ChatSDK } from '../SDK';
import ChatroomMessage from '../chatroomMessage';
import { GiftKeyboard } from '../messageEditor/gift';
import Broadcast, { BroadcastProps } from '../../component/broadcast';
import { getUsersInfo } from '../utils/index';
import Modal from '../../component/modal';
import Checkbox from '../../component/checkbox';
import { ChatroomInfo } from '../store/AddressStore';
import { TextMessageType } from 'chatuim2/types/module/types/messageType';
import { eventHandler } from '../../eventHandler';
const reportType = [
  'Unwelcome commercial content or spam',
  'Pornographic or explicit content',
  'Child abuse',
  'Hate speech or graphic violence',
  'Promote terrorism',
  'Harassment or bullying',
  'Suicide or self harm',
  'False information',
  'Others',
];

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
  renderMessageEditor?: () => ReactNode; // 自定义渲染 MessageEditor
  messageEditorProps?: MessageEditorProps;
  messageListProps?: MsgListProps;
  renderBroadcast?: () => ReactNode;
  broadcastProps?: BroadcastProps;
  chatroomId: string;
}

const Chatroom = (props: ChatroomProps) => {
  const { t } = useTranslation();
  const {
    renderEmpty,
    renderHeader,
    headerProps,
    renderMessageEditor,
    messageEditorProps,
    renderMessageList,
    messageListProps,
    renderBroadcast,
    broadcastProps,
    chatroomId,
    prefix,
    className,
    style,
  } = props;
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
      nickName: myInfo?.nickname,
      avatarURL: myInfo?.avatarurl,
      gender: myInfo?.gender,
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

  // config messageEditor
  let messageEditorConfig: MessageEditorProps = {
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
  if (globalConfig?.messageEditor) {
    messageEditorConfig.actions = messageEditorConfig.actions?.filter(item => {
      if (item.name == 'EMOJI' && globalConfig?.messageEditor?.emoji == false) {
        return false;
      }

      if (item.name == 'GIFT' && globalConfig?.messageEditor?.gift == false) {
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
  const [checkedType, setCheckedType] = useState(-1);
  const handleCheckChange = (type: number) => {
    setCheckedType(type);
  };
  const handleReportMessage = () => {
    rootStore.client
      .reportMessage({
        reportType: reportType[checkedType],
        reportReason: reportType[checkedType],
        messageId: reportMessageId,
      })
      .then(() => {
        eventHandler.dispatchSuccess('reportMessage');
        setReportOpen(false);
        setCheckedType(-1);
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
          <Empty text={t('noConversation')}></Empty>
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
          {typeof renderBroadcast == 'function'
            ? renderBroadcast()
            : broadcast.length > 0 && (
                <Broadcast
                  loop={0}
                  delay={1}
                  play={true}
                  onCycleComplete={handleBroadcastFinish}
                  {...broadcastProps}
                >
                  <div>{(broadcast[0] as TextMessageType).msg || ''}</div>
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

          {renderMessageEditor ? (
            renderMessageEditor()
          ) : (
            <MessageEditor
              conversation={{
                chatType: 'chatRoom',
                conversationId: chatroomId,
              }}
              {...messageEditorConfig}
              {...messageEditorProps}
            ></MessageEditor>
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
          {reportType.map((item, index) => {
            return (
              <div className="report-item" key={index}>
                <div>{t(reportType[index])}</div>
                <Checkbox
                  checked={checkedType === index}
                  onChange={() => {
                    handleCheckChange(index);
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
