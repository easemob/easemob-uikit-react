import React, { ChangeEvent, ReactNode, useContext, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import './style/style.scss';
import { cloneElement } from '../../component/_utils/reactNode';
import { getConversationTime } from '../utils';
import Avatar from '../../component/avatar';
import { Tooltip } from '../../component/tooltip/Tooltip';
import { RootContext } from '../store/rootContext';
import Icon from '../../component/icon';
import { RepliedMsg } from '../repliedMessage';
import { AgoraChat } from 'agora-chat';
import { useTranslation } from 'react-i18next';
import { EmojiKeyBoard } from '../reaction';
import { ReactionMessage, ReactionData } from '../reaction';
import Checkbox from '../../component/checkbox';
interface CustomAction {
  visible: boolean;
  icon?: ReactNode;
  actions?: {
    icon?: ReactNode;
    content?: string;
    onClick?: () => void;
  }[];
}

export interface BaseMessageProps {
  // messageId: string; // 消息 id
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
  onReplyMessage?: () => void;
  onDeleteMessage?: () => void;
  id?: string;
  reactionData?: ReactionData[];
  onAddReactionEmoji?: (emojiString: string) => void;
  onDeleteReactionEmoji?: (emojiString: string) => void;
  onShowReactionUserList?: (emojiString: string) => void;
  onRecallMessage?: () => void;
  customAction?: CustomAction; // whether show more
  reaction?: boolean; // whether show reaction
  onTranslateMessage?: () => void;
  onModifyMessage?: () => void;
  onSelectMessage?: () => void; // message select action handler
  select?: boolean; // whether show message checkbox
  onMessageCheckChange?: (checked: boolean) => void;
}

const BaseMessage = (props: BaseMessageProps) => {
  const {
    // messageId,
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
    select,
  } = props;

  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-base', customizePrefixCls);
  let avatarToShow: ReactNode = avatar;
  const [hoverStatus, setHoverStatus] = useState(false);
  if (avatar) {
    avatarToShow = avatar;
  } else {
    avatarToShow = <Avatar>{nickName}</Avatar>;
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

  const contentNode = hasBubble ? (
    <div className={`${prefixCls}-content`} style={bubbleStyle}>
      {props.children}
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
              <li key={index} onClick={recallMessage}>
                <Icon type="ARROW_BACK" width={16} height={16} color="#5270AD"></Icon>
                {t('module.unsend')}
              </li>
            );
          } else if (item.content === 'TRANSLATE') {
            return (
              <li key={index} onClick={translateMessage}>
                <Icon type="TRANSLATION" width={16} height={16} color="#5270AD"></Icon>
                {t('module.translate')}
              </li>
            );
          } else if (item.content === 'Modify') {
            return (
              <li key={index} onClick={modifyMessage}>
                <Icon type="MODIFY_MESSAGE" width={16} height={16} color="#5270AD"></Icon>
                {t('module.modify')}
              </li>
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
                item.onClick?.();
              }}
            >
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
            console.log('leave');
            setHoverStatus(false);
          }}
        >
          {avatarToShow}
          <div className={`${prefixCls}-box`}>
            {showRepliedMsg ? (
              <RepliedMsg message={repliedMessage} shape={shape} direction={direction}></RepliedMsg>
            ) : (
              <div className={`${prefixCls}-info`}>
                <span className={`${prefixCls}-nickname`}>{nickName}</span>
                <span className={`${prefixCls}-time`}>{getConversationTime(time as number)}</span>
              </div>
            )}
            {/* <div className={`${prefixCls}-info`}>
          <span className={`${prefixCls}-nickname`}>{nickName}</span>
          <span className={`${prefixCls}-time`}>{getConversationTime(time as number)}</span>
        </div> */}

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

export { BaseMessage };
