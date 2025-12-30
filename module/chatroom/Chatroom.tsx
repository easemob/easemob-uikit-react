import React, { FC, useEffect, useRef, useState, useContext, ReactNode, useMemo } from 'react';
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
import ChatroomMessage, { ChatroomMessageActionConfig } from '../chatroomMessage';
import { GiftKeyboard } from '../messageInput/gift';
import Broadcast, { BroadcastProps } from '../../component/broadcast';
import { getUsersInfo } from '../utils/index';
import Modal from '../../component/modal';
import Checkbox from '../../component/checkbox';
import { ChatroomInfo } from '../store/AddressStore';
import type { TextMessageType } from '../types/messageType';
import { eventHandler } from '../../eventHandler';
import PinnedTextMessage from '../pinnedTextMessage';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import { MessageRenderer, MessageRenderContext } from '../chat/MessageList';

export let reportType: Record<string, string> = {
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
    onClickMember?: () => void;
  };
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageInput?: () => ReactNode; // 自定义渲染 MessageInput
  messageInputProps?: MessageInputProps;
  messageListProps?: MsgListProps;
  renderBroadcast?: () => ReactNode;
  broadcastProps?: BroadcastProps;
  chatroomId: string;
  reportType?: Record<string, string>; // 自定义举报内容 {'举报类型': "举报原因"}
  messageActionConfig?: ChatroomMessageActionConfig; // 消息操作菜单配置
  customMessageRenderers?: {
    txt?: MessageRenderer; // 自定义文本消息渲染
    custom?: MessageRenderer; // 自定义 custom 消息渲染（包括加入消息和礼物消息）
  };
  showUnreadCount?: boolean; // 消息列表不在最下面时，是否显示未读数 默认不显示
}

let Chatroom = (props: ChatroomProps) => {
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
    messageActionConfig,
    customMessageRenderers,
    showUnreadCount,
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

  const { pinMessage, unpinMessage, clearPinnedMessages, getPinnedMessages, list } =
    usePinnedMessage({
      conversation: {
        conversationType: 'chatRoom',
        conversationId: chatroomId,
      },
    });

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
        // 加入之后再获取详情， 防止获取到的人数没有包含自己
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

        getPinnedMessages();
      })
      .catch((err: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('joinChatRoom', err);
      });

    if (showUnreadCount) {
      rootStore.messageStore.setCurrentCVS({
        chatType: 'chatRoom',
        conversationId: chatroomId,
      });
    }

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
  const messageInputConfig: MessageInputProps = {
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

  // 使用 useMemo 创建默认的聊天室消息渲染器
  const defaultChatroomRenderers = useMemo<{
    txt?: MessageRenderer;
    custom?: MessageRenderer;
  }>(() => {
    return {
      txt: (ctx: MessageRenderContext) => {
        const msg = ctx.message as ChatSDK.TextMsgBody;
        return (
          <ChatroomMessage
            message={msg}
            // @ts-ignore
            key={msg.mid || msg.id}
            onReport={handleReport}
            actionConfig={messageActionConfig}
          />
        );
      },
      custom: (ctx: MessageRenderContext) => {
        const msg = ctx.message as ChatSDK.CustomMsgBody;
        return (
          <ChatroomMessage
            message={msg}
            // @ts-ignore
            key={msg.mid || msg.id}
            onReport={handleReport}
            actionConfig={messageActionConfig}
          />
        );
      },
    };
  }, [messageActionConfig]);

  // 合并默认渲染器和用户自定义渲染器
  const finalChatroomRenderers = useMemo(() => {
    return {
      ...defaultChatroomRenderers,
      ...customMessageRenderers,
    };
  }, [defaultChatroomRenderers, customMessageRenderers]);

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
  const pinnedMessages = rootStore.pinnedMessagesStore.messages.chatRoom[chatroomId]?.list || [];

  const formatNumber = (num: number) => {
    if (num === undefined || num === null) {
      return '0';
    }

    if (num < 1000) {
      return num.toString();
    }
    return (num / 1000).toFixed(1) + 'k';
  };
  const memberCount = formatNumber(chatroomData.affiliations_count);

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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Icon
                    type="PERSON_DOUBLE_FILL"
                    onClick={headerProps?.onClickMember || (() => {})}
                    width={24}
                    height={24}
                    color={themeMode == 'dark' ? '#C8CDD0' : '#464E53'}
                  ></Icon>
                  {Number(memberCount) > 0 && (
                    <span className={`${prefixCls}-header-count`}>{memberCount}</span>
                  )}
                </div>
              }
              {...headerProps}
            ></Header>
          )}
          <p></p>

          <div
            style={{
              position: 'relative',
              flex: '1',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ position: 'absolute', width: '100%' }}>
              {pinnedMessages.length > 0 && (
                <PinnedTextMessage
                  message={pinnedMessages[0]}
                  style={{
                    margin: '12px',
                    position: 'relative',
                    zIndex: 9,
                    width: 'calc(100% - 24px)',
                  }}
                ></PinnedTextMessage>
              )}
              {typeof renderBroadcast == 'function'
                ? renderBroadcast()
                : broadcast.length > 0 && (
                    <Broadcast
                      loop={0}
                      delay={1}
                      play={true}
                      onCycleComplete={handleBroadcastFinish}
                      style={{
                        position: 'relative',
                        width: 'calc(100% - 24px)',
                        zIndex: 9,
                        margin: '12px',
                      }}
                      {...broadcastProps}
                    >
                      <div>{(broadcast[0] as TextMessageType)?.msg || ''}</div>
                    </Broadcast>
                  )}
            </div>
            {renderMessageList ? (
              renderMessageList()
            ) : (
              <MessageList
                customRenderers={finalChatroomRenderers}
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
              <div
                className={classNames('report-item', {
                  'report-item-dark': themeMode == 'dark',
                })}
                key={index}
                onClick={() => {
                  handleCheckChange(item);
                }}
              >
                <div>{t(reportType[item] as string)}</div>
                <Checkbox
                  checked={checkedType === item}
                  // onChange={() => {
                  //   handleCheckChange(item);
                  // }}
                ></Checkbox>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

Chatroom = observer(Chatroom);
export { Chatroom };
