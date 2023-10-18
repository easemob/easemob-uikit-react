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
import { Tooltip } from '../../component/tooltip/Tooltip';
import { useTranslation } from 'react-i18next';
import { renderTxt } from '../textMessage/TextMessage';
export interface ChatroomMessageProps {
  prefix?: string;
  className?: string;
  label?: string;
  prefixIcon?: ReactNode;
  avatar?: ReactNode;
  nickname?: string;
  content?: ReactNode;
  type: 'img' | 'txt';
  message: AgoraChat.MessageBody;
  targetLanguage?: string;
}
interface CustomAction {
  visible: boolean;
  icon?: ReactNode;
  actions?: {
    icon?: ReactNode;
    content?: string;
    onClick?: (message: BaseMessageType) => void;
  }[];
}
const ChatroomMessage = (props: ChatroomMessageProps) => {
  const {
    prefix: customizePrefixCls,
    className,
    type = 'txt',
    message,
    targetLanguage = 'en',
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('message-chatroom', customizePrefixCls);
  const classString = classNames(prefixCls, className);
  const { t } = useTranslation();
  const [hoverStatus, setHoverStatus] = useState(false);
  const context = useContext(RootContext);
  const { onError } = context;
  let customAction;
  let menuNode: ReactNode | undefined;
  let moreAction: CustomAction = { visible: false };
  if (customAction) {
    moreAction = customAction;
  } else {
    moreAction = {
      visible: true,
      icon: null,
      actions: [
        {
          content: 'DELETE',
          onClick: () => {},
        },
        {
          content: 'TRANSLATE',
          onClick: () => {},
        },
        {
          content: 'MUTE',
          onClick: () => {},
        },
      ],
    };
  }
  const [textToShow, setTextToShow] = useState((message as AgoraChat.TextMsgBody).msg);

  const chatroomData =
    rootStore.addressStore.chatroom.filter(item => item.id === message.to)[0] || {};
  const muteList = chatroomData.muteList || [];
  const isMuted = muteList.includes(message.from as string);

  const translateMessage = () => {
    const { msg } = message as AgoraChat.TextMsgBody;
    if (msg !== textToShow) {
      // already translated, display original message
      return setTextToShow(msg);
    }
    if (message?.translations?.[0]?.text) {
      // already translated, just show
      return setTextToShow(message?.translations?.[0]?.text);
    }
    rootStore.messageStore
      .translateMessage(
        {
          chatType: 'chatRoom',
          conversationId: message.to,
        },
        // @ts-ignore
        message.mid || message.id,
        targetLanguage,
      )
      ?.then(() => {
        console.log('message', message);
        const translatedMsg = message?.translations?.[0]?.text;
        setTextToShow(translatedMsg);
        // setTransStatus('translated');
      })
      .catch(error => {
        onError?.(error);
        // setTransStatus('translationFailed');
        // setBtnText('retry');
      });
  };
  const recallMessage = () => {
    rootStore.messageStore
      .recallMessage(
        {
          chatType: 'chatRoom',
          conversationId: message.to,
        },
        // @ts-ignore
        message.mid || message.id,
      )
      ?.then(() => {
        console.log('撤回成功');
      })
      ?.catch(err => {
        console.log('撤回失败');
        onError?.(err);
      });
  };
  const muteMember = () => {
    if (isMuted) {
      rootStore.addressStore.unmuteChatRoomMember(message.to, message.from as string);
      return;
    }
    rootStore.addressStore.muteChatRoomMember(message.to, message.from as string);
  };

  // render message menu
  if (moreAction?.visible) {
    menuNode = (
      <ul className={'cui-moreAction'}>
        {moreAction?.actions?.map((item, index) => {
          if (item.content === 'DELETE') {
            return (
              <li key={index} onClick={recallMessage}>
                <Icon type="DELETE" width={16} height={16} color="#5270AD"></Icon>
                {t('delete')}
              </li>
            );
          } else if (item.content === 'TRANSLATE') {
            return (
              message?.type === 'txt' && (
                <li key={index} onClick={translateMessage}>
                  <Icon type="TRANSLATION" width={16} height={16} color="#5270AD"></Icon>
                  {t('translate')}
                </li>
              )
            );
          } else if (item.content === 'MUTE') {
            return (
              <li key={index} onClick={muteMember}>
                <Icon
                  type={isMuted ? 'BELL' : 'BELL_SLASH'}
                  width={16}
                  height={16}
                  color="#5270AD"
                ></Icon>
                {isMuted ? t('unmute') : t('mute')}
              </li>
            );
          }
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(message);
              }}
            >
              {item.icon && item.icon}
              {item.content}
            </li>
          );
        })}
      </ul>
    );
  }

  const renderText = (text: string) => {
    return <div className={`${prefixCls}-text-box`}>{renderTxt(text)}</div>;
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

  const userInfo = message?.ext?.userInfo || {};
  const getTime = (time: number) => {
    const timeSting =
      new Date(time).getHours() +
      ':' +
      (new Date(time).getMinutes() < 10
        ? `0${new Date(time).getMinutes()}`
        : new Date(time).getMinutes());
    return timeSting;
  };
  return (
    <div
      className={classString}
      onMouseOver={() => setHoverStatus(true)}
      onMouseLeave={() => {
        setHoverStatus(false);
      }}
    >
      <div className={`${prefixCls}-container`}>
        <div className={`${prefixCls}-header`}>
          <div className={`${prefixCls}-header-label`}>{getTime(message.time)}</div>
          <Icon type="DELETE"></Icon>
          <Avatar size={20} src={userInfo.avatarURL}>
            {userInfo.nickName || message.from}
          </Avatar>
          <div className={`${prefixCls}-header-nick`}>{userInfo.nickName || message.from}</div>
        </div>
        {message.type == 'custom' && renderGift()}
        {message.type == 'txt' && renderText(textToShow)}
      </div>
      {hoverStatus && (
        <Tooltip title={menuNode} trigger="click" placement="bottom" align={{ offset: [5] }}>
          <Icon type="ELLIPSIS" className={`${prefixCls}-body-action`} height={20}></Icon>
        </Tooltip>
      )}
    </div>
  );
};

export default observer(ChatroomMessage);
