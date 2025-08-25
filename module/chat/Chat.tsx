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
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import MessageInput, { MessageInputProps } from '../messageInput';
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
import { ChatSDK } from 'module/SDK';
import { getConversationTime, getCvsIdFromMessage, getMsgSenderNickname } from '../utils/index';
import CallKit, { CallKitRef } from '../callkit';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { reportType } from '../chatroom/Chatroom';
import { eventHandler } from '../../eventHandler';
import Modal from '../../component/modal';
import Checkbox from '../../component/checkbox';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
import outgoingRingtone from './拨打电话.mp3';
import incomingRingtone from './拨打电话.mp3';
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
  renderRepliedMessage?: (repliedMessage: ChatSDK.MessageBody | null) => ReactNode; // 自定义渲染Input上面的被回复的消息
  // Header 的 props
  headerProps?: Omit<HeaderProps, 'suffixIcon'> & {
    suffixIcon?: ('PIN' | 'THREAD' | 'AUDIO' | 'VIDEO' | ReactNode)[];
  };
  messageListProps?: MsgListProps;
  messageInputProps?: MessageInputProps;

  onOpenThread?: (data: { id: string }) => void;
  onOpenThreadList?: () => void;
  onVideoCall?: (data: { channel: string }) => void;
  onAudioCall?: (data: { channel: string }) => void;
}
const getChatAvatarUrl = (cvs: CurrentConversation) => {
  if (cvs.chatType === 'singleChat') {
    return getStore().addressStore.appUsersInfo[cvs.conversationId]?.avatarurl;
  } else if (cvs.chatType === 'groupChat') {
    const group = getStore().addressStore.groups.find(item => item.groupid === cvs.conversationId);
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
    onAudioCall,
    onVideoCall,
    renderRepliedMessage,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chat', customizePrefixCls);
  const { show } = usePinnedMessage();

  const [isEmpty, setIsEmpty] = useState(true);

  const context = useContext(RootContext);
  const { rootStore, features, theme, presenceMap } = context;
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
  const { suffixIcon, ...otherHeaderProps } = headerProps || {};
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
  let headerMoreAction = {
    visible: true,
    actions: [
      {
        content: t('clearMsgs'),
        onClick: () => {
          rootStore.messageStore.clearMessage(rootStore.conversationStore.currentCvs);
          rootStore.client.removeHistoryMessages({
            targetId: CVS.conversationId,
            chatType: CVS.chatType as 'singleChat' | 'groupChat',
            beforeTimeStamp: Date.now(),
          });
        },
      },
      {
        content: t('deleteCvs'),
        onClick: () => {
          rootStore.conversationStore.deleteConversation(rootStore.conversationStore.currentCvs);

          rootStore.client.deleteConversation({
            channel: CVS.conversationId,
            chatType: CVS.chatType as 'singleChat' | 'groupChat',
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

  const handleReport = (message: any) => {
    setReportOpen(true);
    setReportMessageId(message.mid || message.id);
  };

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
          content: 'REPORT',
          onClick: () => {},
        },

        {
          content: 'DELETE',
          onClick: () => {},
        },
      ],
    },
    onReportMessage: handleReport,
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
      if (globalConfig?.message?.report == false && item.content == 'REPORT') {
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

  const startVideoCall = async (type: 'video' | 'audio') => {
    if (CVS.chatType === 'groupChat') {
      const msg = await callKitRef.current?.startGroupCall({
        groupId: CVS.conversationId,
        callType: type,
        msg: '邀请你进行音视频通话',
      });
      if (msg) {
        rootStore.messageStore.addMessage(msg as ChatSDK.MessageBody, 'groupChat', msg.to!);
        console.log('msg --->', msg);
      }
      return;
    }

    try {
      const msg = await callKitRef.current?.startSingleCall({
        to: CVS.conversationId,
        callType: type,
        msg: `邀请你进行${type == 'video' ? '视频' : '语音'}通话`,
      });
      if (msg) {
        rootStore.messageStore.addMessage(msg as ChatSDK.MessageBody, 'singleChat', msg.to!);
        console.log('msg --->', msg);
      }
    } catch (e) {
      console.error(e);
    }
    // }
    // try {
    //   const idMap = await rtcConfig?.getIdMap?.({ userId: rootStore.client.user, channel });
    //   CallKit.setUserIdMap(idMap);
    // } catch (e) {
    //   console.error(e);
    // }

    // CallKit.setUserInfo({
    //   [CVS.conversationId]: {
    //     nickname:
    //       rootStore.addressStore.appUsersInfo[CVS.conversationId]?.nickname || CVS.conversationId,
    //     avatarUrl: rootStore.addressStore.appUsersInfo[CVS.conversationId]?.avatarurl,
    //   },
    //   // @ts-ignore
    //   [rootStore.client.user]: {
    //     nickname: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.nickname,
    //     avatarUrl: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.avatarurl,
    //   },
    // });
  };

  useImperativeHandle(ref, () => ({
    startVideoCall: () => {
      startVideoCall('video');
    },
    startAudioCall: () => {
      startVideoCall('audio');
    },
  }));

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

  // --- report ---
  const [reportMessageId, setReportMessageId] = useState('');
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
  const renderHeaderSuffixIcon = () => {
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
            showAudioCall && (
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
            showVideoCall && (
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

  const [callKitSize, setCallKitSize] = useState({ width: 748, height: 523 });
  const handleLayoutModeChange = (layoutMode: 'grid' | 'main') => {
    if (layoutMode === 'main') {
      // 切换到主视频模式时，调整为竖屏尺寸
      const newSize = { width: 512, height: 759 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }
    } else {
      // 切换到网格模式时，恢复正常尺寸
      const newSize = { width: 748, height: 523 };
      setCallKitSize(newSize);

      // 🔧 使用CallKit的adjustSize方法调整尺寸
      if (callKitRef.current) {
        callKitRef.current.adjustSize(newSize);
      }
    }
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
                    rootStore.addressStore.appUsersInfo[CVS.conversationId]?.isOnline
                      ? rootStore.addressStore.appUsersInfo[CVS.conversationId]?.presenceExt ??
                        'Online'
                      : 'Offline'
                  ] || presenceMap?.Custom,
              }}
              subtitle={
                !!features?.conversationList?.item?.presence &&
                CVS.chatType === 'singleChat' &&
                typeof presenceMap !== 'undefined' &&
                !CVS.conversationId.includes('chatbot') &&
                (rootStore.addressStore.appUsersInfo[CVS.conversationId]?.isOnline
                  ? t(rootStore.addressStore.appUsersInfo[CVS.conversationId]?.presenceExt ?? '') ??
                    t('Online')
                  : t('Offline'))
              }
              // 使用suffixIcon 代替， 遍历 suffixIcon
              suffixIcon={renderHeaderSuffixIcon()}
              content={
                rootStore.conversationStore.currentCvs.name ||
                rootStore.conversationStore.currentCvs.conversationId
              }
              moreAction={headerMoreAction}
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
                    to: message.from === rootStore.client.user ? message.to! : message.from!,
                    callType: (message as ChatSDK.TextMsgBody).ext?.type == 1 ? 'video' : 'audio',
                    msg: `邀请你进行${
                      (message as ChatSDK.TextMsgBody).ext?.type == 1 ? '视频' : '语音'
                    }通话`,
                  });
                  rootStore.messageStore.addMessage(
                    msg as ChatSDK.MessageBody,
                    'singleChat',
                    msg.to!,
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
            <MessageInput {...messageInputConfig} {...messageInputProps}></MessageInput>
          )}
          {/* {modalOpen && (
              MULTI_PARTY = 'multi-party', // 多人网格布局
  ONE_TO_ONE = 'one-to-one', // 1v1画中画布局
  PREVIEW = 'preview', // 预览布局（竖屏）
  SCREEN_SHARE = 'screen-share', // 屏幕共享布局
  MINIMIZED = 'minimized', // 最小化布局
  MAIN_VIDEO = 'main-video', // 主视频 + 缩略图布局
          )} */}
        </>
      )}

      {rootStore.client.user && (
        <CallKit
          ref={callKitRef}
          chatClient={rootStore.client}
          initialSize={callKitSize}
          managedPosition={true}
          resizable={true}
          draggable={true}
          outgoingRingtoneSrc={outgoingRingtone} // 铃声文件路径
          incomingRingtoneSrc={incomingRingtone} // 铃声文件路径
          enableRingtone={true} // 启用铃声
          ringtoneVolume={0.8} // 音量 80%
          ringtoneLoop={true} // 循环播放
          // onInvitationAccept={() => {
          //   callKitRef.current?.answerCall(true);
          // }}
          // onInvitationReject={() => {
          //   callKitRef.current?.answerCall(false);
          // }}
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
                  callInfo.calleeUserId === rootStore.client.user
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
            left: Math.max(0, (window.innerWidth - callKitSize.width) / 2),
            top: Math.max(0, window.scrollY + (window.innerHeight - callKitSize.height) / 2),
          }}
          onResize={(width, height) => console.log('窗口尺寸:', width, height)}
          // 可拖拽
          onDragStart={() => console.log('开始拖拽')}
          onDrag={position => console.log('拖拽位置:', position)}
          onDragEnd={() => console.log('拖拽结束')}
          // minimizedSize={{ width: 300, height: 300 }}
          // invitationCustomContent={<div style={{ color: '#fff' }}>123</div>}
          // 按钮文本
          acceptText="接听1"
          rejectText="拒绝1"
          // 邀请界面显示配置
          showInvitationAvatar={false}
          showInvitationTimer={false}
          autoRejectTime={30} // 30秒自动拒绝
        ></CallKit>
      )}
      <Modal
        open={reportOpen}
        title={t('report')}
        okText={t('report')}
        cancelText={t('cancel')}
        okButtonProps={{
          disabled: checkedType == '',
        }}
        onOk={handleReportMessage}
        onCancel={() => {
          setReportOpen(false);
        }}
      >
        <div>
          <div
            className={classNames('report-title', {
              'report-title-dark': themeMode == 'dark',
            })}
          >
            {t('Violation')}
          </div>
          {Object.keys(reportType).map((item, index) => {
            return (
              <div
                className={classNames('report-item', {
                  'report-item-dark': themeMode == 'dark',
                })}
                key={index}
                onClick={() => {
                  setCheckedType(item);
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
              chatType: deleteMessage.chatType,
              conversationId: conversationId,
            },
            // @ts-ignore
            deleteMessage.mid || deleteMessage.id,
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
