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

export interface ChatroomMessageProps {
  prefix?: string;
  className?: string;
  label?: string;
  prefixIcon?: ReactNode;
  avatar?: ReactNode;
  nickname?: string;
  content?: ReactNode;
}

const ChatroomMessage = (props: ChatroomMessageProps) => {
  const { prefix: customizePrefixCls, className } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-chatroom', customizePrefixCls);
  const classString = classNames(prefixCls, className);

  return (
    <div className={classString}>
      <div className={`${prefixCls}-container`}>
        <div className={`${prefixCls}-header`}>
          <div className={`${prefixCls}-header-label`}>23:34</div>
          <Icon type="DELETE"></Icon>
          <Avatar size={20}>2</Avatar>
          <div className={`${prefixCls}-header-nick`}>nick name</div>
        </div>
        hao ar you asdj as ads asd0 asop daso aso aspop aopd aod ia-s 9ado ajd aj asj a kdj adlka
      </div>
    </div>
  );
};

export default observer(ChatroomMessage);
