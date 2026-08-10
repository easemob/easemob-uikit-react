import React, { useState, ReactNode, useRef, useContext } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../../component/config/index';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Icon from '../../../component/icon';
import type { ChatSDK } from '../../SDK';
import { RootContext } from '../../store/rootContext';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { CurrentConversation } from '../../store/ConversationStore';
import UserSelect, { UserSelectInfo } from '../../userSelect';
import Button from '../../../component/button';
import type { BeforeSendMessage } from '../sendTypes';
import { resolveBeforeSendRoute, toSendMessageRoute } from '../sendTypes';
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
  onBeforeSendMessage?: BeforeSendMessage;
}

function getInputFile(target: HTMLInputElement): File | undefined {
  return target.files?.[0];
}

// SDK 要求视频消息的 duration 为正数，元数据不可用时退回 1 秒
function readVideoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const finish = (duration: number) => {
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onloadedmetadata = () => {
      finish(Number.isFinite(video.duration) ? Math.max(1, Math.round(video.duration)) : 1);
    };
    video.onerror = () => {
      finish(1);
    };
    video.preload = 'metadata';
    video.src = objectUrl;
  });
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
      <Button type="text" shape="circle">
        <Icon
          type="PLUS_CIRCLE"
          width={24}
          height={24}
          // onClick={handleClickIcon}
        ></Icon>
      </Button>
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
    const event = 'userCard';
    const params = {
      uid: userInfo.userId || '',
      nickname:
        rootStore.addressStore.appUsersInfo[userInfo.userId]?.nickname || userInfo.nickname || '',
      avatar: userInfo.avatarUrl || '',
    };

    const body = {
      event,
      params: Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
      ),
    };

    resolveBeforeSendRoute(onBeforeSendMessage, {
      kind: 'custom',
      route: toSendMessageRoute(currentCVS),
      body,
      isChatThread,
    }).then(route => {
      const customMessage = client.chatManager.createCustomMessage({
        ...route,
        event: body.event,
        params: body.params,
        isChatThread,
        needReadReceipt: route.conversationType === 'singleChat',
      });
      messageStore.sendMessage(customMessage);
    });
  };
  const sendVideo = () => {
    videoEl.current?.focus();
    videoEl.current?.click();
  };

  const defaultActions = [
    {
      content: 'IMAGE',
      title: t('image'),
      onClick: sendImage,
      icon: null,
    },
    { content: 'VIDEO', title: t('video'), onClick: sendVideo, icon: null },
    { content: 'FILE', title: t('file'), onClick: sendFile, icon: null },
    { content: 'CARD', title: t('card'), onClick: sendCard, icon: null },
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
    const file = getInputFile(e.target);
    if (!file) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }
    const img = new Image();
    img.src = URL.createObjectURL(e.target.files?.[0] as unknown as MediaSource);
    img.onload = () => {
      const option = {
        data: file,
        width: img.width,
        height: img.height,
        filetype: file.type,
        fileLength: file.size,
        isGif: file.name.endsWith('.gif'),
      };
      resolveBeforeSendRoute(onBeforeSendMessage, {
        kind: 'image',
        route: toSendMessageRoute(currentCVS),
        body: option,
        isChatThread,
      }).then(route => {
        const imageMessage = client.chatManager.createImageMessage({
          ...route,
          ...option,
          isChatThread,
          needReadReceipt: route.conversationType === 'singleChat',
        });
        messageStore.sendMessage(imageMessage);
      });
      imageEl!.current!.value = '';

      // 释放 URL 对象以避免内存泄漏
      URL.revokeObjectURL(img.src);
    };
    img.onerror = error => {
      console.error('Failed to load image:', error);
    };
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'file' | 'video',
  ) => {
    const file = getInputFile(e.target);
    if (!file) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }

    if (type === 'file') {
      fileEl!.current!.value = '';
    } else {
      videoEl!.current!.value = '';
    }

    const duration = type === 'video' ? await readVideoDuration(file) : 0;
    const option = {
      data: file,
      filename: file.name,
      filetype: file.type,
      fileLength: file.size,
    };
    resolveBeforeSendRoute(onBeforeSendMessage, {
      kind: type === 'video' ? 'video' : 'file',
      route: toSendMessageRoute(currentCVS),
      body: type === 'video' ? { ...option, duration } : option,
      isChatThread,
    }).then(route => {
      const needReadReceipt = route.conversationType === 'singleChat';
      const fileMessage =
        type === 'video'
          ? client.chatManager.createVideoMessage({
              ...route,
              ...option,
              duration,
              isChatThread,
              needReadReceipt,
            })
          : client.chatManager.createFileMessage({
              ...route,
              ...option,
              isChatThread,
              needReadReceipt,
            });
      messageStore.sendMessage(fileMessage);
    });
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
        placement="bottomRight"
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
            title={`${t('share')} ${t('contacts')}`}
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
              setSelectedUsers(users);
            }}
            onConfirm={users => {
              // console.log('onOk', users);
            }}
          />
        </div>
      }
    </>
  );
};

MoreAction = observer(MoreAction);
export { MoreAction };
