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
import { MessageList, MsgListProps } from './MessageList';
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
// import rootStore from '../store';
export interface ChatProps {
  prefix?: string;
  className?: string;
  renderHeader?: (cvs: {
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    name?: string;
    unreadCount?: number;
  }) => ReactNode; // 自定义渲染 Header
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageEditor?: () => ReactNode; // 自定义渲染 MessageEditor
  renderEmpty?: () => ReactNode; // 自定义渲染没有会话时的内容
  // Header 的 props
  headerProps?: {
    avatar: ReactNode;
    onAvatarClick?: () => void; // 点击 Header 中 头像的回调
    moreAction?: HeaderProps['moreAction'];
  };
  messageListProps?: MsgListProps;
  messageEditorProps?: MessageEditorProps;
}
const getChatAvatarUrl = (cvs: CurrentConversation) => {
  if (cvs.chatType === 'singleChat') {
    return getStore().addressStore.appUsersInfo[cvs.conversationId]?.avatarurl;
  } else {
    return '';
  }
};

const Chat: FC<ChatProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    renderHeader,
    renderMessageList,
    renderMessageEditor,
    renderEmpty,
    headerProps,
    messageListProps,
    messageEditorProps,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chat', customizePrefixCls);

  const [isEmpty, setIsEmpty] = useState(true);
  const classString = classNames(prefixCls, className);
  const context = useContext(RootContext);
  const { rootStore, features } = context;
  const { appUsersInfo } = rootStore.addressStore;
  const globalConfig = features?.chat;
  const CVS = rootStore.conversationStore.currentCvs;

  useEffect(() => {
    if (!rootStore.conversationStore.currentCvs.conversationId) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }

    // clear replied message
    rootStore.messageStore.setRepliedMessage(null);

    // Process it in a simple way first, without caching
    if (!rootStore.conversationStore.currentCvs.conversationId) return;
    // clear selected messages
    rootStore.messageStore.setSelectedMessage(rootStore.conversationStore.currentCvs, {
      selectable: false,
      selectedMessage: [],
    });

    // close thread
    setModalOpen(false);
    rootStore.threadStore.setThreadVisible(false);
  }, [rootStore.conversationStore.currentCvs]);

  const repliedMsg = rootStore.messageStore.repliedMessage;
  const replyCvsId = getCvsIdFromMessage(repliedMsg || {});
  const showReply = repliedMsg && replyCvsId === CVS.conversationId;

  // --------- thread -----------
  // thread modal title name
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const headerRef = useRef(null);
  const showTheadList = () => {
    if (modalOpen) return;
    setModalOpen(true);
    rootStore.threadStore.getGroupChatThreads(CVS.conversationId)?.then(cursor => {
      setCursor(cursor);
    });
  };
  const [cursor, setCursor] = useState<string | undefined>();
  // containerRef?.current?.scrollHeight
  const threadScrollRef = useRef(null);
  const pagingGetThreadList = () => {
    const height = threadScrollRef?.current?.scrollHeight;
    if (cursor === null) return;
    rootStore.threadStore.getGroupChatThreads(CVS.conversationId, cursor)?.then((res: string) => {
      setCursor(res);
      setTimeout(() => {
        threadScrollRef?.current.scrollTo(threadList.length * 56);
      }, 100);
    });
  };

  const threadList = rootStore.threadStore.threadList[CVS.conversationId] || [];
  const openThread = item => {
    // close thread list modal
    setModalOpen(false);
    rootStore.threadStore.setThreadVisible(true);
    rootStore.threadStore.getChatThreadDetail(item.id);
  };
  const ThreadScrollList = ScrollList<AgoraChat.ChatThreadOverview>();

  const [renderThreadList, setRenderThreadList] = useState(threadList);

  useEffect(() => {
    setRenderThreadList(threadList);
  }, [threadList.length, CVS.conversationId]);
  // render thread list
  const threadListContent = () => {
    const renderItem = (item: AgoraChat.ChatThreadOverview, index: number) => {
      let lastMsg = '';
      switch (item.lastMessage?.type) {
        case 'txt':
          lastMsg = item.lastMessage?.msg;
          break;
        case 'img':
          lastMsg = `/${t('module.image')}/`;
          break;
        case 'audio':
          lastMsg = `/${t('module.audio')}/`;
          break;
        case 'file':
          lastMsg = `/${t('module.file')}/`;
          break;
        case 'video':
          lastMsg = `/${t('module.video')}/`;
          break;
        case 'custom':
          lastMsg = `/${t('module.custom')}/`;
          break;
        case 'combine':
          lastMsg = `/${t('module.combine')}/`;
          break;
        default:
          console.warn('unexpected message type:', item.lastMessage?.type);
          break;
      }
      return (
        <div
          className={`${prefixCls}-thread-item`}
          key={index}
          onClick={() => {
            openThread(item);
          }}
        >
          <span className={`${prefixCls}-thread-item-name`}> {item.name}</span>
          {item.lastMessage?.type && (
            <div className={`${prefixCls}-thread-item-msgBox`}>
              <Avatar size={12} src={appUsersInfo?.[item.lastMessage?.from]?.avatarurl}>
                {appUsersInfo?.[item.lastMessage?.from]?.nickname || item.lastMessage?.from}
              </Avatar>
              <div className={`${prefixCls}-thread-item-msgBox-name`}>
                {getMsgSenderNickname(item.lastMessage, item.parentId)}
              </div>
              <div>{lastMsg}</div>
              <div>{getConversationTime(item.lastMessage?.time)}</div>
            </div>
          )}
        </div>
      );
    };

    const dom = (
      <ThreadScrollList
        ref={threadScrollRef}
        loading={false}
        loadMoreItems={pagingGetThreadList}
        scrollDirection="down"
        paddingHeight={50}
        data={renderThreadList}
        renderItem={renderItem}
      ></ThreadScrollList>
    );
    return dom;
  };

  // thread thread
  const handleSearchThread = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const filterList = threadList.filter(item => {
      return item.name.includes(value);
    });
    setRenderThreadList(filterList);
  };

  //------ global config ------
  // config header
  let showHeaderThreadListBtn = true;
  let headerMoreAction = {
    visible: true,
    actions: [
      {
        content: t('module.clearMsgs'),
        onClick: () => {
          rootStore.messageStore.clearMessage(rootStore.conversationStore.currentCvs);
          rootStore.client.removeHistoryMessages({
            targetId: CVS.conversationId,
            chatType: CVS.chatType,
            beforeTimeStamp: Date.now(),
          });
        },
      },
      {
        content: t('module.deleteCvs'),
        onClick: () => {
          rootStore.conversationStore.deleteConversation(rootStore.conversationStore.currentCvs);

          rootStore.client.deleteConversation({
            channel: CVS.conversationId,
            chatType: CVS.chatType,
            deleteRoam: true,
          });
        },
      },
    ],
  };

  if (globalConfig?.header) {
    if (globalConfig?.header?.threadList == false) {
      showHeaderThreadListBtn = false;
    }
    if (globalConfig?.header?.moreAction == false) {
      headerMoreAction = {
        visible: false,
        actions: [],
      };
    }
    if (globalConfig?.header?.clearMessage == false) {
      headerMoreAction.actions.shift();
    }
    if (globalConfig?.header?.deleteConversation == false) {
      headerMoreAction.actions.pop();
    }
  }

  // config message
  let messageProps: MsgListProps['messageProps'] = {
    customAction: {
      visible: true,
      icon: null,
      actions: [
        {
          content: 'REPLY',
          onClick: () => {},
        },
        {
          content: 'DELETE',
          onClick: () => {},
        },
        {
          content: 'UNSEND',
          onClick: () => {},
        },
        {
          content: 'TRANSLATE',
          onClick: () => {},
        },
        {
          content: 'Modify',
          onClick: () => {},
        },
        {
          content: 'SELECT',
          onClick: () => {},
        },
      ],
    },
  };

  if (globalConfig?.message) {
    if (globalConfig?.message?.status == false) {
      messageProps.messageStatus = false;
    }
    if (globalConfig?.message?.thread == false) {
      messageProps.thread = false;
    }
    if (globalConfig?.message?.reaction == false) {
      messageProps.reaction = false;
    }
    if (globalConfig?.message?.moreAction == false) {
      messageProps.customAction = {
        visible: false,
      };
    }

    messageProps.customAction!.actions = messageProps.customAction!.actions!.filter(item => {
      if (globalConfig?.message?.reply == false && item.content == 'REPLY') {
        return false;
      }
      if (globalConfig?.message?.delete == false && item.content == 'DELETE') {
        return false;
      }
      if (globalConfig?.message?.recall == false && item.content == 'UNSEND') {
        return false;
      }
      if (globalConfig?.message?.translate == false && item.content == 'TRANSLATE') {
        return false;
      }
      if (globalConfig?.message?.edit == false && item.content == 'Modify') {
        return false;
      }
      if (globalConfig?.message?.select == false && item.content == 'SELECT') {
        return false;
      }
      return true;
    });
  }

  // config messageEditor
  let messageEditorConfig: MessageEditorProps = {
    enabledTyping: true,
    enabledMention: true,
    actions: [
      {
        name: 'RECORDER',
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
        visible: true,
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
  if (globalConfig?.messageEditor) {
    if (globalConfig?.messageEditor?.mention == false) {
      messageEditorConfig.enabledMention = false;
    }
    if (globalConfig?.messageEditor?.typing == false) {
      messageEditorConfig.enabledTyping = false;
    }

    messageEditorConfig.actions = messageEditorConfig.actions?.filter(item => {
      if (item.name == 'EMOJI' && globalConfig?.messageEditor?.emoji == false) {
        return false;
      }
      if (item.name == 'MORE' && globalConfig?.messageEditor?.moreAction == false) {
        return false;
      }
      if (item.name == 'RECORDER' && globalConfig?.messageEditor?.record == false) {
        return false;
      }

      return true;
    });
    messageEditorConfig.customActions = messageEditorConfig!.customActions?.filter(item => {
      if (item.content == 'IMAGE' && globalConfig?.messageEditor?.picture == false) {
        return false;
      }
      if (item.content == 'FILE' && globalConfig?.messageEditor?.file == false) {
        return false;
      }
      return true;
    });
  }
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
            renderHeader(rootStore.conversationStore.currentCvs)
          ) : (
            <Header
              avatarSrc={getChatAvatarUrl(CVS)}
              suffixIcon={
                CVS.chatType == 'groupChat' && showHeaderThreadListBtn ? (
                  <div ref={headerRef}>
                    <Button onClick={showTheadList} type="text" shape="circle">
                      <Icon type="THREAD"></Icon>
                    </Button>
                  </div>
                ) : null
              }
              content={
                rootStore.conversationStore.currentCvs.name ||
                rootStore.conversationStore.currentCvs.conversationId
              }
              moreAction={headerMoreAction}
              {...headerProps}
            ></Header>
          )}
          {renderMessageList ? (
            renderMessageList()
          ) : (
            <MessageList messageProps={messageProps} {...messageListProps}></MessageList>
          )}
          {messageEditorProps?.enabledTyping && (
            <Typing
              conversation={rootStore.conversationStore.currentCvs}
              onHide={() => {
                rootStore.messageStore.setTyping(rootStore.conversationStore.currentCvs, false);
              }}
            ></Typing>
          )}

          {showReply && <UnsentRepliedMsg type="summary"></UnsentRepliedMsg>}

          {renderMessageEditor ? (
            renderMessageEditor()
          ) : (
            <MessageEditor {...messageEditorConfig} {...messageEditorProps}></MessageEditor>
          )}
          {modalOpen && (
            <ThreadModal
              headerContent={'Thread List'}
              open={modalOpen}
              anchorEl={headerRef.current}
              onClose={() => {
                setModalOpen(false);
              }}
              onSearch={handleSearchThread}
              onClear={() => {
                setRenderThreadList(threadList || []);
              }}
              style={{ width: '360px' }}
            >
              <div className={`${prefixCls}-threads-box`}>{threadListContent()}</div>
            </ThreadModal>
          )}
        </>
      )}
    </div>
  );
};

export default observer(Chat);
