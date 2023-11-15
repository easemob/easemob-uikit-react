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
import giftConfig from './giftConfig';
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
  const { rootStore } = context;
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

  const sendGiftMessage = (giftData: {
    giftId: string;
    giftIcon: string;
    giftName: string;
    giftPrice: number;
  }) => {
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
        chatroom_uikit_gift: JSON.stringify(giftData),
      },
      ext: {},
    } as AgoraChat.CreateCustomMsgParameters;
    const customMsg = AC.message.create(options);
    messageStore.sendMessage(customMsg).then(() => {
      onSendMessage && onSendMessage(customMsg as AgoraChat.CustomMsgBody);
    });
  };

  const [selectedIndex, setIndex] = useState<string | number>('');
  const handleClick = (giftId: string | number) => {
    console.log('e', giftId);
    setIndex(giftId);
    // sendGiftMessage(giftId as string);
  };
  const handleSend = (giftData: {
    giftId: string;
    giftIcon: string;
    giftName: string;
    giftPrice: number;
  }) => {
    sendGiftMessage(giftData);
  };
  let titleNode;
  if (gifts) {
    titleNode = <div className="content">{gifts}</div>;
  }
  titleNode = (
    <div className="content">
      {giftConfig.gifts.map((item, index) => {
        return (
          <Gift
            key={item.giftId}
            giftId={item.giftId}
            title={item.giftName}
            subTitle={item.giftPrice}
            onClick={handleClick}
            image={item.giftIcon}
            action={{
              visible: true,
              text: t('send'),
              onClick: () => {
                handleSend(item);
              },
            }}
            selected={selectedIndex == item.giftId}
          ></Gift>
        );
      })}
    </div>
  );

  return (
    <Tooltip title={titleNode} trigger={trigger} arrowPointAtCenter={false} arrow={false}>
      {iconNode}
    </Tooltip>
  );
};

export { GiftKeyboard };
