import React, { useState, useEffect, useContext, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { RootContext } from '../store/rootContext';
import Icon from '../../component/icon';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Button from '../../component/button';
import './style/style.scss';
import Avatar from '../../component/avatar';
import { useTranslation } from 'react-i18next';
import { ChatSDK } from '../SDK';
import { usePinnedMessage } from '../hooks/usePinnedMessage';
export interface PinnedTextMessageProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  message: ChatSDK.PinnedMessageInfo;
}

const PinnedTextMessage = (props: PinnedTextMessageProps) => {
  const { children, className, style } = props;
  const context = useContext(RootContext);
  const { theme, rootStore } = context;
  const themeMode = theme?.mode || 'light';
  const { getPrefixCls } = useContext(ConfigContext);

  const prefixCls = getPrefixCls('pinned-text-message');
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEllipsis, setIsEllipsis] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
      [`${prefixCls}-expand`]: isExpanded,
    },
    className,
  );

  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
    if (isEllipsis) {
      setIsEllipsis(!isEllipsis);
    } else {
      setTimeout(() => {
        setIsEllipsis(!isEllipsis);
      }, 300);
    }
  };

  useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight, 10);
      const maxHeight = lineHeight * 2; // 两行的最大高度
      const actualHeight = textRef.current.scrollHeight; // 实际内容高度
      console.log('actualHeight', actualHeight, 'maxHeight', maxHeight);
      if (actualHeight > maxHeight) {
        setIsOverflowing(true); // 内容超过两行, 显示展开按钮
        setIsEllipsis(true); // 默认显示省略号
      } else {
        setIsEllipsis(false);
        setIsOverflowing(false);
        setIsExpanded(false);
      }
    }
  }, [props.message]);

  const expandBtnCls = classNames(`${prefixCls}-button`, {
    [`${prefixCls}-button-expand`]: isExpanded,
  });

  const { pinMessage, unpinMessage, clearPinnedMessages, getPinnedMessages, list } =
    usePinnedMessage({
      conversation: {
        conversationType: 'chatRoom',
        conversationId: props.message.message?.to,
      },
    });

  const handleUnpinMessage = () => {
    console.log('unpin message', props.message);
    // @ts-ignore
    unpinMessage(props.message.message.mid || props.message.message.id);
    clearPinnedMessages();
  };

  const pinedMsg = props.message.message as ChatSDK.TextMsgBody;
  const userInfo = pinedMsg?.ext?.chatroom_uikit_userInfo || {};
  return (
    <div className={classString} style={style}>
      <div className={`${prefixCls}-text`} ref={textRef}>
        <div className={`${prefixCls}-text-header`}>
          <Icon
            width={20}
            height={20}
            type="PIN"
            color={themeMode == 'light' ? '#F9FAFA' : '#464E53'}
          ></Icon>
          <Avatar size={20} src={userInfo.avatarURL}>
            {userInfo.nickname}
          </Avatar>
          <div className={`${prefixCls}-text-name`}>{userInfo.nickname}</div>
        </div>
        <div>{pinedMsg.msg}</div>
        {
          //超出后显示省略号
          isEllipsis && <span className={`${prefixCls}-ellipsis`}>...</span>
        }
      </div>
      <div className={`${prefixCls}-buttons`}>
        <Tooltip
          title={
            <ul className="cui-moreAction">
              <li style={{ display: 'flex', alignItems: 'center' }} onClick={handleUnpinMessage}>
                <Icon type="UNPIN" width={16} height={16}></Icon>
                {t('Remove pin message')}
              </li>
            </ul>
          }
          trigger="click"
          placement="bottomRight"
        >
          {props.message.operatorId === rootStore.client.user && (
            <Icon type="ELLIPSIS" width={16} height={16} className={`${prefixCls}-button`} />
          )}
        </Tooltip>

        {isOverflowing && (
          <Icon
            type="ARROW_DOWN"
            className={expandBtnCls}
            width={16}
            height={16}
            onClick={toggleExpand}
          />
        )}
      </div>
    </div>
  );
};

export { PinnedTextMessage };
