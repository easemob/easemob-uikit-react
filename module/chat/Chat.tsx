import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useContext,
  ReactNode,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import MessageInput, { MessageInputProps, MessageInputRef } from '../messageInput';
import List from '../../component/list';
import { MessageList, MsgListProps } from './MessageList';
import { getStore } from '../store';
import { RootContext } from '../store/rootContext';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
import Empty from '../empty';
import { UnsentRepliedMsg } from '../repliedMessage';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from 'module/store/ConversationStore';
import Typing from '../typing';
import Thread, { ThreadListExpandableIcon } from '../thread';
import ScrollList from '../../component/scrollList';
import type { ChatSDK } from 'module/SDK';
import {
  getConversationTime,
  getCurrentUserId,
  getCvsIdFromMessage,
  getMessageId,
  getMsgSenderNickname,
  getUsersInfo,
} from '../utils/index';
import CallKit, { CallKitRef, CallKitProps } from '../callkit';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { eventHandler } from '../../eventHandler';
import Modal from '../../component/modal';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import outgoingRingtone from './拨打电话.mp3';
import incomingRingtone from './拨打电话.mp3';
import callkit_bg from '../assets/callkit_bg.png';
import { useIsMobile, useScreen } from '../hooks/useScreen';
export interface RtcRoomInfo {
  callId: string;
  calleeDevId?: string;
  calleeIMName: string;
  callerDevId?: string;
  callerIMName: string;
  channel: string;
  confrName: string;
  groupId: string;
  groupName: string;
  token?: string;
  type: number;
  joinedMembers: { agoraUid: number; imUserId: string }[];
}
export interface ChatProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  renderHeader?: (cvs: {
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    name?: string;
    unreadCount?: number;
  }) => ReactNode; // 自定义渲染 Header
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageInput?: () => ReactNode; // 自定义渲染 MessageInput
  renderEmpty?: () => ReactNode; // 自定义渲染没有会话时的内容
  renderRepliedMessage?: (repliedMessage: ChatSDK.Message | null) => ReactNode; // 自定义渲染Input上面的被回复的消息
  // Header 的 props
  headerProps?: Omit<HeaderProps, 'suffixIcon'> & {
    suffixIcon?: ('PIN' | 'THREAD' | 'AUDIO' | 'VIDEO' | ReactNode)[];
  };
  messageListProps?: MsgListProps;
  messageInputProps?: MessageInputProps;

  onOpenThread?: (data: { id: string }) => void;
  onOpenThreadList?: () => void;

  // CallKit 相关配置
  useCallkit?: boolean; // 是否启用 CallKit，默认为 true
  callkitProps?: Partial<CallKitProps>; // CallKit 组件的配置参数
}
const getChatAvatarUrl = (cvs: CurrentConversation) => {
  if (cvs.chatType === 'singleChat') {
    return getStore().addressStore.resolveUserInfo(cvs.conversationId).avatarUrl;
  } else if (cvs.chatType === 'groupChat') {
    const group = getStore().addressStore.groups.find(item => item.groupId === cvs.conversationId);
    return group?.avatarUrl;
  }
};

