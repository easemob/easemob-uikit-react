import React, { ReactNode, useState } from 'react';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';

import { Gift } from './Gift';

export interface GiftKeyboardProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  icon?: ReactNode;
  onSelected?: (emojiString: string) => void;
  trigger?: 'click' | 'hover';
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;

  gifts?: ReactNode[];
}

const GiftKeyboard = (props: GiftKeyboardProps) => {
  const { icon, trigger = 'click', gifts } = props;
  const { t } = useTranslation();
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

  const [selectedIndex, setIndex] = useState<string | number>('');
  const handleClick = (giftId: string | number) => {
    console.log('e', giftId);
    setIndex(giftId);
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

  return (
    <Tooltip title={titleNode} trigger={trigger} arrowPointAtCenter={false} arrow={false}>
      {iconNode}
    </Tooltip>
  );
};

export { GiftKeyboard };
