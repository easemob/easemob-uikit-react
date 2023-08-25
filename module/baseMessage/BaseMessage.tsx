import React, { ChangeEvent, ReactNode, useContext, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import './style/style.scss';
import { cloneElement } from '../../component/_utils/reactNode';
import {
  getConversationTime,
  getGroupItemFromGroupsById,
  getGroupMemberIndexByUserId,
  getGroupMemberNickName,
} from '../utils';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Icon from '../../component/icon';
import { RepliedMsg } from '../repliedMessage';
import { AgoraChat } from 'agora-chat';
import { useTranslation } from 'react-i18next';
import { EmojiKeyBoard } from '../reaction';
import { ReactionMessage, ReactionData } from '../reaction';
import { getStore } from '../store';
import Checkbox from '../../component/checkbox';
import UserProfile from '../userProfile';
import { observer } from 'mobx-react-lite';

interface CustomAction {
  visible: boolean;
  icon?: ReactNode;
  actions?: {
    icon?: ReactNode;
    content?: string;
    onClick?: (message: BaseMessageType) => void;
  }[];
}

type BaseMessageType = Exclude<
  AgoraChat.MessageBody,
  AgoraChat.DeliveryMsgBody | AgoraChat.ReadMsgBody | AgoraChat.ChannelMsgBody
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
  repliedMessage?: AgoraChat.MessageBody;
  customAction?: CustomAction; // whether show more
  reaction?: boolean; // whether show reaction
  select?: boolean; // whether show message checkbox
  message?: BaseMessageType;
  onReplyMessage?: () => void;
  onDeleteMessage?: () => void;
  onAddReactionEmoji?: (emojiString: string) => void;
  onDeleteReactionEmoji?: (emojiString: string) => void;
  onShowReactionUserList?: (emojiString: string) => void;
  onRecallMessage?: () => void;
  onTranslateMessage?: () => void;
  onModifyMessage?: () => void;
  onSelectMessage?: () => void; // message select action handler
  onMessageCheckChange?: (checked: boolean) => void;
  renderUserProfile?: (props: renderUserProfileProps) => React.ReactNode;
  onCreateThread?: () => void;
  thread?: boolean; // whether show thread
  chatThreadOverview?: AgoraChat.ThreadOverview;
  onClickThreadTitle?: () => void;
}

const getMsgSenderNickname = (msg: BaseMessageType) => {
  const { chatType, from = '', to } = msg;
  const { appUsersInfo } = getStore().addressStore;
  if (chatType === 'groupChat') {
    let group = getGroupItemFromGroupsById(to);
    let memberIndex = (group && getGroupMemberIndexByUserId(group, from)) ?? -1;
    if (memberIndex > -1) {
      let memberItem = group?.members?.[memberIndex];
      if (memberItem) {
        return getGroupMemberNickName(memberItem) || appUsersInfo?.[from]?.nickname || from;
      }
      return appUsersInfo?.[from]?.nickname || from;
    }
    return appUsersInfo?.[from]?.nickname || from;
  } else {
    return appUsersInfo?.[from]?.nickname || from;
  }
};

