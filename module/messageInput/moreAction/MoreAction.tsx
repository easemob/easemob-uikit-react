import React, { useState, ReactNode, useRef, useContext, MouseEventHandler } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../../component/config/index';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Icon from '../../../component/icon';
import { chatSDK, ChatSDK } from '../../SDK';
import { RootContext } from '../../store/rootContext';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from '../../store/ConversationStore';
import { FileMessageType, ImageMessageType } from 'module/types/messageType';
import UserSelect, { UserSelectInfo } from '../../userSelect';
import Button from '../../../component/button';
export interface MoreActionProps {
  style?: React.CSSProperties;
  className?: string;
  itemContainerStyle?: React.CSSProperties;
  prefix?: string;
  icon?: ReactNode;
  customActions?: Array<{
    content: string;
    onClick?: () => void;
    icon?: ReactNode;
  }>;
  conversation?: CurrentConversation;
  isChatThread?: boolean;
  onBeforeSendMessage?: (message: ChatSDK.MessageBody) => Promise<CurrentConversation | void>;
}
let MoreAction = (props: MoreActionProps) => {
  const {
    icon,
    customActions,
    prefix: customizePrefixCls,
    conversation,
    isChatThread,
    onBeforeSendMessage,
    style = {},
    itemContainerStyle = {},
    className,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('moreAction', customizePrefixCls);
  const classString = classNames(prefixCls, className);
  const imageEl = useRef<HTMLInputElement>(null);
  const fileEl = useRef<HTMLInputElement>(null);
  const videoEl = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { client, messageStore } = rootStore;
  const iconNode = icon ? (
    icon
  ) : (
    <span className={`${prefixCls}-iconBox`} style={{ ...style }} title={t('more') as string}>
      <Icon
        type="PLUS_CIRCLE"
        width={24}
        height={24}
        // onClick={handleClickIcon}
      ></Icon>
    </span>
  );

  const sendImage = () => {
    imageEl.current?.focus();
    imageEl.current?.click();
  };

  const sendFile = () => {
    fileEl.current?.focus();
    fileEl.current?.click();
  };

  // ------- card -------
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<UserSelectInfo[]>([]); // [{uid: 'userId', nickname: '', avatar: ''}]
  const sendCard = () => {
    setCardModalVisible(true);
  };
  const sendCardMessage = () => {
    if (selectedUsers.length == 0) {
      return;
    }
    const userInfo = selectedUsers[0];
    const customEvent = 'userCard'; // 创建自定义事件
    const customExts = {
      uid: userInfo.userId || '',
      nickname:
        rootStore.addressStore.appUsersInfo[userInfo.userId]?.nickname || userInfo.nickname || '',
      avatar: userInfo.avatarUrl || '',
    };

    const option = {
      type: 'custom' as 'custom',
      customEvent,
      customExts,
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      isChatThread,
    };
    const customMessage = chatSDK.message.create(option);

    if (onBeforeSendMessage) {
      onBeforeSendMessage(customMessage).then(cvs => {
        if (cvs) {
          customMessage.to = cvs.conversationId;
          (customMessage as ImageMessageType).chatType = cvs.chatType;
        }
        messageStore.sendMessage(customMessage);
      });
    } else {
      messageStore.sendMessage(customMessage);
    }
  };
  const sendVideo = () => {
    console.log('发送视频');
    videoEl.current?.focus();
    videoEl.current?.click();
  };
  const defaultActions = [
    {
      content: 'image',
      title: t('image'),
      onClick: sendImage,
      icon: null,
    },
    { content: 'video', title: t('video'), onClick: sendVideo, icon: null },
    { content: 'file', title: t('file'), onClick: sendFile, icon: null },
    { content: 'card', title: t('card'), onClick: sendCard, icon: null },
  ];
  let actions = [];
  if (customActions) {
    actions = customActions;
  } else {
    actions = defaultActions;
  }

  const menu = (
    <ul className={classString} style={{ ...itemContainerStyle }}>
      {actions.map((item, index) => {
        if (item.content == 'IMAGE') {
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              onClick={() => {
                setMenuOpen(false);
                sendImage();
              }}
              key={item.content || index}
            >
              <Icon type="IMG" width={18} height={18}></Icon>
              {t('image')}
            </li>
          );
        } else if (item.content == 'FILE') {
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              onClick={() => {
                setMenuOpen(false);
                sendFile();
              }}
              key={item.content || index}
            >
              <Icon type="FOLDER" width={18} height={18}></Icon>
              {t('file')}
            </li>
          );
        } else if (item.content == 'CARD') {
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              onClick={() => {
                setMenuOpen(false);
                sendCard();
              }}
              key={item.content || index}
            >
              <Icon type="PERSON_SINGLE_FILL" width={18} height={18}></Icon>
              {t('userCard')}
            </li>
          );
        } else if (item.content == 'VIDEO') {
          return (
            <li
              className={themeMode == 'dark' ? 'cui-li-dark' : ''}
              onClick={() => {
                setMenuOpen(false);
                sendVideo();
              }}
              key={item.content || index}
            >
              <Icon type="TRIANGLE_IN_RECTANGLE" width={18} height={18}></Icon>
              {t('videoBtn')}
            </li>
          );
        }
        return (
          <li
            className={themeMode == 'dark' ? 'cui-li-dark' : ''}
            onClick={() => {
              setMenuOpen(false);
              item.onClick && item?.onClick();
            }}
            key={item.content || index}
          >
            {item.content}
          </li>
        );
      })}
    </ul>
  );
  const currentCVS = conversation ? conversation : messageStore.currentCVS;
  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    let file = chatSDK.utils.getFileUrl(e.target);
    if (!file.filename) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }

    const option = {
      type: 'img',
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      file: file,
      isChatThread,
      onFileUploadComplete: data => {
        let sendMsg = messageStore.message.byId[imageMessage.id];
        (sendMsg as any).thumb = data.thumb;
        (sendMsg as any).url = data.url;
        messageStore.modifyMessage(imageMessage.id, sendMsg);
      },
    } as ChatSDK.CreateImgMsgParameters;
    const imageMessage = chatSDK.message.create(option);

    if (onBeforeSendMessage) {
      onBeforeSendMessage(imageMessage).then(cvs => {
        if (cvs) {
          imageMessage.to = cvs.conversationId;
          (imageMessage as ImageMessageType).chatType = cvs.chatType;
        }

        messageStore.sendMessage(imageMessage);
      });
    } else {
      messageStore.sendMessage(imageMessage);
    }
    imageEl!.current!.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'video') => {
    let file = chatSDK.utils.getFileUrl(e.target);
    if (!file.filename) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }

    const option = {
      type: type,
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      file: file,
      filename: file.filename,
      file_length: file.data.size,
      url: file.url,
      isChatThread,
    } as ChatSDK.CreateFileMsgParameters;
    const fileMessage = chatSDK.message.create(option);

    if (onBeforeSendMessage) {
      onBeforeSendMessage(fileMessage).then(cvs => {
        if (cvs) {
          fileMessage.to = cvs.conversationId;
          (fileMessage as FileMessageType).chatType = cvs.chatType;
        }

        messageStore.sendMessage(fileMessage);
      });
    } else {
      messageStore.sendMessage(fileMessage);
    }
    fileEl!.current!.value = '';
  };

  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <Tooltip
        title={menu}
        trigger="click"
        arrowPointAtCenter={false}
        arrow={false}
        open={menuOpen}
        onOpenChange={c => {
          setMenuOpen(c);
        }}
      >
        {iconNode}
      </Tooltip>
      {
        <input
          type="file"
          accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
          ref={imageEl}
          onChange={handleImageChange}
          style={{ display: 'none', position: 'absolute' }}
        />
      }
      {
        <input
          ref={fileEl}
          onChange={e => {
            handleFileChange(e, 'file');
          }}
          type="file"
          style={{ display: 'none', position: 'absolute' }}
        />
      }
      {
        <input
          ref={videoEl}
          onChange={e => {
            handleFileChange(e, 'video');
          }}
          type="file"
          style={{ display: 'none', position: 'absolute' }}
          accept="video/*"
        />
      }
      {
        <div style={{ position: 'absolute' }}>
          <UserSelect
            title={`${t('share')} ${t('contact')}`}
            selectedPanelHeader={<></>}
            onCancel={() => {
              setCardModalVisible(false);
            }}
            selectedPanelFooter={
              <div>
                <Button
                  style={{ marginRight: '24px', width: '68px' }}
                  type="primary"
                  onClick={() => {
                    sendCardMessage();
                    setCardModalVisible(false);
                  }}
                >
                  {t('confirmBtn')}
                </Button>
                <Button
                  style={{ width: '68px' }}
                  type="default"
                  onClick={() => {
                    setCardModalVisible(false);
                  }}
                >
                  {t('cancelBtn')}
                </Button>
              </div>
            }
            closable={true}
            enableMultipleSelection={false}
            open={cardModalVisible}
            onUserSelect={(user, users) => {
              console.log('onUserSelect', user, users);
              setSelectedUsers(users);
            }}
            onOk={users => {
              console.log('onOk', users);
            }}
          />
        </div>
      }
    </>
  );
};

MoreAction = observer(MoreAction);
export { MoreAction };
