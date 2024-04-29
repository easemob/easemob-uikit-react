import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../component/config/index';
import Avatar from '../../component/avatar';
import rootStore from '../store/index';
import { CurrentConversation } from '../store/ConversationStore';
import { observer } from 'mobx-react-lite';
export interface TypingProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  onHide?: () => void;
  onShow?: () => void;
  conversation: CurrentConversation;
}

const Typing = (props: TypingProps) => {
  const { prefix: customizePrefixCls, className, style, onHide, onShow, conversation } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('typing', customizePrefixCls);
  const classString = classNames(prefixCls, className);
  const visibleOut = rootStore.messageStore.typing[conversation.conversationId];
  const [visible, setVisible] = useState(false);
  let timer = useRef<string | number | NodeJS.Timeout | undefined>();
  const show = () => {
    setVisible(true);
    onShow?.();
    timer.current && clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      hide();
    }, 5000);
  };

  const hide = () => {
    setVisible(false);
    onHide?.();
    timer.current && clearTimeout(timer.current);
  };

  useEffect(() => {
    if (visibleOut) {
      show();
    } else {
      hide();
    }
  }, [visibleOut]);
  const avatarUrl = rootStore.addressStore.appUsersInfo[conversation.conversationId]?.avatarurl;
  const nickName = rootStore.addressStore.appUsersInfo[conversation.conversationId]?.nickname;
  return (
    <div className={classString} style={{ ...style, display: visible ? 'flex' : 'none' }}>
      <Avatar size={16} src={avatarUrl} style={{ fontSize: '12px' }}>
        {nickName || conversation.conversationId}
      </Avatar>
      <div className="loading">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  );
};

export default observer(Typing);
