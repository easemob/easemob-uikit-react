import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../component/config/index';
import Avatar from '../../component/avatar';
import { getStore } from '../store/index';
import { observer } from 'mobx-react-lite';
import { getUsersInfo } from '../utils/index';
import Button from '../../component/button';
import Icon from '../../component/icon';
import rootStore from '../store/index';
import { useTranslation } from 'react-i18next';
export interface UserProfileProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  userId: string;
}

const UserProfile = (props: UserProfileProps) => {
  const { prefix: customizePrefixCls, className, style, userId } = props;
  const { addressStore } = getStore();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('user-profile', customizePrefixCls);
  const classString = classNames(prefixCls, className);
  const { avatarurl, nickname, isOnline } = addressStore.appUsersInfo?.[userId] || {};
  const { t } = useTranslation();
  const { conversationStore } = rootStore;
  useEffect(() => {
    if (!addressStore.appUsersInfo?.[userId]) {
      getUsersInfo({
        userIdList: [userId],
      });
    }
  }, []);
  const isContact = addressStore.contacts.some(item => item.userId === userId);

  // start message
  const handleClickMessage = () => {
    conversationStore.addConversation({
      chatType: 'singleChat',
      conversationId: userId,
      name: nickname,
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
      name: nickname,
    });
  };

  // add contact
  const addContact = () => {
    setDisabled(true);
    addressStore.acceptContactInvite(userId);
  };

  const [disabled, setDisabled] = useState(false);
  return (
    <div className={classString} style={style}>
      <Avatar size={80} isOnline={isOnline} src={avatarurl}>
        {userId}
      </Avatar>
      <div className={`${prefixCls}-nick`}>{nickname}</div>
      <div className={`${prefixCls}-id`}>
        {t('user')} ID: {userId}
      </div>
      {isContact ? (
        <Button type="primary" className={`${prefixCls}-action-btn`} onClick={handleClickMessage}>
          <div className={`${prefixCls}-action`}>
            <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
            {t('message')}
          </div>
        </Button>
      ) : userId == rootStore.client.user ? null : (
        <Button
          type="primary"
          className={`${prefixCls}-action-btn`}
          onClick={addContact}
          disabled={disabled}
        >
          <div className={`${prefixCls}-action`}>
            <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
            {t('addContact')}
          </div>
        </Button>
      )}
    </div>
  );
};

export default observer(UserProfile);
