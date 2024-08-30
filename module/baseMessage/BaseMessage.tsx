import React, { ChangeEvent, ReactNode, useContext, useEffect, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import './style/style.scss';
import { cloneElement } from '../../component/_utils/reactNode';
import { getConversationTime, getGroupItemFromGroupsById, getMsgSenderNickname } from '../utils';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Icon from '../../component/icon';
import { RepliedMsg } from '../repliedMessage';
import { ChatSDK } from '../SDK';
import { useTranslation } from 'react-i18next';
import { EmojiKeyBoard } from '../reaction';
import { ReactionMessage, ReactionData, ReactionMessageProps } from '../reaction';
import rootStore, { getStore } from '../store';
import Checkbox from '../../component/checkbox';
import UserProfile from '../userProfile';
import { observer } from 'mobx-react-lite';
import { EmojiConfig } from '../messageInput/emoji/Emoji';
import { RootContext } from '../store/rootContext';
interface CustomAction {
  visible: boolean;
  icon?: ReactNode;
  actions?: {
    visible?: boolean;
    icon?: ReactNode;
    content?: string;
    onClick?: (message: BaseMessageType) => void;
  }[];
}

export type BaseMessageType = Exclude<
  ChatSDK.MessageBody,
  ChatSDK.DeliveryMsgBody | ChatSDK.ReadMsgBody | ChatSDK.ChannelMsgBody
>;

export interface renderUserProfileProps {
  userId: string;
}

export interface BaseMessageProps {
  id?: string;
  reactionData?: ReactionData[];
  bubbleType?: 'primary' | 'secondly' | 'none'; // 气泡类型
  bubbleStyle?: React.CSSProperties;
  status?: MessageStatusProps['status'];
  avatar?: ReactNode;
  avatarShape?: 'circle' | 'square';
  showAvatar?: boolean;
  showMessageInfo?: boolean;
  direction?: 'ltr' | 'rtl'; // 左侧布局/右侧布局
  prefix?: string;
  shape?: 'ground' | 'square'; // 气泡形状
  arrow?: boolean; // 气泡是否有箭头
  nickName?: string; // 昵称
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  time?: number;
  hasRepliedMsg?: boolean;
  repliedMessage?: ChatSDK.MessageBody;
  customAction?: CustomAction; // whether show more
  reaction?: boolean; // whether show reaction
  select?: boolean; // whether show message checkbox
  messageStatus?: boolean; // whether show message status
  message?: BaseMessageType;
  onReplyMessage?: () => void;
  onDeleteMessage?: () => void;
  onAddReactionEmoji?: (emojiString: string) => void;
  onDeleteReactionEmoji?: (emojiString: string) => void;
  onShowReactionUserList?: (emojiString: string) => void;
  onRecallMessage?: (message: BaseMessageType) => void;
  onTranslateMessage?: () => void;
  onModifyMessage?: () => void;
  onSelectMessage?: () => void; // message select action handler
  onResendMessage?: () => void;
  onForwardMessage?: (message: BaseMessageType) => void;
  onReportMessage?: (message: BaseMessageType) => void;
  onPinMessage?: () => void;
  onMessageCheckChange?: (checked: boolean) => void;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onCreateThread?: () => void;
  thread?: boolean; // whether show thread
  chatThreadOverview?: ChatSDK.ChatThreadOverview;
  onClickThreadTitle?: () => void;
  reactionConfig?: ReactionMessageProps['reactionConfig'];
  formatDateTime?: (time: number) => string;
}

const msgSenderIsCurrentUser = (message: BaseMessageType) => {
  return message?.from === getStore().client.user || message?.from === '';
};

const isGroupAdmin = (message: BaseMessageType) => {
  if (message.chatType === 'groupChat') {
    const group = getGroupItemFromGroupsById(message.to);
    if (group) {
      return group.admins?.includes(getStore().client.user);
    }
  }
};

const isGroupOwner = (message: BaseMessageType) => {
  if (message.chatType === 'groupChat') {
    const group = getGroupItemFromGroupsById(message.to);
    if (group) {
      return (
        group.members?.find(member => member.role === 'owner')?.userId === getStore().client.user
      );
    }
  }
};

// if can modify the message
const canModifyMessage = (message: BaseMessageType) => {
  const { chatType } = message;
  if (chatType === 'singleChat') {
    return msgSenderIsCurrentUser(message);
  } else if (chatType === 'groupChat') {
    return true;
  }
};

let BaseMessage = (props: BaseMessageProps) => {
  const {
    message,
    avatar,
    avatarShape = 'circle',
    showAvatar = true,
    showMessageInfo = true,
    direction = 'ltr',
    status = 'default',
    prefix: customizePrefixCls,
    className,
    bubbleType = 'primary',
    style,
    bubbleStyle,
    time,
    nickName,
    shape = 'ground',
    arrow,
    hasRepliedMsg = false,
    onReplyMessage,
    repliedMessage,
    onDeleteMessage,
    id,
    reactionData,
    onAddReactionEmoji,
    onDeleteReactionEmoji,
    onShowReactionUserList,
    onRecallMessage,
    customAction,
    reaction = true,
    onTranslateMessage,
    onModifyMessage,
    onSelectMessage,
    onResendMessage,
    onForwardMessage,
    onReportMessage,
    onPinMessage,
    onMessageCheckChange,
    renderUserProfile,
    onCreateThread,
    select = false,
    thread = true,
    messageStatus = true,
    chatThreadOverview,
    onClickThreadTitle,
    reactionConfig,
    formatDateTime,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('message-base', customizePrefixCls);
  let avatarToShow: ReactNode = avatar;
  const [hoverStatus, setHoverStatus] = useState(false);
  const { appUsersInfo, groups } = getStore().addressStore;
  const msgSenderNickname = nickName || (message && getMsgSenderNickname(message));
  const userId = message?.from || '';
  if (avatar) {
    avatarToShow = avatar;
  } else {
    let shape = avatarShape;
    if (theme?.avatarShape) {
      shape = theme?.avatarShape;
    }
    avatarToShow = (
      <Avatar src={appUsersInfo?.[userId]?.avatarurl} shape={shape}>
        {appUsersInfo?.[userId]?.nickname || userId}
      </Avatar>
    );
  }

  let bubbleShape = shape;
  let bubbleArrow = arrow;
  if (theme?.bubbleShape) {
    bubbleShape = theme?.bubbleShape;
  }
  if (bubbleShape == 'square' && typeof arrow == 'undefined') {
    bubbleArrow = true;
  }
  if (message?.type == 'video' || message?.type == 'img') {
    bubbleArrow = false;
  }
  const showRepliedMsg =
    typeof repliedMessage == 'object' && typeof repliedMessage.type == 'string';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-left`]: direction == 'ltr',
      [`${prefixCls}-right`]: direction == 'rtl',
      [`${prefixCls}-hasAvatar`]: !!avatar,
      [`${prefixCls}-${bubbleType}`]: !!bubbleType,
      [`${prefixCls}-${bubbleShape}`]: !!bubbleShape,
      [`${prefixCls}-arrow`]: !!bubbleArrow,
      [`${prefixCls}-reply`]: showRepliedMsg && bubbleShape === 'ground',
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const hasBubble = bubbleType !== 'none';

  const CustomProfile = renderUserProfile?.({ userId: message?.from || '' });

  const clickThreadTitle = () => {
    onClickThreadTitle?.();
  };
  const threadNode = () => {
    const { name, messageCount = 0, lastMessage = {} } = chatThreadOverview || {};

    const { from, type, time } = lastMessage || ({} as any);
    let msgContent = '';
    switch (type) {
      case 'txt':
        msgContent = (lastMessage as any).msg;
        break;
      case 'img':
        msgContent = '[图片]';
        break;
      case 'file':
        msgContent = '[文件]';
        break;
      case 'audio':
        msgContent = '[语音]';
        break;
      case 'video':
        msgContent = '[视频]';
        break;
      case 'custom':
        msgContent = '[自定义消息]';
        break;
      case 'combine':
        msgContent = '[合并消息]';
        break;
      default:
        msgContent = '';
        break;
    }
    return (
      <div className={`${prefixCls}-thread`}>
        <span className={`${prefixCls}-thread-line`}></span>
        <div className={`${prefixCls}-thread-name`} onClick={clickThreadTitle}>
          <div>
            <Icon
              width={20}
              height={20}
              type="THREAD"
              className={`${prefixCls}-thread-name-icon`}
            ></Icon>
            <span>{name}</span>
          </div>
          <div>
            <span>{messageCount > 100 ? '100 +' : messageCount}</span>
            <Icon
              width={16}
              height={16}
              type="ARROW_RIGHT"
              className={`${prefixCls}-thread-name-icon`}
            ></Icon>
          </div>
        </div>
        <div className={`${prefixCls}-thread-message`}>
          {msgContent && (
            <Avatar size={16} src={appUsersInfo?.[from]?.avatarurl}>
              {appUsersInfo?.[from]?.nickname || from}
            </Avatar>
          )}
          <span>{(appUsersInfo[from]?.nickname || from) as unknown as string}</span>
          <span>{msgContent}</span>
          <span>{formatDateTime?.(time) || getConversationTime(time)}</span>
        </div>
      </div>
    );
  };

  const contentNode = hasBubble ? (
    <div className={`${prefixCls}-content`} style={bubbleStyle}>
      {props.children}
      {thread && chatThreadOverview && threadNode()}
    </div>
  ) : (
    cloneElement(props.children, oriProps => ({
      style: {
        width: '100%',
        ...oriProps.style,
      },
    }))
  );

  let moreAction: CustomAction = { visible: false };

  useEffect(() => {
    if (!hoverStatus) {
      setMessageActionsOpen(false);
    }
  }, [hoverStatus]);
  if (customAction) {
    moreAction = customAction;
  } else {
    moreAction = {
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
        {
          content: 'FORWARD',
          onClick: () => {},
        },
        {
          content: 'REPORT',
          onClick: () => {},
        },
        {
          content: 'PIN',
          onClick: () => {},
        },
      ],
    };
  }

  // failed message only has 'resend', 'delete' action.
  if (status == 'failed') {
    moreAction = {
      visible: true,
      icon: null,
      actions: [
        {
          content: 'RESEND',
          onClick: () => {},
        },
        {
          content: 'DELETE',
          onClick: () => {},
        },
      ],
    };
  }

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  const isCurrentUser = message && msgSenderIsCurrentUser(message);
  const isOwner = message && isGroupOwner(message);
  const isAdmin = message && isGroupAdmin(message);

  const replyMessage = () => {
    onReplyMessage && onReplyMessage();
  };
  const deleteMessage = () => {
    onDeleteMessage && onDeleteMessage();
  };
  const recallMessage = () => {
    onRecallMessage && onRecallMessage(message as BaseMessageType);
  };
  const translateMessage = () => {
    onTranslateMessage && onTranslateMessage();
  };

  const modifyMessage = () => {
    onModifyMessage && onModifyMessage();
  };

  const selectMessage = () => {
    onSelectMessage && onSelectMessage();
  };

  const resendMessage = () => {
    onResendMessage && onResendMessage();
  };

  const forwardMessage = () => {
    onForwardMessage && onForwardMessage(message as BaseMessageType);
  };

  const reportMessage = () => {
    onReportMessage && onReportMessage(message as BaseMessageType);
  };

  const pinMessage = () => {
    setMessageActionsOpen(false);
    onPinMessage && onPinMessage();
  };

  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction?.actions?.map((item, index) => {
          if (item.content === 'DELETE' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={deleteMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? item.icon : <Icon type="DELETE" width={16} height={16}></Icon>}
                {t('delete')}
              </li>
            );
          } else if (item.content === 'REPLY' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={replyMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? (
                  item.icon
                ) : (
                  <Icon type="ARROW_TURN_LEFT" width={16} height={16}></Icon>
                )}

                {t('reply')}
              </li>
            );
          } else if (item.content === 'UNSEND' && item.visible !== false) {
            return (
              isCurrentUser && (
                <li
                  key={index}
                  onClick={recallMessage}
                  className={themeMode == 'dark' ? 'cui-li-dark' : ''}
                >
                  {item.icon ? item.icon : <Icon type="ARROW_BACK" width={16} height={16}></Icon>}

                  {t('unsend')}
                </li>
              )
            );
          } else if (item.content === 'TRANSLATE' && item.visible !== false) {
            return (
              message?.type === 'txt' && (
                <li
                  key={index}
                  onClick={translateMessage}
                  className={themeMode == 'dark' ? 'cui-li-dark' : ''}
                >
                  {item.icon ? item.icon : <Icon type="TRANSLATION" width={16} height={16}></Icon>}
                  {t('translate')}
                </li>
              )
            );
          } else if (item.content === 'Modify' && item.visible !== false) {
            return (
              (isCurrentUser || isOwner || isAdmin) &&
              message?.type === 'txt' && (
                <li
                  key={index}
                  onClick={modifyMessage}
                  className={themeMode == 'dark' ? 'cui-li-dark' : ''}
                >
                  {item.icon ? (
                    item.icon
                  ) : (
                    <Icon type="MODIFY_MESSAGE" width={16} height={16}></Icon>
                  )}
                  {t('modify')}
                </li>
              )
            );
          } else if (item.content === 'SELECT' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={selectMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? item.icon : <Icon type="SELECT" width={16} height={16}></Icon>}
                {t('select')}
              </li>
            );
          } else if (item.content === 'RESEND' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={resendMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? item.icon : <Icon type="LOOP" width={16} height={16}></Icon>}
                {t('resend')}
              </li>
            );
          } else if (item.content === 'FORWARD' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={forwardMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? (
                  item.icon
                ) : (
                  <Icon type="ARROW_TURN_RIGHT" width={16} height={16}></Icon>
                )}
                {t('forward')}
              </li>
            );
          } else if (item.content === 'REPORT' && item.visible !== false) {
            return (
              <li
                key={index}
                onClick={reportMessage}
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              >
                {item.icon ? item.icon : <Icon type="ENVELOPE" width={16} height={16}></Icon>}
                {t('report')}
              </li>
            );
          } else if (item.content === 'PIN') {
            return (
              message?.chatType !== 'singleChat' &&
              !message?.chatThread && (
                <li
                  key={index}
                  onClick={pinMessage}
                  className={themeMode == 'dark' ? 'cui-li-dark' : ''}
                >
                  <Icon type="PIN" width={16} height={16}></Icon>
                  {t('Pin')}
                </li>
              )
            );
          }

          if (item.visible !== false) {
            return (
              <li
                className={themeMode == 'dark' ? 'cui-li-dark' : ''}
                key={index}
                onClick={() => {
                  item.onClick?.(message as BaseMessageType);
                }}
              >
                {item.icon && item.icon}
                {item.content}
              </li>
            );
          } else {
            return null;
          }
        })}
      </ul>
    );
  }

  // 音视频邀请消息去掉更多操作
  let isRtcInviteMessage = false;
  if (message?.type === 'txt' && message?.ext?.msgType === 'rtcCallWithAgora') {
    isRtcInviteMessage = true;
  }

  const handleClickEmoji = (emoji: string) => {
    onAddReactionEmoji && onAddReactionEmoji(emoji);
  };

  const handleDeleteReactionEmoji = (emoji: string) => {
    onDeleteReactionEmoji && onDeleteReactionEmoji(emoji);
  };

  const handleShowReactionUserList = (emoji: string) => {
    onShowReactionUserList && onShowReactionUserList(emoji);
  };

  const selectedList: string[] = [];
  if (reactionData) {
    reactionData.forEach(item => {
      if (item.isAddedBySelf) {
        selectedList.push(item.reaction);
      }
    });
  }

  // ---- select message ------
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const result = e.target.checked;
    onMessageCheckChange?.(result);
  };

  // ------ thread -----
  const handleClickThreadIcon = () => {
    onCreateThread?.();
  };

  const [messageActionsOpen, setMessageActionsOpen] = useState(false);
  return (
    <div>
      <div className="thread-container">
        {select && (
          <Checkbox shape={shape} className="checkbox" onChange={handleCheckboxChange}></Checkbox>
        )}
        <div
          id={id}
          className={classString}
          style={{ ...style }}
          onMouseOver={() => setHoverStatus(true)}
          onMouseLeave={() => {
            setHoverStatus(false);
          }}
        >
          <>
            {showAvatar ? (
              renderUserProfile && !CustomProfile ? (
                <>{avatarToShow}</>
              ) : (
                <Tooltip
                  title={CustomProfile || <UserProfile userId={message?.from || ''} />}
                  trigger="click"
                  placement="topLeft"
                >
                  {avatarToShow}
                </Tooltip>
              )
            ) : (
              <></>
            )}
          </>

          <div className={`${prefixCls}-box`}>
            <>
              {showMessageInfo ? (
                showRepliedMsg ? (
                  <RepliedMsg
                    message={repliedMessage as BaseMessageType}
                    shape={bubbleShape}
                    direction={direction}
                  ></RepliedMsg>
                ) : (
                  <div className={`${prefixCls}-info`}>
                    {message?.chatType !== 'singleChat' && !isCurrentUser && (
                      <span className={`${prefixCls}-nickname`}>{msgSenderNickname}</span>
                    )}
                  </div>
                )
              ) : (
                <></>
              )}
            </>

            <div className={`${prefixCls}-body`}>
              {contentNode}

              {hoverStatus && moreAction.visible && !select && !isRtcInviteMessage ? (
                <>
                  {moreAction.visible && (
                    <Tooltip
                      open={messageActionsOpen}
                      onOpenChange={value => {
                        setMessageActionsOpen(value);
                      }}
                      title={menuNode}
                      trigger="click"
                      placement={isCurrentUser ? 'bottomRight' : 'bottomLeft'}
                    >
                      {moreAction.icon || (
                        <Icon
                          // color="#919BA1"
                          type="ELLIPSIS"
                          className={`${prefixCls}-body-action`}
                          height={20}
                          width={20}
                        ></Icon>
                      )}
                    </Tooltip>
                  )}
                  {reaction && status != 'failed' && (
                    <EmojiKeyBoard
                      // @ts-ignore
                      reactionConfig={reactionConfig}
                      onSelected={handleClickEmoji}
                      selectedList={selectedList}
                      onDelete={handleDeleteReactionEmoji}
                      placement={isCurrentUser ? 'bottomRight' : 'bottomLeft'}
                    ></EmojiKeyBoard>
                  )}
                  {thread && !chatThreadOverview && status != 'failed' && (
                    <Icon
                      type="THREAD"
                      onClick={handleClickThreadIcon}
                      className={`${prefixCls}-body-action`}
                      height={20}
                      width={20}
                    ></Icon>
                  )}
                </>
              ) : showMessageInfo ? (
                <div className={`${prefixCls}-time-and-status-box`}>
                  {messageStatus && !isRtcInviteMessage && (
                    <MessageStatus status={status} type="icon"></MessageStatus>
                  )}
                  <span className={`${prefixCls}-time`}>
                    {formatDateTime?.(time as number) || getConversationTime(time as number)}
                  </span>
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
      {reactionData && reaction && (
        <ReactionMessage
          reactionConfig={reactionConfig}
          direction={direction}
          reactionData={reactionData}
          onClick={handleClickEmoji}
          onDelete={handleDeleteReactionEmoji}
          onShowUserList={handleShowReactionUserList}
        />
      )}
    </div>
  );
};

BaseMessage = observer(BaseMessage);
export { BaseMessage };
