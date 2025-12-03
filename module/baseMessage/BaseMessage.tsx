import React, { ChangeEvent, ReactNode, useContext, useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import './style/style.scss';
import { cloneElement } from '../../component/_utils/reactNode';
import { getConversationTime, getGroupItemFromGroupsById, getMsgSenderNickname } from '../utils';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Icon from '../../component/icon';
import { RepliedMsg, CustomMessageQuoteRenderer } from '../repliedMessage';
import { ChatSDK } from '../SDK';
import { useTranslation } from 'react-i18next';
import { EmojiKeyBoard, EmojiKeyBoardRef } from '../reaction';
import { ReactionMessage, ReactionData, ReactionMessageProps } from '../reaction';
import rootStore, { getStore } from '../store';
import Checkbox from '../../component/checkbox';
import UserProfile from '../userProfile';
import { observer } from 'mobx-react-lite';
import { EmojiConfig } from '../messageInput/emoji/Emoji';
import { RootContext } from '../store/rootContext';
import { use } from 'i18next';
import { useIsMobile } from '../hooks/useScreen';
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
  shape?: 'round' | 'square'; // 气泡形状
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
  onDeleteMessage?: (message: BaseMessageType) => void;
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
  showNicknamesForAllMessages?: boolean; //是否所有的消息都展示昵称，默认false, 自己发的消息不展示昵称，单聊消息不展示昵称，群聊其他人的消息展示昵称
  onClickThreadTitle?: () => void;
  reactionConfig?: ReactionMessageProps['reactionConfig'];
  formatDateTime?: (time: number) => string;
  onClick?: (message: ChatSDK.MessageBody) => boolean; // 点击时是否阻止默认事件
  /** 自定义消息被引用时的渲染器 */
  renderCustomMessageQuote?: CustomMessageQuoteRenderer;
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

const getRtcMsgIcon = (message: BaseMessageType) => {
  // @ts-ignore
  if (message?.ext?.rtcIsEnd || !message?.mid) {
    if (message?.ext?.type === 0) {
      return 'PHONE_HANG';
    } else {
      return 'VIDEO_CAMERA';
    }
  } else {
    return 'PHONE_PICK';
  }
};

// 全局状态：当前打开的菜单
let currentOpenMenuId: string | null = null;
const menuOpenCallbacks = new Map<string, (shouldClose: boolean) => void>();

// 注册菜单
const registerMenu = (menuId: string, callback: (shouldClose: boolean) => void) => {
  menuOpenCallbacks.set(menuId, callback);
};

// 注销菜单
const unregisterMenu = (menuId: string) => {
  menuOpenCallbacks.delete(menuId);
};

// 打开菜单时，关闭其他所有菜单
const openMenu = (menuId: string) => {
  if (currentOpenMenuId && currentOpenMenuId !== menuId) {
    const closeCallback = menuOpenCallbacks.get(currentOpenMenuId);
    closeCallback?.(true);
  }
  currentOpenMenuId = menuId;
};

// 关闭菜单
const closeMenu = (menuId: string) => {
  if (currentOpenMenuId === menuId) {
    currentOpenMenuId = null;
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
    shape = 'round',
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
    showNicknamesForAllMessages = false,
    chatThreadOverview,
    onClickThreadTitle,
    reactionConfig,
    formatDateTime,
    onClick,
    renderCustomMessageQuote,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = useContext(RootContext);
  const { theme } = context;
  const isMobile = useIsMobile();
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('message-base', customizePrefixCls);
  let avatarToShow: ReactNode = avatar;
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
      <Avatar src={appUsersInfo?.[userId]?.avatarurl} shape={shape} size={24}>
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
      [`${prefixCls}-reply`]: showRepliedMsg && bubbleShape === 'round',
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const hasBubble = bubbleType !== 'none';

  const CustomProfile = renderUserProfile?.({ userId: message?.from || '' });

  // 生成唯一的菜单 ID
  const menuId = useRef(`menu-${message?.id || Math.random()}`).current;

  const [isButtonVisible, setIsButtonVisible] = useState(false); // 控制操作按钮的显示
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isReactionVisible, setIsReactionVisible] = useState(false); // 标记表情键盘的显示，显示时鼠标离开不会隐藏操作按钮
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const [forceInlineActionsOnMobile, setForceInlineActionsOnMobile] = useState(false);

  // 注册和注销菜单
  useEffect(() => {
    registerMenu(menuId, shouldClose => {
      if (shouldClose) {
        setIsPopoverOpen(false);
        setIsButtonVisible(false);
        setIsReactionVisible(false);
        setForceInlineActionsOnMobile(false);
      }
    });

    return () => {
      unregisterMenu(menuId);
      closeMenu(menuId);
    };
  }, [menuId]);

  // 处理菜单打开
  const handleMenuOpen = (open: boolean) => {
    if (open) {
      openMenu(menuId);
    } else {
      closeMenu(menuId);
    }
    setIsPopoverOpen(open);
    setIsButtonVisible(open);
  };

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

  let isRtcInviteMessage = false;
  if (message?.type === 'txt' && message?.ext?.msgType === 'rtcCallWithAgora') {
    isRtcInviteMessage = true;
  }
  const contentNode = hasBubble ? (
    <div
      className={`${prefixCls}-content`}
      style={bubbleStyle}
      onClick={() => {
        onClick?.(message as ChatSDK.MessageBody);
      }}
    >
      {isRtcInviteMessage ? (
        <div className="rtc-invite-message-container">
          {isRtcInviteMessage && direction === 'ltr' && (
            <Icon
              // @ts-ignore
              type={getRtcMsgIcon(message)}
              color={themeMode === 'dark' ? '#F1F2F3' : '#75828A'}
              width={22}
              height={22}
            ></Icon>
          )}
          {props.children}
          {isRtcInviteMessage && direction === 'rtl' && (
            <Icon
              color={themeMode === 'dark' ? '#C8CDD0' : '#F1F2F3'}
              // @ts-ignore
              type={getRtcMsgIcon(message)}
              width={22}
              height={22}
            ></Icon>
          )}
        </div>
      ) : (
        props.children
      )}
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
    handleMenuOpen(false);
    onReplyMessage && onReplyMessage();
  };
  const deleteMessage = () => {
    handleMenuOpen(false);
    onDeleteMessage && onDeleteMessage(message as BaseMessageType);
  };
  const recallMessage = () => {
    handleMenuOpen(false);
    onRecallMessage && onRecallMessage(message as BaseMessageType);
  };
  const translateMessage = () => {
    handleMenuOpen(false);
    onTranslateMessage && onTranslateMessage();
  };

  const modifyMessage = () => {
    handleMenuOpen(false);
    onModifyMessage && onModifyMessage();
  };

  const selectMessage = () => {
    handleMenuOpen(false);
    onSelectMessage && onSelectMessage();
  };

  const resendMessage = () => {
    handleMenuOpen(false);
    onResendMessage && onResendMessage();
  };

  const forwardMessage = () => {
    handleMenuOpen(false);
    onForwardMessage && onForwardMessage(message as BaseMessageType);
  };

  const reportMessage = () => {
    handleMenuOpen(false);
    onReportMessage && onReportMessage(message as BaseMessageType);
  };

  const pinMessage = () => {
    handleMenuOpen(false);
    onPinMessage && onPinMessage();
  };

  // 音视频邀请消息去掉更多操作
  // let isRtcInviteMessage = false;
  // if (message?.type === 'txt' && message?.ext?.msgType === 'rtcCallWithAgora') {
  //   isRtcInviteMessage = true;
  // }

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

  const reactionRef = useRef<EmojiKeyBoardRef>(null);
  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    const extraMobileItems: ReactNode[] = [];
    if (isMobile) {
      if (reaction && status != 'failed') {
        extraMobileItems.push(
          <li
            key="__mobile_reaction__"
            className={themeMode == 'dark' ? 'cui-li-dark' : ''}
            onClick={e => {
              handleMenuOpen(false); // 使用统一的关闭方法
              setForceInlineActionsOnMobile(true);
              reactionRef.current?.open?.();
            }}
          >
            <div
              onClick={e => {
                e.stopPropagation(); // 阻止冒泡到 li
              }}
            >
              <EmojiKeyBoard
                ref={reactionRef}
                // @ts-ignore
                reactionConfig={reactionConfig}
                onSelected={handleClickEmoji}
                selectedList={selectedList}
                onDelete={handleDeleteReactionEmoji}
                placement={isCurrentUser ? 'bottomRight' : 'bottomLeft'}
                onClick={e => {
                  setIsReactionVisible(true);
                }}
                onOpenChange={open => {
                  setIsReactionVisible(open);
                  setIsButtonVisible(open);
                }}
              ></EmojiKeyBoard>
            </div>
            {t('reaction')}
          </li>,
        );
      }
      if (thread && !chatThreadOverview && status != 'failed') {
        extraMobileItems.push(
          <li
            key="__mobile_thread__"
            className={themeMode == 'dark' ? 'cui-li-dark' : ''}
            onClick={() => {
              handleMenuOpen(false); // 使用统一的关闭方法
              handleClickThreadIcon();
            }}
          >
            <Icon type="HASHTAG_IN_BUBBLE_FILL" width={16} height={16}></Icon>
            {t('thread')}
          </li>,
        );
      }
    }

    menuNode = (
      <ul className={morePrefixCls}>
        {extraMobileItems}
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
              isCurrentUser &&
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

  // ---- select message ------
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const result = e.target.checked;
    onMessageCheckChange?.(result);
  };

  // ------ thread -----
  const handleClickThreadIcon = () => {
    onCreateThread?.();
  };

  const checkboxRef = useRef(null);
  return (
    <div>
      <div className="thread-container">
        {select && (
          <Checkbox
            ref={checkboxRef}
            shape={shape}
            className="checkbox"
            onChange={handleCheckboxChange}
          ></Checkbox>
        )}
        <div
          id={id}
          // onClick={e => {
          //   checkboxRef.current?.click?.();
          // }}
          className={classString}
          style={{ ...style, paddingLeft: select ? '38px' : '' }}
          onMouseOver={() => {
            // setHoverStatus(true)
            if (!isMobile) setIsButtonVisible(true);
          }}
          onMouseLeave={() => {
            // setHoverStatus(false);
            if (!isMobile && !isPopoverOpen && !isReactionVisible) {
              setIsButtonVisible(false);
            }
          }}
          onTouchStart={() => {
            if (!isMobile) return;
            longPressTriggeredRef.current = false;
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
            }
            longPressTimerRef.current = window.setTimeout(() => {
              handleMenuOpen(true); // 使用统一的打开方法
              longPressTriggeredRef.current = true;
            }, 600);
          }}
          onTouchEnd={() => {
            if (!isMobile) return;
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onTouchMove={() => {
            if (!isMobile) return;
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onContextMenu={e => {
            if (isMobile) e.preventDefault();
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
                    renderCustomMessageQuote={renderCustomMessageQuote}
                  ></RepliedMsg>
                ) : (
                  <div className={`${prefixCls}-info`}>
                    {((message?.chatType !== 'singleChat' && !isCurrentUser) ||
                      showNicknamesForAllMessages) && (
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

              {(isButtonVisible || (isMobile && forceInlineActionsOnMobile)) &&
              moreAction.visible &&
              !select &&
              !isRtcInviteMessage ? (
                <>
                  {moreAction.visible && (
                    <Tooltip
                      open={isPopoverOpen}
                      onOpenChange={value => {
                        handleMenuOpen(value);
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
                  {!isMobile && reaction && status != 'failed' && (
                    <EmojiKeyBoard
                      // @ts-ignore
                      reactionConfig={reactionConfig}
                      onSelected={handleClickEmoji}
                      selectedList={selectedList}
                      onDelete={handleDeleteReactionEmoji}
                      placement={isCurrentUser ? 'bottomRight' : 'bottomLeft'}
                      onClick={e => {
                        setIsReactionVisible(true);
                      }}
                      onOpenChange={open => {
                        setIsReactionVisible(open);
                        setIsButtonVisible(open);
                      }}
                    ></EmojiKeyBoard>
                  )}
                  {!isMobile && thread && !chatThreadOverview && status != 'failed' && (
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
              {/* {isRtcInviteMessage && <Icon type="STAR" width={16} height={16}></Icon>} */}
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
          style={{ padding: bubbleArrow ? '0 64px' : '0 60px' }}
        />
      )}
    </div>
  );
};

BaseMessage = observer(BaseMessage);
export { BaseMessage };
