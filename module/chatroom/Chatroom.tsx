import React, { FC, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import MessageEditor, { MessageEditorProps } from '../messageEditor';
import { MessageList, MsgListProps } from '../chat/MessageList';
import { RootContext } from '../store/rootContext';
import Empty from '../empty';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from 'module/store/ConversationStore';
import { AgoraChat } from 'agora-chat';
import { getConversationTime, getCvsIdFromMessage, getMsgSenderNickname } from '../utils/index';
import ChatroomMessage from '../chatroomMessage';
import { GiftKeyboard } from '../messageEditor/gift';
import Broadcast from '../../component/broadcast';
import { getUsersInfo } from '../utils/index';
import Modal from '../../component/modal';
import { set } from 'mobx';
import Checkbox from '../../component/checkbox';
import { m } from 'vitest/dist/index-2f5b6168';
export interface ChatroomProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  renderEmpty?: () => ReactNode; // 自定义渲染没有会话时的内容
  renderHeader?: (cvs: {
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    name?: string;
    unreadCount?: number;
  }) => ReactNode; // 自定义渲染 Header
  headerProps?: {
    avatar: ReactNode;
    onAvatarClick?: () => void; // 点击 Header 中 头像的回调
    moreAction?: HeaderProps['moreAction'];
  };
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageEditor?: () => ReactNode; // 自定义渲染 MessageEditor
  messageEditorProps?: MessageEditorProps;
  messageListProps?: MsgListProps;
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
    chatroomId = '228706458075137',
    prefix,
    className,
    style,
  } = props;
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  console.log('theme', context);
  const themeMode = theme?.mode || 'light';
  // const chatroomId = '225555145359361';
  // const chatroomId = '228706458075137';
  const [isEmpty, setIsEmpty] = useState(false);
  // const classString = classNames()  'chatroom-container';

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chatroom', prefix);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  useEffect(() => {
    window.rootStore = rootStore;
    if (!rootStore.loginState) return;
    if (!chatroomId) {
      setIsEmpty(true);
      return;
    }
    // rootStore.client.getChatRooms({ pagenum: 1, pagesize: 20 }).then(res => {
    //   console.log('getChatRooms', res);
    // });

    rootStore.client.getChatRoomDetails({ chatRoomId: chatroomId }).then(res => {
      console.log('聊天室详情', res);
      // @ts-ignore TODO: getChatRoomDetails 类型错误 data 是数组
      rootStore.addressStore.setChatroom(res.data as AgoraChat.GetChatRoomDetailsResult);
    });

    if (chatroomId) {
      //   rootStore.conversationStore.setCurrentCvs(chatroomId);
      rootStore.client
        .joinChatRoom({ roomId: chatroomId })
        .then(() => {
          console.log('join chatroom success');
          rootStore.client.getChatRoomAdmin({ chatRoomId: chatroomId }).then(res => {
            console.log('聊天室管理员', res);
            rootStore.addressStore.setChatroomAdmins(chatroomId, res.data || []);
          });
        })
        .catch(err => {
          console.log('join chatroom fail', err);
        });

      rootStore.addressStore.getChatroomMuteList(chatroomId);
    }

    if (rootStore.loginState) {
      getUsersInfo({
        userIdList: [rootStore.client.user],
      });

      rootStore.client;
    }
  }, [chatroomId, rootStore.loginState]);

  // config messageEditor
  let messageEditorConfig: MessageEditorProps = {
    enabledTyping: true,
    enabledMention: true,
    actions: [
      {
        name: 'GIFT',
        visible: true,
      },
      {
        name: 'TEXTAREA',
        visible: true,
      },
      {
        name: 'EMOJI',
        visible: true,
      },
      {
        name: 'MORE',
        visible: false,
      },
    ],
    customActions: [
      {
        content: 'IMAGE',
      },
      {
        content: 'FILE',
      },
    ],
  };
  //   if (globalConfig?.messageEditor) {
  //     if (globalConfig?.messageEditor?.mention == false) {
  //       messageEditorConfig.enabledMention = false;
  //     }
  //     if (globalConfig?.messageEditor?.typing == false) {
  //       messageEditorConfig.enabledTyping = false;
  //     }

  //     messageEditorConfig.actions = messageEditorConfig.actions?.filter(item => {
  //       if (item.name == 'EMOJI' && globalConfig?.messageEditor?.emoji == false) {
  //         return false;
  //       }
  //       if (item.name == 'MORE' && globalConfig?.messageEditor?.moreAction == false) {
  //         return false;
  //       }
  //       if (item.name == 'RECORDER' && globalConfig?.messageEditor?.record == false) {
  //         return false;
  //       }

  //       return true;
  //     });
  //     messageEditorConfig.customActions = messageEditorConfig!.customActions?.filter(item => {
  //       if (item.content == 'IMAGE' && globalConfig?.messageEditor?.picture == false) {
  //         return false;
  //       }
  //       if (item.content == 'FILE' && globalConfig?.messageEditor?.file == false) {
  //         return false;
  //       }
  //       return true;
  //     });
  //   }

  const chatroomData =
    rootStore.addressStore.chatroom.filter(item => item.id === chatroomId)[0] || {};
  const appUsersInfo = rootStore.addressStore.appUsersInfo;
  const broadcast = rootStore.messageStore.message.broadcast;
  const [reportMessageId, setReportMessageId] = useState('');
  const handleReport = message => {
    console.log('report', message);
    setReportOpen(true);
    setReportMessageId(message.mid || message.id);
  };
  const renderChatroomMessage = msg => {
    if (msg.type == 'txt' || msg.type == 'custom') {
      return <ChatroomMessage type="txt" message={msg} onReport={handleReport} />;
    }
  };

  const [reportOpen, setReportOpen] = useState(false);
  const [checkedType, setCheckedType] = useState('');
  const handleCheckChange = (type: string) => {
    console.log('type', type);
    setCheckedType(type);
  };
  const handleReportMessage = () => {
    rootStore.client
      .reportMessage({
        reportType: checkedType,
        reportReason: checkedType,
        messageId: reportMessageId,
      })
      .then(() => {
        setReportOpen(false);
        console.log('举报成功');
        setCheckedType('');
      });
  };

  const handleBroadcastFinish = () => {
    rootStore.messageStore.shiftBroadcastMessage();
  };
  return (
    <div className={classString}>
      {isEmpty ? (
        renderEmpty ? (
          renderEmpty()
        ) : (
          <Empty text={t('module.noConversation')}></Empty>
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
          {broadcast.length > 0 && (
            <Broadcast loop={0} delay={1} play={true} onCycleComplete={handleBroadcastFinish}>
              <div>{broadcast[0].msg || ''}</div>
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
              actions={[
                { name: 'TEXTAREA', visible: true },
                { name: 'EMOJI', visible: true },
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
              ]}
            ></MessageEditor>
          )}
        </>
      )}
      <Modal
        open={reportOpen}
        title="Report"
        okText="Report"
        onOk={handleReportMessage}
        onCancel={() => {
          setReportOpen(false);
        }}
      >
        <div>
          <div className="report-item">
            <div>Unwelcome commercial content or spam</div>
            <Checkbox
              checked={checkedType === 'type1'}
              onChange={() => {
                handleCheckChange('type1');
              }}
            ></Checkbox>
          </div>
          <div className="report-item">
            <div>Pornographic or explicit content</div>
            <Checkbox
              checked={checkedType === 'type2'}
              onChange={() => {
                handleCheckChange('type2');
              }}
            ></Checkbox>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default observer(Chatroom);
