import React, { ReactNode, useState, useContext } from 'react';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import AC, { AgoraChat } from 'agora-chat';
import { Gift } from './Gift';
import { RootContext } from '../../store/rootContext';
import { CurrentConversation } from '../../store/ConversationStore';
export interface GiftKeyboardProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  icon?: ReactNode;
  onSelected?: (emojiString: string) => void;
  trigger?: 'click' | 'hover';
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  conversation?: CurrentConversation;
  gifts?: ReactNode[];
  onSendMessage?: (message: AgoraChat.CustomMsgBody) => void;
  onBeforeSendMessage?: (
    message: AgoraChat.MessageBody,
  ) => Promise<{ chatType: 'chatRoom'; conversationId: string } | void>;
}

const GiftKeyboard = (props: GiftKeyboardProps) => {
  const {
    icon,
    trigger = 'click',
    gifts,
    conversation,
    onSendMessage,
    onBeforeSendMessage,
  } = props;
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore, onError } = context;
  const { messageStore, conversationStore } = rootStore;
  const currentSvc = conversationStore.currentCvs;
  let currentConversation = conversation || currentSvc;
  const iconNode = icon ? (
    icon
  ) : (
    <span className="icon-container" title={t('module.emoji') as string}>
      <Icon
        type="GIFT"
        width={20}
        height={20}
        // onClick={handleClickIcon}
        // onClick={() => setOpen(true)}
      ></Icon>
    </span>
  );

  const sendGiftMessage = (giftId: string) => {
    console.log('conversation', conversation);
    if (!currentConversation) {
      throw new Error('currentConversation is null');
    }
    const options = {
      type: 'custom',
      to: currentConversation.conversationId,
      chatType: currentConversation.chatType,
      customEvent: 'CHATROOMUIKITGIFT',
      customExts: {
        giftId: 'gift_1',
        giftName: '小心心',
        giftPrice: '20',
        giftCount: '1',
        giftIcon: 'gift_1',
      },
      ext: {},
    } as AgoraChat.CreateCustomMsgParameters;
    const customMsg = AC.message.create(options);
    messageStore
      .sendMessage(customMsg)
      .then(() => {
        onSendMessage && onSendMessage(customMsg as AgoraChat.CustomMsgBody);
      })
      .catch(err => {
        onError && onError?.(err);
      });
  };

  const [selectedIndex, setIndex] = useState<string | number>('');
  const handleClick = (giftId: string | number) => {
    console.log('e', giftId);
    setIndex(giftId);
    sendGiftMessage(giftId as string);
  };
  let titleNode;
  if (gifts) {
    titleNode = <div className="content">{gifts}</div>;
  }
  titleNode = (
    <div className="content">
      <Gift
        giftId="heart1"
        title="小心心"
        onClick={handleClick}
        action={{ visible: true, text: '发送' }}
        selected={selectedIndex == 'heart1'}
      ></Gift>
      <Gift
        giftId="heart2"
        title="小心心"
        action={{ visible: true, text: '发送' }}
        selected={selectedIndex == 'heart2'}
        onClick={handleClick}
      ></Gift>
      <Gift
        giftId="heart3"
        title="红心心"
        selected={selectedIndex == 'heart3'}
        action={{ visible: true, text: '发送' }}
        onClick={handleClick}
      ></Gift>
      <Gift giftId="heart4" onClick={handleClick}></Gift>
      <Gift giftId="heart4" onClick={handleClick}></Gift>
      <Gift giftId="heart4" title="小心心"></Gift>
      <Gift giftId="heart4" title="红心心" selected></Gift>
      <Gift giftId="heart4" subTitle="20元"></Gift>
    </div>
  );

  console.log('conversation 111', conversation);
  return (
    <Tooltip title={titleNode} trigger={trigger} arrowPointAtCenter={false} arrow={false}>
      {iconNode}
    </Tooltip>
  );
};

export { GiftKeyboard };
