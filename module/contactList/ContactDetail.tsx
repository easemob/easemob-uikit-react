import React, { useEffect } from 'react';
import classNames from 'classnames';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Switch from '../../component/switch';
import Button from '../../component/button';
import { ConfigContext } from '../../component/config/index';
import rootStore from '../store/index';
import './style/style.scss';
import Empty from '../empty';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { useTranslation } from 'react-i18next';
export interface ContactDetailProps {
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  data:
    | {
        // avatar: string | React.ReactNode;
        id: string;
        name: string;
        type: 'contact' | 'group';
      }
    | {
        id: string;
        name: string;
        requestStatus: 'pending' | 'read' | 'accepted';
        type: 'request';
      };
  onUserIdCopied?: (id: string) => void;
  onMessageBtnClick?: () => void | boolean;
  onAudioCall?: () => void | boolean;
  onVideoCall?: () => void | boolean;
}

export const ContactDetail: React.FC<ContactDetailProps> = (props: ContactDetailProps) => {
  const {
    style,
    className,
    prefix,
    data,
    onUserIdCopied,
    onMessageBtnClick,
    onAudioCall,
    onVideoCall,
  } = props;

  const { type, id, name } = data;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contact-detail', prefix);
  const context = React.useContext(RootContext);
  const { rootStore, theme, features, presenceMap } = context;
  const requestData = rootStore.addressStore.requests.find((item: any) => item.from === id);
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const { addressStore, conversationStore } = rootStore;
  const userInfo = addressStore.appUsersInfo[id];
  let avatarUrl = userInfo?.avatarurl;
  let contactData: any;

  if (data.type === 'contact' || data.type === 'request') {
    contactData = addressStore.contacts.find((item: any) => item.userId === data.id);
  } else {
    contactData = addressStore.groups.find((item: any) => item.groupid === data.id);
    avatarUrl = contactData?.avatarUrl;
  }

  const handleCopy = () => {
    const textArea = document.createElement('textarea');
    textArea.value = id;
    // 添加到 DOM 元素中，方便调用 select 方法
    document.body.appendChild(textArea);
    // 选中文本
    textArea.select();
    // 执行复制命令
    document.execCommand('copy');
    // 删除临时元素
    document.body.removeChild(textArea);
    onUserIdCopied?.(id);
  };

  const handleNotificationChange = (e: { target: { checked: boolean } }) => {
    const result = e.target.checked;
    addressStore.setSilentModeForConversation(
      {
        conversationId: data.id,
        chatType: data.type === 'contact' ? 'singleChat' : 'groupChat',
      },
      result,
    );
  };

  const handleClickBtn = (type: 'message' | 'audio' | 'video') => {
    return () => {
      let result;
      if (type === 'message') {
        result = onMessageBtnClick?.();
      } else if (type === 'audio') {
        result = onAudioCall?.();
      } else if (type === 'video') {
        result = onVideoCall?.();
      }
      // const result = onMessageBtnClick?.();
      if (result == false) return;
      conversationStore.addConversation({
        chatType: data.type == 'contact' || data.type == 'request' ? 'singleChat' : 'groupChat',
        conversationId: data.id,
        name: userInfo?.nickname || data.name || id,
        lastMessage: {
          time: Date.now(),
          type: 'txt',
          msg: '',
          id: '',
          chatType: data.type == 'contact' || data.type == 'request' ? 'singleChat' : 'groupChat',
          to: data.id,
        },
        unreadCount: 0,
      });
      conversationStore.setCurrentCvs({
        chatType: data.type == 'contact' || data.type == 'request' ? 'singleChat' : 'groupChat',
        conversationId: data.id,
        name: userInfo?.nickname || data.name || id,
      });
    };
  };

  const addContact = () => {
    addressStore.acceptContactInvite(data.id);
  };
  const isContact = addressStore.contacts.findIndex((item: any) => item.userId === data.id) >= 0;

  return (
    <div className={classString} style={{ ...style }}>
      {data.id ? (
        <>
          <div className={`${prefixCls}-content`}>
            <div className={`${prefixCls}-content-header`}>
              <Avatar
                src={avatarUrl}
                size={100}
                shape={theme?.avatarShape}
                presence={{
                  visible:
                    data.type !== 'group' &&
                    features?.conversationList?.item?.presence &&
                    data.type !== 'request' &&
                    !id.includes('chatbot'),
                  icon:
                    presenceMap?.[
                      rootStore.addressStore.appUsersInfo[id]?.isOnline
                        ? rootStore.addressStore.appUsersInfo[id]?.presenceExt ?? 'Online'
                        : 'Offline'
                    ] || presenceMap?.Custom,
                }}
              >
                {userInfo?.nickname || name || id}
              </Avatar>
              <div>
                <div className={`${prefixCls}-content-header-name`}>
                  {userInfo?.nickname || name || id}
                </div>

                <div className={`${prefixCls}-content-header-id`}>
                  <div>{data.type == 'group' ? t('group') : t('user')} ID:</div>
                  {id}
                  <Icon type="DOC_ON_DOC" style={{ cursor: 'copy' }} onClick={handleCopy}></Icon>
                </div>
              </div>
            </div>
            <div className={`${prefixCls}-content-body`}>
              {/* <div className={`${prefixCls}-content-switch`}>
                <div>
                  <Icon type="BELL" width={24} height={24}></Icon>
                  <span>Mute Notification</span>
                </div>
                <Switch
                  checked={!!contactData?.silent}
                  onChange={handleNotificationChange}
                ></Switch>
              </div>

              <div className={`${prefixCls}-content-switch`}>
                <div>
                  <Icon type="ADD_FRIEND" width={24} height={24}></Icon>
                  <span>Delete</span>
                </div>
                <Switch checked></Switch>
              </div> */}

              {type === 'request' && requestData?.requestStatus !== 'accepted' && !isContact ? (
                <Button type="text" className={`${prefixCls}-content-btn`} onClick={addContact}>
                  <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
                  {t('addContact')}
                </Button>
              ) : (
                <div className={`${prefixCls}-content-btn-container`}>
                  <Button
                    type="text"
                    className={`${prefixCls}-content-btn`}
                    onClick={handleClickBtn('message')}
                  >
                    <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
                    {t('message')}
                  </Button>
                  {data.id.includes('chatbot_') ? null : (
                    <>
                      |
                      <Button
                        type="text"
                        className={`${prefixCls}-content-btn`}
                        onClick={handleClickBtn('audio')}
                      >
                        <Icon type="PHONE_PICK" width={24} height={24}></Icon>
                        {t('audioCall')}
                      </Button>
                      |
                      <Button
                        type="text"
                        className={`${prefixCls}-content-btn`}
                        onClick={handleClickBtn('video')}
                      >
                        <Icon type="VIDEO_CAMERA" width={24} height={24}></Icon>
                        {t('videoCall')}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <Empty
          text={t('no contact')}
          icon={<Icon type="EMPTY" width={120} height={120}></Icon>}
        ></Empty>
      )}
    </div>
  );
};

export default observer(ContactDetail);
