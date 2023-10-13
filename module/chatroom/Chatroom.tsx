import React, { FC, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useSize } from 'ahooks';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Badge from '../../component/badge';
import Button from '../../component/button';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import MessageEditor, { MessageEditorProps } from '../messageEditor';
import List from '../../component/list';
import { MessageList, MsgListProps } from '../chat/MessageList';
import { getStore } from '../store';
import { RootContext } from '../store/rootContext';
import { useEventHandler } from '../hooks/chat';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
import Empty from '../empty';
import { UnsentRepliedMsg } from '../repliedMessage';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from 'module/store/ConversationStore';
import Typing from '../typing';
import { ThreadModal } from '../thread';
import ScrollList from '../../component/scrollList';
import { AgoraChat } from 'agora-chat';
import { getConversationTime, getCvsIdFromMessage, getMsgSenderNickname } from '../utils/index';
import ChatroomMessage from '../chatroomMessage';
import { GiftKeyboard } from '../messageEditor/gift';

export interface ChatroomProps {
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
    // chatroomId,
  } = props;
  const context = useContext(RootContext);
  const { rootStore, features } = context;
  const chatroomId = '226365301391364';
  const [isEmpty, setIsEmpty] = useState(false);
  const classString = '';

  useEffect(() => {
    window.rootStore = rootStore;
    if (!rootStore.loginState) return;
    rootStore.client
      .getChatRooms({
        pagenum: 20,
        pagesize: 0,
      })
      .then(res => {
        console.log(res, 111);
      })
      .catch(err => {
        console.log('get fail', err);
      });
    if (chatroomId) {
      //   rootStore.conversationStore.setCurrentCvs(chatroomId);
      rootStore.client
        .joinChatRoom({ roomId: chatroomId })
        .then(() => {
          console.log('join chatroom success');
        })
        .catch(err => {
          console.log('join chatroom fail', err);
        });
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

  const renderChatroomMessage = msg => {
    return <ChatroomMessage type="txt" message={msg} />;
  };
  return (
    <div className={classString}>
      {isEmpty ? (
        renderEmpty ? (
          renderEmpty()
        ) : (
          <Empty text={t('noConversation')}></Empty>
        )
      ) : (
        <>
          {renderHeader ? (
            renderHeader(rootStore.conversationStore.currentCvs)
          ) : (
            <Header
              avatarSrc={''}
              content={
                rootStore.conversationStore.currentCvs.name ||
                rootStore.conversationStore.currentCvs.conversationId
              }
              {...headerProps}
            ></Header>
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
    </div>
  );
};

export default observer(Chatroom);
