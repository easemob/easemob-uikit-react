import React, { ReactNode, useState, useContext } from 'react';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import { chatSDK, ChatSDK } from '../../SDK';
import { Gift } from './Gift';
import { RootContext } from '../../store/rootContext';
import { CurrentConversation } from '../../store/ConversationStore';
import giftConfig from './giftConfig';
import { ConfigContext } from '../../../component/config/index';
import classNames from 'classnames';
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
  onSendMessage?: (message: ChatSDK.CustomMsgBody) => void;
  onBeforeSendMessage?: (
    message: ChatSDK.MessageBody,
  ) => Promise<{ chatType: 'chatRoom'; conversationId: string } | void>;
  giftConfig?: typeof giftConfig;
}

const GiftKeyboard = (props: GiftKeyboardProps) => {
  const {
    icon,
    trigger = 'click',
    gifts,
    conversation,
    onSendMessage,
    onBeforeSendMessage,
    giftConfig: customGiftConfig,
    prefix,
    className,
  } = props;
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore } = context;
  const { messageStore, conversationStore } = rootStore;
  const currentSvc = conversationStore.currentCvs;
  let currentConversation = conversation || currentSvc;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('giftKeyboard', prefix);
  const classString = classNames(
    prefixCls,
    // {
    //   [`${prefixCls}-${themeMode}`]: !!themeMode,
    // },
    className,
  );

  const iconNode = icon ? (
    icon
  ) : (
    <span className={classString} title={t('gift') as string}>
      <Icon
        type="GIFT"
        width={24}
        height={24}
        // onClick={handleClickIcon}
        // onClick={() => setOpen(true)}
      ></Icon>
    </span>
  );

  const sendGiftMessage = (giftData: {
    giftId: string;
    giftIcon: string;
    giftName: string;
    giftPrice: string;
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
    } as ChatSDK.CreateCustomMsgParameters;
    const customMsg = chatSDK.message.create(options);
    messageStore.sendMessage(customMsg).then(() => {
      onSendMessage && onSendMessage(customMsg as ChatSDK.CustomMsgBody);
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
    giftPrice: string;
  }) => {
    sendGiftMessage(giftData);
  };
  let titleNode;
  if (gifts) {
    titleNode = <div className="content">{gifts}</div>;
  }

  const usedGiftConfig = customGiftConfig ? customGiftConfig : giftConfig;
  titleNode = (
    <div className="content">
      {usedGiftConfig.gifts.map((item, index) => {
        return (
          <Gift
            key={item.giftId}
            giftId={item.giftId}
            title={t(item.giftName) as string}
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