let BaseMessage = (props: BaseMessageProps) => {
  const {
    message,
    avatar,
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
    arrow = false,
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
    onMessageCheckChange,
    renderUserProfile,
    onCreateThread,
    select,
    thread,
    chatThreadOverview,
    onClickThreadTitle,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-base', customizePrefixCls);
  let avatarToShow: ReactNode = avatar;
  const [hoverStatus, setHoverStatus] = useState(false);
  const { appUsersInfo } = getStore().addressStore;
  const isCurrentUser = message?.from === getStore().client.user || message?.from === '';

  const msgSenderNickname = nickName || (message && getMsgSenderNickname(message));
  const userId = message?.from || '';
  if (avatar) {
    avatarToShow = avatar;
  } else {
    avatarToShow = (
      <Avatar src={appUsersInfo?.[userId]?.avatarurl}>
        {appUsersInfo?.[userId]?.nickname || userId}
      </Avatar>
    );
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
      [`${prefixCls}-${shape}`]: !!shape,
      [`${prefixCls}-arrow`]: !!arrow,
      [`${prefixCls}-reply`]: showRepliedMsg && shape === 'ground',
    },
    className,
  );

  const hasBubble = bubbleType !== 'none';

  const CustomProfile = renderUserProfile?.({ userId: message?.from || '' });

  const clickThreadTitle = () => {
    console.log('click thread title');
    onClickThreadTitle?.();
  };
  const threadNode = () => {
    console.log('chatThreadOverview', chatThreadOverview);
    let { name, messageCount, lastMessage = {} } = chatThreadOverview;
    if (messageCount > 100) {
      messageCount = '100 +';
    }
    const { from, type, time } = lastMessage || {};
    let msgContent = '';
    switch (type) {
      case 'txt':
        msgContent = lastMessage.msg;
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
            <span>{messageCount}</span>
            <Icon
              width={16}
              height={16}
              type="ARROW_RIGHT"
              className={`${prefixCls}-thread-name-icon`}
            ></Icon>
          </div>
        </div>
        <div className={`${prefixCls}-thread-message`}>
          {msgContent && <Avatar size={16}>{from}</Avatar>}
          <span>{from}</span>
          <span>{msgContent}</span>
          <span>{getConversationTime(time)}</span>
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
        margin: '0 8px 0 12px',
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
      ],
    };
  }

  const morePrefixCls = getPrefixCls('moreAction', customizePrefixCls);

  const replyMessage = () => {
    onReplyMessage && onReplyMessage();
  };
  const deleteMessage = () => {
    onDeleteMessage && onDeleteMessage();
  };
  const recallMessage = () => {
    onRecallMessage && onRecallMessage();
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
  let menuNode: ReactNode | undefined;
  if (moreAction?.visible) {
    menuNode = (
      <ul className={morePrefixCls}>
        {moreAction?.actions?.map((item, index) => {
          if (item.content === 'DELETE') {
            return (
              <li key={index} onClick={deleteMessage}>
                <Icon type="DELETE" width={16} height={16} color="#5270AD"></Icon>
                {t('module.delete')}
              </li>
            );
          } else if (item.content === 'REPLY') {
            return (
              <li key={index} onClick={replyMessage}>
                <Icon type="ARROW_TURN_LEFT" width={16} height={16} color="#5270AD"></Icon>
                {t('module.reply')}
              </li>
            );
          } else if (item.content === 'UNSEND') {
            return (
              isCurrentUser && (
                <li key={index} onClick={recallMessage}>
                  <Icon type="ARROW_BACK" width={16} height={16} color="#5270AD"></Icon>
                  {t('module.unsend')}
                </li>
              )
            );
          } else if (item.content === 'TRANSLATE') {
            return (
              message?.type === 'txt' && (
                <li key={index} onClick={translateMessage}>
                  <Icon type="TRANSLATION" width={16} height={16} color="#5270AD"></Icon>
                  {t('module.translate')}
                </li>
              )
            );
          } else if (item.content === 'Modify') {
            return (
              isCurrentUser && (
                <li key={index} onClick={modifyMessage}>
                  <Icon type="MODIFY_MESSAGE" width={16} height={16} color="#5270AD"></Icon>
                  {t('module.modify')}
                </li>
              )
            );
          } else if (item.content === 'SELECT') {
            return (
              <li key={index} onClick={selectMessage}>
                <Icon type="SELECT" width={16} height={16} color="#5270AD"></Icon>
                {t('module.select')}
              </li>
            );
          }
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(message);
              }}
            >
              {item.icon && item.icon}
              {item.content}
            </li>
          );
        })}
      </ul>
    );
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
    console.log('create thread');
    onCreateThread?.();
  };
  return (
    <div>
      <div className="ttt">
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
          {renderUserProfile && !CustomProfile ? (
            <>{avatarToShow}</>
          ) : (
            <Tooltip
              title={CustomProfile || <UserProfile userId={message?.from || ''} />}
              trigger="click"
              placement="topLeft"
            >
              {avatarToShow}
            </Tooltip>
          )}

          <div className={`${prefixCls}-box`}>
            {showRepliedMsg ? (
              <RepliedMsg message={repliedMessage} shape={shape} direction={direction}></RepliedMsg>
            ) : (
              <div className={`${prefixCls}-info`}>
                <span className={`${prefixCls}-nickname`}>{msgSenderNickname}</span>
                <span className={`${prefixCls}-time`}>{getConversationTime(time as number)}</span>
              </div>
            )}
            <div className={`${prefixCls}-body`}>
              {contentNode}

              {hoverStatus ? (
                <>
                  {moreAction.visible && (
                    <Tooltip title={menuNode} trigger="click" placement="bottom">
                      {moreAction.icon || (
                        <Icon
                          type="ELLIPSIS"
                          className={`${prefixCls}-body-action`}
                          height={20}
                        ></Icon>
                      )}
                    </Tooltip>
                  )}
                  {reaction && (
                    <EmojiKeyBoard
                      onSelected={handleClickEmoji}
                      selectedList={selectedList}
                      onDelete={handleDeleteReactionEmoji}
                    ></EmojiKeyBoard>
                  )}
                  {thread && !chatThreadOverview && (
                    <Icon
                      type="THREAD"
                      onClick={handleClickThreadIcon}
                      className={`${prefixCls}-body-action`}
                      height={20}
                    ></Icon>
                  )}
                </>
              ) : (
                <MessageStatus status={status} type="icon"></MessageStatus>
              )}
            </div>
          </div>
        </div>
      </div>
      {reactionData && reaction && (
        <ReactionMessage
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
