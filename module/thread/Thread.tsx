/** create Thread component, 实现和Chat组件一样的功能，一样的样式*/

import React, { useState, useEffect, useContext, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
// @ts-ignore
import { ChatSDK } from '../../SDK';
import { useTranslation } from 'react-i18next';
import Header from '../header';
import MessageInput, { MessageInputProps } from '../messageInput';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import TextMessage from '../textMessage';
import ImageMessage from '../imageMessage';
import FileMessage from '../fileMessage';
import AudioMessage from '../audioMessage';
import CombinedMessage from '../combinedMessage';
import { MessageList, MsgListProps } from '../chat/MessageList';
import Input from '../../component/input';
import { observer } from 'mobx-react-lite';
import { CurrentConversation } from '../store/ConversationStore';
import Modal from '../../component/modal';
import Tooltip from '../../component/tooltip';
import ThreadModal from './ThreadModal';
import Button from '../../component/button';
import { UnsentRepliedMsg } from '../repliedMessage/UnsentRepliedMsg';
// import rootStore from '../store/index';
import { getMsgSenderNickname } from '../utils/index';
import { RootContext } from '../store/rootContext';
import { eventHandler } from '../../eventHandler';
export interface ThreadProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  shape?: 'ground' | 'square'; // 气泡形状
  direction?: 'ltr' | 'rtl';
  message: ChatSDK.MessageBody;
  messageListProps?: MsgListProps;
  createThread?: boolean;
  groupID: string;
  threadID?: string;
  originalMsg: ChatSDK.MessageBody;
  messageInputProps?: MessageInputProps;
}

