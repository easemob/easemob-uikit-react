import React, { useContext, useRef, useState, ReactNode } from 'react';
import classNames from 'classnames';
import { renderUserProfileProps } from '../baseMessage';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import type { AudioMessageType } from '../types/messageType';
import Avatar from '../../component/avatar';
import rootStore from '../store/index';
import { observer } from 'mobx-react-lite';
import { getCvsIdFromMessage } from '../utils';
import { AgoraChat } from 'agora-chat';
import { RootContext } from '../store/rootContext';
import Icon from '../../component/icon';
import heart from '../assets/gift/heart.png';
export interface ChatroomMessageProps {
  prefix?: string;
  className?: string;
  label?: string;
  prefixIcon?: ReactNode;
  avatar?: ReactNode;
  nickname?: string;
  content?: ReactNode;
  type: 'img' | 'txt';
}

const ChatroomMessage = (props: ChatroomMessageProps) => {
  const { prefix: customizePrefixCls, className, type = 'txt' } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-chatroom', customizePrefixCls);
  const classString = classNames(prefixCls, className);

  const renderText = (text: string) => {
    return <div>{text}</div>;
  };

  const renderGift = () => {
    return (
      <div className={`${prefixCls}-gift`}>
        <div>礼物</div>
        <img src={heart as any as string} alt="" className={`${prefixCls}-gift-img`} />
        <div className={`${prefixCls}-gift-number`}>+1</div>
      </div>
    );
  };

  return (
    <div className={classString}>
      <div className={`${prefixCls}-container`}>
        <div className={`${prefixCls}-header`}>
          <div className={`${prefixCls}-header-label`}>23:34</div>
          <Icon type="DELETE"></Icon>
          <Avatar size={20}>2</Avatar>
          <div className={`${prefixCls}-header-nick`}>nick name</div>
        </div>
        {type == 'img' && renderGift()}
        {type == 'txt' && renderText('qwqwqasdaswe')}
      </div>
    </div>
  );
};

export default observer(ChatroomMessage);