let Chat = forwardRef((props: ChatProps, ref) => {
  const {
    prefix: customizePrefixCls,
    className,
    renderHeader,
    renderMessageList,
    renderMessageInput,
    renderEmpty,
    headerProps,
    messageListProps,
    messageInputProps,
    style = {},
    onOpenThread,
    onOpenThreadList,
    useCallkit = true,
    callkitProps = {},
    renderRepliedMessage,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chat', customizePrefixCls);
  const { show } = usePinnedMessage();
  const isMobile = useIsMobile();
  const [isEmpty, setIsEmpty] = useState(true);

  const context = useContext(RootContext);
  const { rootStore, features, theme, presenceMap, initConfig } = context;
  const currentUserId = getCurrentUserId(rootStore.client);
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const { appUsersInfo } = rootStore.addressStore || {};
  const globalConfig = features?.chat;
  const CVS = rootStore.conversationStore.currentCvs;
  const { suffixIcon, moreAction, ...otherHeaderProps } = headerProps || {};
  const callKitRef = useRef<CallKitRef>(null);
  useContacts();
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
    rootStore.threadStore.setThreadVisible(false);
  }, [rootStore.conversationStore.currentCvs]);

  const repliedMsg = rootStore.messageStore.repliedMessage;
  const replyCvsId = getCvsIdFromMessage((repliedMsg as BaseMessageType) || {});
  const showReply = repliedMsg && replyCvsId === CVS.conversationId;

  //------ global config ------
  // config header
  let showHeaderThreadListBtn = true;
  type HeaderMenuAction = {
    visible?: boolean;
    icon?: React.ReactNode;
    content: React.ReactNode;
    onClick?: () => void;
  };

  let headerMoreAction: {
    visible: boolean;
    actions: HeaderMenuAction[];
  } = headerProps?.moreAction
    ? {
        visible: headerProps?.moreAction?.visible ?? true,
        actions: headerProps?.moreAction?.actions ?? [],
      }
    : {
        visible: true,
        actions: [
          {
            content: t('clearMsgs') as React.ReactNode,
            onClick: () => {
              rootStore.messageStore.clearMessage(rootStore.conversationStore.currentCvs);
              rootStore.client.chatManager.removeHistoryMessages({
                conversationId: CVS.conversationId,
                conversationType: CVS.chatType as ChatSDK.ChatConversationType,
                beforeTimestamp: Date.now(),
              });
            },
          },
          {
            content: t('deleteCvs') as React.ReactNode,
            onClick: () => {
              rootStore.conversationStore.deleteConversation(
                rootStore.conversationStore.currentCvs,
              );

              rootStore.client.chatManager.deleteConversation({
                conversationId: CVS.conversationId,
                conversationType: CVS.chatType as ChatSDK.ChatConversationType,
                deleteRoamingMessages: true,
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

  // 移动端：将原先 header 右侧的快捷按钮（PIN/THREAD/AUDIO/VIDEO）收纳到更多菜单中
  // 注意：必须在相关开关（showPinMessage/showAudioCall/showVideoCall）初始化之后执行

  // delete message
  const [deleteMessageModalOpen, setDeleteMessageModalOpen] = useState(false);

  const [deleteMessage, setDeleteMessage] = useState<BaseMessageType | null>(null);
  const handleDeleteMessage = (message: BaseMessageType) => {
    setDeleteMessage(message);
    setDeleteMessageModalOpen(true);
  };

  // config message
  const messageProps: MsgListProps['messageProps'] = {
    customAction: {
      visible: true,
      icon: null,
      actions: [
        {
          content: 'FORWARD',
          onClick: () => {},
        },
        {
          content: 'REPLY',
          onClick: () => {},
        },
        {
          content: 'UNSEND',
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
        {
          content: 'PIN',
          onClick: () => {},
        },
        {
          content: 'TRANSLATE',
          onClick: () => {},
        },

        {
          content: 'DELETE',
          onClick: () => {},
        },
      ],
    },
    onDeleteMessage: handleDeleteMessage,
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

    messageProps.customAction!.actions = messageProps.customAction!.actions?.filter?.(item => {
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
      if (globalConfig?.message?.forward == false && item.content == 'FORWARD') {
        return false;
      }
      if (globalConfig?.message?.pin == false && item.content == 'PIN') {
        return false;
      }
      return true;
    });
  }

  // config messageInput
  const messageInputConfig: MessageInputProps = {
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
        content: 'VIDEO',
      },
      {
        content: 'FILE',
      },
      {
        content: 'CARD',
      },
    ],
  };
  if (globalConfig?.messageInput) {
    if (globalConfig?.messageInput?.mention == false) {
      messageInputConfig.enabledMention = false;
    }
    if (globalConfig?.messageInput?.typing == false) {
      messageInputConfig.enabledTyping = false;
    }

    messageInputConfig.actions = messageInputConfig.actions?.filter(item => {
      if (item.name == 'EMOJI' && globalConfig?.messageInput?.emoji == false) {
        return false;
      }
      if (item.name == 'MORE' && globalConfig?.messageInput?.moreAction == false) {
        return false;
      }
      if (item.name == 'RECORDER' && globalConfig?.messageInput?.record == false) {
        return false;
      }

      return true;
    });
    messageInputConfig.customActions = messageInputConfig!.customActions?.filter(item => {
      if (item.content == 'IMAGE' && globalConfig?.messageInput?.picture == false) {
        return false;
      }
      if (item.content == 'FILE' && globalConfig?.messageInput?.file == false) {
        return false;
      }
      if (item.content == 'VIDEO' && globalConfig?.messageInput?.video == false) {
        return false;
      }
      if (item.content == 'CARD' && globalConfig?.messageInput?.contactCard == false) {
        return false;
      }
      return true;
    });
  }

  // ----- video call -----------

  const startVideoCall = async (type: 'video' | 'group' | 'audio') => {
    if (CVS.chatType === 'groupChat') {
      const msg = await callKitRef.current?.startGroupCall({
        groupId: CVS.conversationId,
        msg: t('callkit.invitation.groupCallDescription'),
      });
      if (msg) {
        rootStore.messageStore.addMessage(msg as ChatSDK.Message, 'groupChat', msg.to!);
      }
      return;
    }

    try {
      const msg = await callKitRef.current?.startSingleCall({
        to: CVS.conversationId,
        callType: type as 'video' | 'audio',
        msg: t(
          `callkit.invitation.${type == 'video' ? 'videoCallDescription' : 'audioCallDescription'}`,
        ),
      });
      if (msg) {
        rootStore.messageStore.addMessage(msg as ChatSDK.Message, 'singleChat', msg.to!);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useImperativeHandle(ref, () => ({
    startVideoCall: (chatType: 'singleChat' | 'groupChat') => {
      startVideoCall(chatType === 'groupChat' ? 'group' : 'video');
    },
    startAudioCall: (chatType: 'singleChat' | 'groupChat') => {
      startVideoCall('audio');
    },
  }));

  const threadListExpandableIconRef = useRef<{
    open: () => void;
    close: () => void;
  }>(null);

  // config rtc call
  let showAudioCall = true;
  let showVideoCall = true;
  let showPinMessage = true;
  if (globalConfig?.header?.audioCall == false) {
    showAudioCall = false;
  }
  if (globalConfig?.header?.videoCall == false) {
    showVideoCall = false;
  }

  if (globalConfig?.header?.pinMessage === false) {
    showPinMessage = false;
  }

  // chatbot not display rtc
  if (CVS.conversationId?.indexOf('chatbot_') > -1) {
    showVideoCall = false;
    showAudioCall = false;
  }

  if (CVS.chatType === 'groupChat') {
    showAudioCall = false;
  }

  // 移动端：将原先 header 右侧的快捷按钮（PIN/THREAD/AUDIO/VIDEO）收纳到更多菜单中
  if (isMobile) {
    let suffixIcon = headerProps?.suffixIcon;
    if (!suffixIcon) {
      suffixIcon = ['PIN', 'THREAD', 'AUDIO', 'VIDEO'];
    }

    if (suffixIcon instanceof Array) {
      const mobileActions: Array<HeaderMenuAction> = [];

      suffixIcon.forEach(item => {
        if (item === 'PIN') {
          if (showPinMessage) {
            mobileActions.push({
              icon: <Icon width={20} height={20} type="PIN" />,
              content: t('Pinned Messages') as React.ReactNode,
              onClick: () => {
                show();
              },
            });
          }
        } else if (item === 'THREAD') {
          if (CVS.chatType == 'groupChat' && showHeaderThreadListBtn) {
            mobileActions.push({
              icon: (
                <ThreadListExpandableIcon
                  style={{ width: '100vw' }}
                  iconWidth={20}
                  iconHeight={20}
                  key="thread"
                  ref={threadListExpandableIconRef}
                  icon={<Icon type="HASHTAG_IN_BUBBLE_FILL" width={20} height={20}></Icon>}
                  onClose={() => {
                    console.log('onClose', threadListExpandableIconRef.current);
                    // threadListExpandableIconRef.current?.close?.();
                  }}
                  onClickItem={() => {
                    console.log('onClickItem', threadListExpandableIconRef.current);
                    // threadListExpandableIconRef.current?.close?.();
                  }}
                ></ThreadListExpandableIcon>
              ),
              content: t('threadList') as React.ReactNode,
              onClick: () => {
                threadListExpandableIconRef.current?.open?.();
              },
            });
          }
        } else if (item === 'AUDIO') {
          if (showAudioCall && useCallkit) {
            mobileActions.push({
              icon: <Icon type="PHONE_PICK" width={20} height={20} />,
              content: t('audioCall') as React.ReactNode,
              onClick: () => startVideoCall('audio'),
            });
          }
        } else if (item === 'VIDEO') {
          if (showVideoCall && useCallkit) {
            mobileActions.push({
              icon: <Icon type="VIDEO_CAMERA" width={20} height={20} />,
              content: t('videoCall') as React.ReactNode,
              onClick: () => startVideoCall('video'),
            });
          }
        }
      });
      if (headerProps?.moreAction) {
        headerMoreAction.actions = [...mobileActions, ...headerProps.moreAction.actions];
      } else {
        headerMoreAction.actions = [...mobileActions, ...headerMoreAction.actions];
      }
    }
  }

  const renderHeaderSuffixIcon = () => {
    if (isMobile) return null;
    let suffixIcon = headerProps?.suffixIcon;
    if (!suffixIcon) {
      // 返回默认的
      suffixIcon = ['PIN', 'THREAD', 'AUDIO', 'VIDEO'];
    }
    if (suffixIcon instanceof Array) {
      const dom = suffixIcon.map(item => {
        if (item === 'PIN') {
          return (
            showPinMessage && (
              <Button onClick={show} type="text" shape="circle" key="pin">
                <Icon width={24} height={24} type="PIN"></Icon>
              </Button>
            )
          );
        } else if (item === 'THREAD') {
          return (
            CVS.chatType == 'groupChat' &&
            showHeaderThreadListBtn && (
              <ThreadListExpandableIcon
                style={{ width: '540px' }}
                key="thread"
              ></ThreadListExpandableIcon>
            )
          );
        } else if (item === 'AUDIO') {
          return (
            showAudioCall &&
            useCallkit && (
              <Button
                onClick={() => startVideoCall('audio')}
                type="text"
                shape="circle"
                key="audio"
              >
                <Icon type="PHONE_PICK" width={24} height={24}></Icon>
              </Button>
            )
          );
        } else if (item === 'VIDEO') {
          return (
            showVideoCall &&
            useCallkit && (
              <Button
                onClick={() => startVideoCall('video')}
                type="text"
                shape="circle"
                key="video"
              >
                <Icon type="VIDEO_CAMERA" width={24} height={24}></Icon>
              </Button>
            )
          );
        } else {
          return item;
        }
      });
      return dom;
    } else {
      console.warn('suffixIcon is not valid');
      return null;
    }
  };
  const { width, height } = useScreen();
  const [callKitSize, setCallKitSize] = useState(
    isMobile ? { width: width, height: height } : { width: 748, height: 523 },
  );

  // 为 CallKit 创建 Portal 容器，避免随 Chat 容器的 display:none 一起隐藏
  const [callkitContainer, setCallkitContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('callkit-portal-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'callkit-portal-root';
      document.body.appendChild(el);
    }
    setCallkitContainer(el);
  }, []);
  const handleLayoutModeChange = (layoutMode: 'grid' | 'main') => {
    if (layoutMode === 'main') {
      // 切换到主视频模式时，调整为竖屏尺寸
      const newSize = isMobile ? { width: width, height: height } : { width: 512, height: 759 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }
    } else {
      // 切换到网格模式时，恢复正常尺寸
      const newSize = isMobile ? { width: width, height: height } : { width: 748, height: 523 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }
    }
  };

  const messageInputRef = useRef<MessageInputRef>(null);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.stopRecording();
    }
  }, [CVS.conversationId]);

  const [isInCall, setIsInCall] = useState(false); // 是否在通话中, 通话中不允许录语音消息
  return (
    <div className={classString} style={{ ...style }}>
      {isEmpty ? (
        renderEmpty ? (
          renderEmpty()
        ) : (
          <Empty
            text={t('noConversation')}
            onClickBack={() => {
              otherHeaderProps?.onClickBack?.();
            }}
          ></Empty>
        )
      ) : (
        <>
          {renderHeader ? (
            // @ts-ignore
            renderHeader(rootStore.conversationStore.currentCvs)
          ) : (
            <Header
              avatarSrc={getChatAvatarUrl(CVS)}
              presence={{
                visible:
                  !!features?.conversationList?.item?.presence &&
                  CVS.chatType === 'singleChat' &&
                  typeof presenceMap !== 'undefined' &&
                  !CVS.conversationId.includes('chatbot'),
                icon:
                  presenceMap?.[
                    rootStore.addressStore.resolveUserInfo(CVS.conversationId).isOnline
                      ? rootStore.addressStore.resolveUserInfo(CVS.conversationId).presenceExt ??
                        'Online'
                      : 'Offline'
                  ] || presenceMap?.Custom,
              }}
              subtitle={
                !!features?.conversationList?.item?.presence &&
                CVS.chatType === 'singleChat' &&
                typeof presenceMap !== 'undefined' &&
                !CVS.conversationId.includes('chatbot') &&
                (rootStore.addressStore.resolveUserInfo(CVS.conversationId).isOnline
                  ? t(
                      rootStore.addressStore.resolveUserInfo(CVS.conversationId).presenceExt ?? '',
                    ) ?? t('Online')
                  : t('Offline'))
              }
              // 使用suffixIcon 代替， 遍历 suffixIcon
              suffixIcon={renderHeaderSuffixIcon()}
              content={
                rootStore.conversationStore.currentCvs.name ||
                rootStore.conversationStore.currentCvs.conversationId
              }
              moreAction={headerMoreAction}
              back={isMobile}
              {...otherHeaderProps}
            ></Header>
          )}
          {renderMessageList ? (
            renderMessageList()
          ) : (
            <MessageList
              {...messageListProps}
              onOpenThreadPanel={id => {
                onOpenThread?.({
                  id: id,
                });
              }}
              messageProps={{ ...messageProps, ...messageListProps?.messageProps }}
              onRtcInviteMessageClick={async message => {
                if (!callKitRef.current) return;
                try {
                  const msg = await callKitRef.current?.startSingleCall({
                    to: message.from === currentUserId ? message.to! : message.from!,
                    callType: message.ext?.type == 1 ? 'video' : 'audio',
                    msg: `邀请你进行${message.ext?.type == 1 ? '视频' : '语音'}通话`,
                  });
                  rootStore.messageStore.addMessage(
                    msg as ChatSDK.Message,
                    'singleChat',
                    msg?.to || '',
                  );
                  console.log('msg --->', msg);
                } catch (e) {
                  console.error(e);
                }
              }}
            ></MessageList>
          )}
          {messageInputProps?.enabledTyping && (
            <Typing
              conversation={rootStore.conversationStore.currentCvs}
              onHide={() => {
                rootStore.messageStore.setTyping(rootStore.conversationStore.currentCvs, false);
              }}
            ></Typing>
          )}

          {showReply &&
            (renderRepliedMessage ? (
              renderRepliedMessage(rootStore.messageStore.repliedMessage)
            ) : (
              <UnsentRepliedMsg type="summary"></UnsentRepliedMsg>
            ))}

          {renderMessageInput ? (
            renderMessageInput()
          ) : (
            <MessageInput
              {...messageInputConfig}
              {...messageInputProps}
              ref={messageInputRef}
              disableRecorder={isInCall}
              disableRecorderTitle={isInCall ? (t('inCallDisabledRecorder') as string) : ''}
            ></MessageInput>
          )}
        </>
      )}

      {currentUserId &&
        useCallkit &&
        callkitContainer &&
        createPortal(
          <CallKit
            ref={callKitRef}
            chatClient={rootStore.client}
            initialSize={callKitSize}
            managedPosition={true}
            resizable={true}
            draggable={true}
            outgoingRingtoneSrc={outgoingRingtone}
            incomingRingtoneSrc={incomingRingtone}
            enableRingtone={true}
            ringtoneVolume={0.8}
            ringtoneLoop={true}
            onEndCallWithReason={(reason, callInfo) => {
              console.log('🚀 onEndCallWithReason 接收到通话结束信22', reason, callInfo);
              if (!callInfo.inviteMessageId) {
                return;
              }
              if (callInfo.type === 0 || callInfo.type === 1) {
                let msg = '';
                switch (reason) {
                  case 'hangup':
                    msg = `通话时长${callInfo.duration}`;
                    break;
                  case 'noResponse':
                    msg = '未接听';
                    break;
                  case 'remoteNoResponse':
                    msg = '对方未接听';
                    break;
                  case 'cancel':
                    msg = '已取消';
                    break;
                  case 'busy':
                    msg = '对方正忙';
                    break;
                  case 'abnormalEnd':
                    msg = '通话中断';
                    break;
                  case 'remoteCancel':
                    msg = '对方已取消';
                    break;
                  case 'refuse':
                    msg = '已拒绝';
                    break;
                  case 'remoteRefuse':
                    msg = '对方已拒绝';
                    break;
                  case 'handleOnOtherDevice':
                    msg = '已在其他设备处理';
                    break;
                  default:
                    msg = '通话已结束';
                    break;
                }
                rootStore.messageStore.updateMessage({
                  messageId: callInfo.inviteMessageId,
                  chatType: 'singleChat',
                  to:
                    callInfo.calleeUserId === currentUserId
                      ? callInfo.callerUserId!
                      : callInfo.calleeUserId!,
                  msg: msg,
                });
              } else {
                rootStore.messageStore.updateMessage({
                  messageId: callInfo.inviteMessageId,
                  chatType: 'groupChat',
                  to: callInfo.groupId!,
                  msg: `通话已结束`,
                });
              }
              console.log('onEndCallWithReason --->', reason, callInfo);
            }}
            onLayoutModeChange={handleLayoutModeChange}
            initialPosition={{
              left: window.innerWidth - callKitSize.width - 20,
              top: 21,
            }}
            showInvitationAvatar={true}
            showInvitationTimer={true}
            autoRejectTime={30}
            backgroundImage={callkit_bg}
            groupInfoProvider={async groupIds => {
              return groupIds.map(groupId => {
                return {
                  groupId: groupId,
                  groupName:
                    rootStore.addressStore.groups.find(item => item.groupId === groupId)?.name ||
                    groupId,
                  groupAvatar:
                    rootStore.addressStore.groups.find(item => item.groupId === groupId)
                      ?.avatarUrl || '',
                };
              });
            }}
            userInfoProvider={async userIds => {
              if (rootStore.shouldAutoFetchUserInfo()) {
                await getUsersInfo({ userIdList: userIds, withPresence: false }).catch(err => {
                  console.warn('get user info failed', err);
                });
              }
              return Promise.all(
                userIds.map(async userId => {
                  return {
                    userId: userId,
                    nickname: rootStore.addressStore.resolveUserInfo(userId).nickname,
                    avatarUrl: rootStore.addressStore.resolveUserInfo(userId).avatarUrl,
                  };
                }),
              );
            }}
            onRingtoneStart={() => {
              messageInputRef.current?.stopRecording();
            }}
            onCallStatusChanged={status => {
              if (status === 'connected' || status === 'ringing' || status === 'calling') {
                setIsInCall(true);
              } else {
                setIsInCall(false);
              }
            }}
            {...callkitProps}
          ></CallKit>,
          callkitContainer,
        )}
      <Modal
        open={deleteMessageModalOpen}
        title={t('deleteMessage')}
        onCancel={() => {
          setDeleteMessageModalOpen(false);
          setDeleteMessage(null);
        }}
        onOk={() => {
          if (!deleteMessage) return;
          const conversationId = getCvsIdFromMessage(deleteMessage);

          rootStore.messageStore.deleteMessage(
            {
              chatType: deleteMessage.conversationType || deleteMessage.chatType || 'singleChat',
              conversationId: conversationId,
            },
            getMessageId(deleteMessage),
          );
          setDeleteMessageModalOpen(false);
          setDeleteMessage(null);
        }}
      >
        <div>{`${t('Delete this message')}?`}</div>
      </Modal>
    </div>
  );
});

Chat = observer(Chat) as React.ForwardRefExoticComponent<ChatProps & React.RefAttributes<unknown>>;

Chat.displayName = 'Chat';
export { Chat };
// export default observer(Chat);
