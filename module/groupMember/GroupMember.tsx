import React, { FC, useEffect, useRef, useState, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import List from '../../component/list';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import { useParentName } from '../hooks/dom';
import { useSize } from 'ahooks';
import { Search } from '../../component/input/Search';
import Header from '../header';
import { RootContext } from '../store/rootContext';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import UserItem, { UserInfoData } from '../../component/userItem';
import rootStore from '../store/index';
import { checkCharacter } from '../utils/index';

export interface GroupMemberProps {
  style?: React.CSSProperties;
  className?: string;
  prefix?: string;
  onItemClick?: (info: { id: string; type: 'contact' | 'group'; name: string }) => void;
  checkable?: boolean; // 是否显示checkbox
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
  groupMembers: any;
  onPrivateChat?: (userId: string) => void | boolean;
  onAddContact?: (userId: string) => void | boolean;
  onClickBack?: () => void;
}

const GroupMember: FC<GroupMemberProps> = props => {
  const {
    style,
    className,
    prefix,
    onItemClick,
    checkable,
    onCheckboxChange,
    groupMembers,
    onPrivateChat,
    onAddContact,
    onClickBack,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('group-member', prefix);
  const context = React.useContext(RootContext);
  const { rootStore, theme, features } = context;
  const { addressStore, conversationStore } = rootStore;
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const privateChat = (userId: string) => {
    console.log('privateChat', userId);
    const result = onPrivateChat?.(userId);
    if (result == false) return;
    let name = addressStore.appUsersInfo?.[userId]?.nickname;
    conversationStore.addConversation({
      chatType: 'singleChat',
      conversationId: userId,
      name: name,
      lastMessage: {
        time: Date.now(),
        type: 'txt',
        msg: '',
        id: '',
        chatType: 'singleChat',
        to: userId,
      },
      unreadCount: 0,
    });
    conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: userId,
      name: name,
    });
  };

  const addContact = (userId: string) => {
    console.log('addContact', userId);
    const result = onAddContact?.(userId);
    if (result == false) return;
    rootStore.addressStore.addContact(userId);
  };
  return (
    <div className={classString} style={{ ...style }}>
      <Header avatar={<></>} back content="群成员" onClickBack={onClickBack}></Header>
      <div className={`${prefixCls}-container`}>
        {groupMembers?.map((item: any) => {
          let name = addressStore.appUsersInfo?.[item.userId]?.nickname;
          if (item.attributes?.nickName) {
            name = item.attributes?.nickName;
          }
          return (
            <UserItem
              key={item.userId}
              data={{ userId: item.userId, nickname: name }}
              checkable={checkable}
              onCheckboxChange={onCheckboxChange}
              moreAction={{
                visible: true,
                icon: <Icon type="ELLIPSIS" color="#33B1FF" height={20}></Icon>,
                actions: [
                  {
                    content: item.isInContact ? '私聊' : '添加联系人',
                    onClick: () => {
                      item.isInContact ? privateChat(item.userId) : addContact(item.userId);
                    },
                  },
                ],
              }}
            ></UserItem>
          );
        })}
      </div>
    </div>
  );
};

export default observer(GroupMember);