const Thread = (props: ThreadProps) => {
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { prefix, className, messageListProps, messageInputProps, style = {} } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('thread', prefix);
  const { t } = useTranslation();
  const threadOriginalMsg = rootStore.threadStore.currentThread.originalMessage;
  // 为什么 currentThread 不会自动更新？ 但是currentCVS会自动更新， 用一个变量能表示rootStore.threadStore.currentThread， 会自动更新

  const { threadStore } = rootStore;
  const renderMsgDom = (msg: ChatSDK.MessagesType = {}) => {
    let content;
    switch (msg.type) {
      case 'txt':
        content = (
          <TextMessage
            renderUserProfile={() => null}
            messageStatus={false}
            customAction={{ visible: false }}
            reaction={false}
            thread={false}
            key={msg.id}
            bubbleType="none"
            textMessage={msg}
            direction="ltr"
          />
        );
        break;
      case 'img':
        content = (
          <ImageMessage
            renderUserProfile={() => null}
            messageStatus={false}
            imageMessage={msg}
            direction="ltr"
            key={msg.id}
            reaction={false}
            thread={false}
            customAction={{ visible: false }}
          />
        );
        break;
      case 'file':
        content = (
          <FileMessage
            renderUserProfile={() => null}
            messageStatus={false}
            bubbleStyle={{ minWidth: '160px' }}
            key={msg.id}
            fileMessage={msg}
            direction="ltr"
            type="secondly"
            reaction={false}
            thread={false}
            customAction={{ visible: false }}
          />
        );
        break;
      case 'audio':
        content = (
          <AudioMessage
            renderUserProfile={() => null}
            messageStatus={false}
            key={msg.id}
            audioMessage={msg}
            direction="ltr"
            type="secondly"
            reaction={false}
            thread={false}
            customAction={{ visible: false }}
          />
        );
        break;
      case 'combine':
        content = (
          <CombinedMessage
            renderUserProfile={() => null}
            messageStatus={false}
            key={msg.id}
            combinedMessage={msg}
            direction="ltr"
            type="secondly"
            reaction={false}
            thread={false}
            customAction={{ visible: false }}
          />
        );
        break;
      default:
        content = null;
        break;
    }
    return content;
  };

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const [editorDisable, setEditorDisable] = useState(false);
  const [threadName, setThreadName] = useState(t('aThread'));
  const [role, setRole] = useState('member'); // My role in the group
  const handleThreadNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setThreadName(event.target.value);
    if (event.target.value.length == 0) {
      setEditorDisable(true);
    } else {
      setEditorDisable(false);
    }
  };

  const renderOriginalMsg = () => {
    return (
      <div className={`${prefixCls}-original`}>
        <div className={`${prefixCls}-original-start`}>
          {t('startedBy')}{' '}
          <span>
            {getMsgSenderNickname({
              chatType: 'groupChat',
              to: threadStore.currentThread.info?.parentId || '',
              from: threadStore.currentThread.info?.owner || '',
            } as any)}
          </span>
        </div>
        <div className={`${prefixCls}-original-msg`}>{renderMsgDom(threadOriginalMsg)}</div>
        <span className={`${prefixCls}-original-line`}></span>
      </div>
    );
  };

  const renderCreateForm = () => {
    return (
      <div className={`${prefixCls}-create`}>
        <div className={`${prefixCls}-create-title`}>{t('threadNameRequired')}</div>
        <div className={`${prefixCls}-create-content`}>
          <Input
            onChange={handleThreadNameChange}
            onClear={() => {
              setEditorDisable(true);
            }}
            close
            required
            value={t('aThread') as string}
            placeholder={t('enterThreadName') as string}
          />
        </div>

        <div>{renderMsgDom(threadOriginalMsg)}</div>
      </div>
    );
  };

  const [conversation, setConversation] = useState<CurrentConversation>({
    chatType: 'groupChat',
    conversationId: '',
  });

  const repliedMsg = rootStore.messageStore.repliedMessage;
  const replyCvsId = repliedMsg?.to;
  const showReply = repliedMsg && replyCvsId === conversation.conversationId;

  const handleSendMessage: (
    message: ChatSDK.MessageBody,
  ) => Promise<CurrentConversation | void> = message => {
    const originalMessage = rootStore.threadStore.currentThread.originalMessage || {};
    const currentThread = rootStore.threadStore.currentThread;
    if (currentThread.creating) {
      // 创建thread
      const options = {
        name: threadName?.replace(/(^\s*)|(\s*$)/g, '') || (t('aThread') as string),
        // @ts-ignore
        messageId: originalMessage.mid || originalMessage.id,
        parentId: originalMessage.to,
      };
      return new Promise((resolve, reject) => {
        rootStore.client
          .createChatThread(options)
          .then(res => {
            setConversation({
              chatType: 'groupChat',
              conversationId: res.data?.chatThreadId || '',
            });
            rootStore.threadStore.setCurrentThread({
              ...currentThread,
              info: { owner: rootStore.client.user } as unknown as ChatSDK.ThreadChangeInfo,
              creating: false,
            });
            // onOpenThreadModal && onOpenThreadModal({ id: threadId })
            eventHandler.dispatchSuccess('createChatThread');
            resolve({
              chatType: 'groupChat',
              conversationId: res.data?.chatThreadId || '',
            });
          })
          .catch(err => {
            eventHandler.dispatchError('createChatThread', err);
            reject(err);
          });
      });
    }
    const cvs: CurrentConversation = {
      chatType: 'groupChat',
      conversationId: currentThread.info?.id || '',
    };
    return Promise.resolve(cvs);
  };
  const currentThread = threadStore.currentThread;
  //threadNameValue 为什么不更新
  let threadNameValue: string = '';
  // const [threadNameValue, setThreadNameValue] = useState('');

  const groups = rootStore.addressStore.groups || [];

  useEffect(() => {
    const currentThread = rootStore.threadStore.currentThread;
    setConversation({
      chatType: 'groupChat',
      conversationId: currentThread?.info?.id || '',
    });
    // setThreadNameValue(currentThread?.info?.name || '');
    const myId = rootStore.client.user;
    if (currentThread?.info?.parentId) {
      groups.forEach(item => {
        if (item.groupid == currentThread?.info?.parentId) {
          const members = item.members || [];
          if (members.length > 0) {
            for (let index = 0; index < members.length; index++) {
              if (members[index].userId == myId) {
                if (members[index].role == 'member')
                  if (item.admins?.includes(myId)) {
                    setRole('admin');
                  } else if (currentThread?.info?.owner == myId) {
                    setRole('threadOwner');
                  }
                setRole(members[index].role);
                break;
              }
            }
          }
        }
      });
    }
  }, [currentThread?.info?.id]);

  // close panel
  const handleClickClose = () => {
    // rootStore.threadStore.setCurrentThread({
    //   ...currentThread,
    //   visible: false,
    //   creating: false,
    // });
    rootStore.threadStore.setThreadVisible(false);
  };

  const [modalData, setModalData] = useState<{
    open: boolean;
    title: string;
    content: React.ReactNode;
    okText: string;
    cancelText: string;
    onOk: () => void;
  }>({
    open: false,
    title: '',
    content: '',
    okText: '',
    cancelText: '',
    onOk: () => {},
  });

  // 解散thread
  const handleDisbandThread = () => {
    setModalData({
      open: true,
      title: t('disbandThread'),
      content: t('are you sure you want to disband this thread'),
      okText: t('disband'),
      cancelText: t('cancel'),
      onOk: () => {
        rootStore.client
          .destroyChatThread({
            chatThreadId: threadStore.currentThread.info?.id || '',
          })
          .then(res => {
            setModalData({
              ...modalData,
              open: false,
            });
            handleClickClose();
            eventHandler.dispatchSuccess('destroyChatThread');
          })
          .catch(err => {
            eventHandler.dispatchError('destroyChatThread', err);
            console.error(err);
          });
      },
    });
  };

  // 离开thread
  const handleLeaveThread = () => {
    setModalData({
      open: true,
      title: `${t('leave')} ${t('thread')}`,
      content: t('Are you sure you want to leave this thread'),
      okText: t('leave'),
      cancelText: t('cancel'),
      onOk: () => {
        rootStore.client
          .leaveChatThread({
            chatThreadId: threadStore.currentThread.info?.id || '',
          })
          .then(res => {
            setModalData({
              ...modalData,
              open: false,
            });
            handleClickClose();
            eventHandler.dispatchSuccess('leaveChatThread');
          })
          .catch(err => {
            eventHandler.dispatchError('leaveChatThread', err);
          });
      },
    });
  };
  const handleEditInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    threadNameValue = e.target.value;
  };

  // 修改thread name
  const handleEditThreadName = () => {
    setModalData({
      open: true,
      title: t('editThreadName'),
      content: (
        <Input
          value={threadStore.currentThread.info?.name}
          onChange={e => {
            handleEditInput(e);
          }}
        ></Input>
      ),
      okText: t('save'),
      cancelText: t('cancel'),
      onOk: () => {
        rootStore.client
          .changeChatThreadName({
            chatThreadId: threadStore.currentThread.info?.id || '',
            name: threadNameValue,
          })
          .then(res => {
            setModalData({
              ...modalData,
              open: false,
            });
          })
          .catch(err => {
            console.error(err);
          });
      },
    });
  };

  // thread modal title name
  const [modalName, setModalName] = useState<string>(`${t('thread')} ${t('members')}`);

  // 获取thread members
  const handleGetThreadMembers = () => {
    setPanelOpen(true);
    threadStore
      .getThreadMembers(
        threadStore.currentThread.info?.parentId || '',
        threadStore.currentThread.info?.id || '',
      )
      .then((data: any) => {
        setModalData({
          ...modalData,
          open: false,
        });
        setModalName(`${t('thread')} ${t('members')}(${data.length})`);
      });
  };

  const threadMoreAction = {
    visible: true,
    actions: [
      {
        content: `${t('thread')} ${t('members')}`,
        onClick: () => {
          handleGetThreadMembers();
        },
      },
      {
        visible: role != 'member',
        content: `${t('modify')} ${t('thread')}`,
        onClick: () => {
          handleEditThreadName();
        },
      },
      {
        content: `${t('leave')} ${t('thread')}`,
        onClick: () => {
          handleLeaveThread();
        },
      },
      {
        visible: role == 'admin' || role == 'owner',
        content: `${t('disband')} ${t('thread')}`,
        onClick: () => {
          handleDisbandThread();
        },
      },
    ],
  };
  const headerRef = useRef(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const actions: any[] = [
    {
      content: t('remove'),
      onClick: (item: string) => {
        threadStore.removeChatThreadMember(
          threadStore.currentThread.info?.parentId || '',
          threadStore.currentThread.info?.id || '',
          item,
        );
      },
    },
  ];

  const [renderMembers, setRenderMembers] = useState<string[]>([]);
  useEffect(() => {
    if (threadStore.currentThread.info?.members) {
      setRenderMembers(threadStore.currentThread.info?.members);
    }
  }, [threadStore.currentThread.info?.members]);

  //render thread member list
  const membersContent = () => {
    const members = renderMembers || [];
    const menuNode = (member: string) => (
      <ul className={`${getPrefixCls('header')}-more`}>
        {actions.map((item, index) => {
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(member);
              }}
            >
              {item.content}
            </li>
          );
        })}
      </ul>
    );
    // 控制是否显示更多操作的开关
    const showMoreAction = role != 'member';
    const myId = rootStore.client.user;
    const membersDom = members.map(member => {
      return (
        <div className={`${prefixCls}-members-item`} key={member}>
          <div className={`${prefixCls}-members-item-name`}>
            <Avatar>{member}</Avatar>
            <div>{member}</div>
          </div>
          {showMoreAction && myId != member && (
            <Tooltip title={menuNode(member)} trigger="click" placement="bottom">
              {
                <Button type="text" shape="circle">
                  <Icon type="ELLIPSIS"></Icon>
                </Button>
              }
            </Tooltip>
          )}
        </div>
      );
    });
    return membersDom;
  };

  const handleSearchMember = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const members = threadStore.currentThread.info?.members || [];
    const filterMembers = members.filter(member => {
      return member.includes(value);
    });
    setRenderMembers(filterMembers);
  };
  return (
    <div className={classString} style={{ ...style }}>
      <div ref={headerRef}>
        <Header
          avatar={<Icon type="THREAD"></Icon>}
          content={threadStore.currentThread.info?.name || t('aThread')}
          close
          onClickClose={handleClickClose}
          moreAction={threadMoreAction}
        />
      </div>
      {threadStore.currentThread.creating ? renderCreateForm() : renderOriginalMsg()}
      <MessageList {...messageListProps} isThread={true} conversation={conversation}></MessageList>
      {showReply && <UnsentRepliedMsg type="summary"></UnsentRepliedMsg>}
      <MessageInput
        disabled={threadStore.currentThread.creating && editorDisable}
        isChatThread={true}
        enabledMenton={false}
        // onSendMessage={handleSendMessage}
        onBeforeSendMessage={handleSendMessage}
        conversation={conversation}
        {...messageInputProps}
      />

      <Modal
        open={modalData.open}
        title={modalData.title}
        okText={modalData.okText}
        cancelText={modalData.cancelText}
        onCancel={() => {
          setModalData({
            ...modalData,
            open: false,
          });
        }}
        onOk={modalData.onOk}
      >
        <div className={`${prefixCls}-detail`}>{modalData.content}</div>
      </Modal>

      <ThreadModal
        headerContent={modalName}
        open={panelOpen}
        anchorEl={headerRef.current}
        onClose={() => {
          setPanelOpen(false);
        }}
        onSearch={handleSearchMember}
        onClear={() => {
          setRenderMembers(threadStore.currentThread.info?.members || []);
        }}
        style={{ width: '360px' }}
      >
        <div className={`${prefixCls}-members-box`}>{membersContent()}</div>
      </ThreadModal>
    </div>
  );
};

export default observer(Thread);
