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
}

export const ContactDetail: React.FC<ContactDetailProps> = (props: ContactDetailProps) => {
  const { style, className, prefix, data, onUserIdCopied, onMessageBtnClick } = props;
  const { type, id, name } = data;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contact-detail', prefix);
  const context = React.useContext(RootContext);
  const { rootStore, theme, features } = context;
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const { addressStore, conversationStore } = rootStore;
  const avatarUrl = addressStore.appUsersInfo[id]?.avatarurl;
  let contactData: any;
  if (data.type === 'contact') {
    contactData = addressStore.contacts.find((item: any) => item.userId === data.id);
  } else {
    contactData = addressStore.groups.find((item: any) => item.groupId === data.id);
  }
  //   useEffect(() => {
  //     console.log('-----contactData', contactData);
  //     if (contactData?.silent !== undefined || !data.id) return;
  //     addressStore.getSilentModeForConversations([
  //       {
  //         conversationId: data.id,
  //         chatType: data.type === 'contact' ? 'singleChat' : 'groupChat',
  //       },
  //     ]);
  //   }, [data.id]);

  const handleCopy = () => {
    var textArea = document.createElement('textarea');
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
  console.log('avatarUrl', avatarUrl);

  const handleClickMessage = () => {
    const result = onMessageBtnClick?.();
    if (result == false) return;
    conversationStore.addConversation({
      chatType: data.type == 'contact' ? 'singleChat' : 'groupChat',
      conversationId: data.id,
      name: data.name,
      lastMessage: {
        time: Date.now(),
        type: 'txt',
        msg: '',
        id: '',
        chatType: data.type == 'contact' ? 'singleChat' : 'groupChat',
        to: data.id,
      },
      unreadCount: 0,
    });
    conversationStore.setCurrentCvs({
      chatType: data.type == 'contact' ? 'singleChat' : 'groupChat',
      conversationId: data.id,
      name: data.name,
    });
  };

  const addContact = () => {
    addressStore.acceptContactInvite(data.id);
  };
  return (
    <div className={classString} style={{ ...style }}>
      {data.id ? (
        <>
          <div className={`${prefixCls}-content`}>
            <div className={`${prefixCls}-content-header`}>
              <Avatar src={avatarUrl} size={100}>
                {name}
              </Avatar>
              <div>
                <div className={`${prefixCls}-content-header-name`}>{name}</div>

                <div className={`${prefixCls}-content-header-id`}>
                  <div>User ID:</div>
                  {id}
                  <Icon type="FILE" style={{ cursor: 'copy' }} onClick={handleCopy}></Icon>
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

              {type === 'request' && data.requestStatus !== 'accepted' ? (
                <Button type="primary" className={`${prefixCls}-content-btn`} onClick={addContact}>
                  <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
                  添加联系人
                </Button>
              ) : (
                <Button
                  type="primary"
                  className={`${prefixCls}-content-btn`}
                  onClick={handleClickMessage}
                >
                  <Icon type="BUBBLE_FILL" width={24} height={24}></Icon>
                  Message
                </Button>
              )}
            </div>
          </div>
        </>
      ) : (
        <Empty text="no contact" icon={<Icon type="EMPTY" width={120} height={120}></Icon>}></Empty>
      )}
    </div>
  );
};

export default observer(ContactDetail);
