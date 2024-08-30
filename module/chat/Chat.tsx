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
import CallKit from 'chat-callkit';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { reportType } from '../chatroom/Chatroom';
import { eventHandler } from '../../eventHandler';
import Modal from '../../component/modal';
import Checkbox from '../../component/checkbox';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
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
  headerProps?: HeaderProps;
  messageListProps?: MsgListProps;
  messageInputProps?: MessageInputProps;

  rtcConfig?: {
    appId: string;
    agoraUid: string | number;
    onInvite?: (data: {
      channel: string;
      conversation: CurrentConversation;
      type: 'audio' | 'video';
    }) => Promise<[{ name: string; id: string; avatarurl?: string }]>;
    onAddPerson?: (data: RtcRoomInfo) => Promise<[{ id: string }]>;
    getIdMap?: (data: { userId: string; channel: string }) => Promise<{ [key: string]: string }>;
    onStateChange?: (data: { type: string; confr: any }) => void;
    getRTCToken?: (data: {
      channel: number | string;
      chatUserId: string; // chat user ID
    }) => Promise<{
      agoraUid: string | number; // rtc user ID
      accessToken: string;
    }>;
    groupAvatar?: string;
    onRing?: (data: { channel: string }) => void;
  };
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

const Chat = forwardRef((props: ChatProps, ref) => {
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
    rtcConfig,
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
  useContacts();
  const getRTCToken = rtcConfig?.getRTCToken;
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
  const [currentCall, setCurrentCall] = useState<any>({});
  const showInvite = async (conf: any) => {
    // rtcConfig?.onAddPerson?.(conf);
    const members = await rtcConfig?.onAddPerson?.(conf);
    const rtcMembers = members?.map(item => {
      // @ts-ignore
      return item.id;
    });
    const options = {
      callType: currentCall.callType,
      chatType: 'groupChat',
      to: rtcMembers,
      // agoraUid: agoraUid,
      message: t(`Start a ${currentCall.callType == 2 ? 'video' : 'audio'} meeting`),
      groupId: conf.groupId,
      groupName: conf.groupName,
      accessToken: currentCall.accessToken,
      channel: currentCall.channel,
    };
    CallKit.startCall(options);
  };
  const handleCallStateChange = async (info: any) => {
    rtcConfig?.onStateChange?.(info);
    switch (info.type) {
      case 'hangup':
      case 'refuse':
        break;
      case 'user-published':
        // getIdMap
        if (!info.confr) return;
        try {
          const idMap =
            (await rtcConfig?.getIdMap?.({
              userId: rootStore.client.user,
              channel: info.confr.channel,
            })) || {};

          const membersId = Object.values(idMap);
          const userInfo = {};
          membersId.forEach(item => {
            // @ts-ignore
            userInfo[item] = {
              nickname: rootStore.addressStore.appUsersInfo[item]?.nickname,
              avatarUrl: rootStore.addressStore.appUsersInfo[item]?.avatarurl,
            };
          });
          if (idMap && Object.keys(idMap).length > 0) {
            CallKit.setUserIdMap(idMap);
            CallKit.setUserInfo(userInfo);
          }
        } catch (e) {
          console.error(e);
        }
        break;
      case 'accept':
        // let idMap =
        //   (await rtcConfig?.getIdMap?.({
        //     userId: rootStore.client.user,
        //     channel: info.callInfo.channel,
        //   })) || {};

        // let membersId = Object.values(idMap);
        // let userInfo = {};
        // membersId.forEach(item => {
        //   // @ts-ignore
        //   userInfo[item] = {
        //     nickname: rootStore.addressStore.appUsersInfo[item]?.nickname,
        //     avatarUrl: rootStore.addressStore.appUsersInfo[item]?.avatarurl,
        //   };
        // });
        // if (idMap && Object.keys(idMap).length > 0) {
        //   console.log('有人加入时设置', idMap, userInfo);
        //   CallKit.setUserIdMap(idMap);
        //   CallKit.setUserInfo(userInfo);
        // }
        break;
      default:
        break;
    }
  };
  const handleInvite = async (data: { channel: string; type: number; callerIMName: string }) => {
    if (!getRTCToken) return console.error('need getRTCToken method to get token');
    rtcConfig?.onRing?.(data);
    const { agoraUid, accessToken } = await getRTCToken({
      channel: data.channel,
      chatUserId: rootStore.client.user,
    });
    // --- 单人音视频被邀请方接听页面显示对方信息 --
    const idMap =
      (await rtcConfig?.getIdMap?.({
        userId: rootStore.client.user,
        channel: data.channel,
      })) || {};

    const membersId = Object.values(idMap);
    const userInfo: Record<string, any> = {};
    membersId.forEach(item => {
      // @ts-ignore
      userInfo[item] = {
        nickname: rootStore.addressStore.appUsersInfo[item]?.nickname,
        avatarUrl: rootStore.addressStore.appUsersInfo[item]?.avatarurl,
      };
    });
    userInfo[data.callerIMName] = {
      nickname: rootStore.addressStore.appUsersInfo[data.callerIMName]?.nickname,
      avatarUrl: rootStore.addressStore.appUsersInfo[data.callerIMName]?.avatarurl,
    };
    if (idMap && Object.keys(idMap).length > 0) {
      CallKit.setUserIdMap(idMap);
      CallKit.setUserInfo(userInfo);
    }

    setCurrentCall({
      ...data,
      accessToken,
      callType: data.type,
    });
    CallKit.answerCall(true, accessToken);
  };

  const startVideoCall = async (type: 'video' | 'audio') => {
    if (!getRTCToken) return console.error('need getRTCToken method to get token');
    const channel = String(Math.ceil(Math.random() * 100000000));
    const { agoraUid, accessToken } = await getRTCToken({
      channel: channel,
      chatUserId: rootStore.client.user,
    });

    if (type == 'video') {
      onVideoCall?.({
        channel,
      });
    } else {
      onAudioCall?.({
        channel,
      });
    }
    if (CVS.chatType === 'groupChat') {
      const members = await rtcConfig?.onInvite?.({ channel, conversation: CVS, type });
      const rtcMembers = members?.map(item => {
        return item.id;
      });
      const options = {
        callType: type == 'video' ? 2 : 3,
        chatType: 'groupChat',
        to: rtcMembers,
        agoraUid: agoraUid,
        message: t(`Start a ${type} meeting`),
        groupId: CVS.conversationId,
        groupName: CVS.name || '',
        accessToken,
        channel,
      };
      CallKit.startCall(options);
      setCurrentCall({
        channel,
        accessToken,
        groupId: CVS.conversationId,
        groupName: CVS.name || '',
        chatType: 'groupChat',
        callType: type == 'video' ? 2 : 3,
      });

      const userInfo = {};
      members?.forEach(item => {
        // @ts-ignore
        userInfo[item.id] = {
          nickname: item.name,
          avatarUrl: item.avatarurl,
        };
      });
      // @ts-ignore
      userInfo[rootStore.client.user] = {
        nickname: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.nickname,
        avatarUrl: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.avatarurl,
      };
      CallKit.setUserInfo(userInfo);

      return;
    }
    const options = {
      callType: type == 'video' ? 1 : 0,
      chatType: 'singleChat',
      to: CVS.conversationId,
      agoraUid,
      message: t(`Start a ${type} call`),
      accessToken,
      channel,
    };
    setCurrentCall({
      channel,
      accessToken,
      targetId: CVS.conversationId,
      targetName: CVS.name || '',
      chatType: 'singleChat',
      callType: type == 'video' ? 1 : 0,
    });

    CallKit.startCall(options);
    // }
    try {
      const idMap = await rtcConfig?.getIdMap?.({ userId: rootStore.client.user, channel });
      CallKit.setUserIdMap(idMap);
    } catch (e) {
      console.error(e);
    }

    CallKit.setUserInfo({
      [CVS.conversationId]: {
        nickname:
          rootStore.addressStore.appUsersInfo[CVS.conversationId]?.nickname || CVS.conversationId,
        avatarUrl: rootStore.addressStore.appUsersInfo[CVS.conversationId]?.avatarurl,
      },
      // @ts-ignore
      [rootStore.client.user]: {
        nickname: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.nickname,
        avatarUrl: rootStore.addressStore.appUsersInfo[rootStore.client.user]?.avatarurl,
      },
    });
  };

  useImperativeHandle(ref, () => ({
    startVideoCall: () => {
      startVideoCall('video');
    },
    startAudioCall: () => {
      startVideoCall('audio');
    },
  }));
  useEffect(() => {
    if (!rtcConfig || !rtcConfig.appId) {
      return;
    }
    CallKit.init(rtcConfig.appId, rtcConfig?.agoraUid, rootStore.client);
  }, [rtcConfig?.appId, rtcConfig?.agoraUid]);

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

  // not display rtc when rtcConfig is not set
  if (!rtcConfig) {
    showVideoCall = false;
    showAudioCall = false;
  }
  if (globalConfig?.header?.pinMessage === false) {
    showPinMessage = false;
  }

  // chatbot not display rtc
  if (CVS.conversationId?.indexOf('chatbot_') > -1) {
    showVideoCall = false;
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
              suffixIcon={
                <div>
                  {showPinMessage && (
                    <Button onClick={show} type="text" shape="circle">
                      <Icon width={24} height={24} type="PIN"></Icon>
                    </Button>
                  )}
                  {CVS.chatType == 'groupChat' && showHeaderThreadListBtn && (
                    <ThreadListExpandableIcon style={{ width: '540px' }}></ThreadListExpandableIcon>
                  )}
                  {showAudioCall && (
                    <Button onClick={() => startVideoCall('audio')} type="text" shape="circle">
                      <Icon type="PHONE_PICK" width={24} height={24}></Icon>
                    </Button>
                  )}
                  {showVideoCall && (
                    <Button onClick={() => startVideoCall('video')} type="text" shape="circle">
                      <Icon type="VIDEO_CAMERA" width={24} height={24}></Icon>
                    </Button>
                  )}
                </div>
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
            <MessageList
              {...messageListProps}
              onOpenThreadPanel={id => {
                onOpenThread?.({
                  id: id,
                });
              }}
              messageProps={{ ...messageProps, ...messageListProps?.messageProps }}
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
           
          )} */}
        </>
      )}
      <CallKit
        onAddPerson={showInvite}
        onStateChange={handleCallStateChange}
        onInvite={handleInvite}
        contactAvatar={rootStore.addressStore.appUsersInfo[currentCall.targetId]?.avatarurl}
        groupAvatar={
          <Avatar className="cui-callkit-groupAvatar" src={rtcConfig?.groupAvatar}>
            {CVS.name}
          </Avatar>
        }
      ></CallKit>
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
    </div>
  );
});

Chat.displayName = 'Chat';

export default observer(Chat);
