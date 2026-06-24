import React, { ReactNode, useState, useContext } from 'react';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import type { ChatSDK } from '../../SDK';
import { Gift } from './Gift';
import { RootContext } from '../../store/rootContext';
import { CurrentConversation } from '../../store/ConversationStore';
import giftConfig from './giftConfig';
import { ConfigContext } from '../../../component/config/index';
import classNames from 'classnames';
import type { BeforeSendMessage } from '../sendTypes';
import { resolveBeforeSendRoute, toSendMessageRoute } from '../sendTypes';
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
  onSendMessage?: (message: ChatSDK.Message) => void;
  onBeforeSendMessage?: BeforeSendMessage;
  giftConfig?: typeof giftConfig;
  closeAfterClick?: boolean; // 点击发送之后是否关闭
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
    closeAfterClick,
  } = props;
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore } = context;
  const { client, messageStore, conversationStore } = rootStore;
  const currentSvc = conversationStore.currentCvs;
  const currentConversation = conversation || currentSvc;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('giftKeyboard', prefix);
  const [isOpen, setOpen] = useState(false);
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
        onClick={() => setOpen(true)}
      ></Icon>
    </span>
  );

  const sendGiftMessage = (giftData: {
    giftId: string;
    giftIcon: string;
    giftName: string;
    giftPrice: string;
    giftCount: number;
  }) => {
    console.log('conversation', conversation);
    if (!currentConversation) {
      throw new Error('currentConversation is null');
    }
    const params = {
      chatroom_uikit_gift: JSON.stringify(giftData),
    };
    resolveBeforeSendRoute(onBeforeSendMessage, {
      kind: 'custom',
      route: toSendMessageRoute(currentConversation),
      body: {
        event: 'CHATROOMUIKITGIFT',
        params,
      },
    }).then(route => {
      const customMsg = client.chatManager.createCustomMessage({
        ...route,
        event: 'CHATROOMUIKITGIFT',
        params,
      });
      messageStore.sendMessage(customMsg).then(() => {
        onSendMessage?.(customMsg);
      });
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
    giftCount: number;
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
                const giftData = {
                  ...item,
                  giftCount: 1,
                };
                handleSend(giftData);
                setOpen(false);
              },
            }}
            selected={selectedIndex == item.giftId}
          ></Gift>
        );
      })}
    </div>
  );
  if (closeAfterClick == false) {
    return (
      <Tooltip title={titleNode} trigger={trigger} arrowPointAtCenter={false} arrow={false}>
        {iconNode}
      </Tooltip>
    );
  } else {
    return (
      <Tooltip
        title={titleNode}
        trigger={trigger}
        arrowPointAtCenter={false}
        arrow={false}
        onOpenChange={() => {
          setOpen(!isOpen);
        }}
        open={isOpen}
        placement="topLeft"
      >
        {iconNode}
      </Tooltip>
    );
  }
};

export { GiftKeyboard };
