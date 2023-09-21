import React, { ReactNode, useState } from 'react';
import Button, { ButtonProps } from '../../../component/button';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
import heart from '../../assets/gift/heart.png';

export interface GiftProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  image?: ReactNode | string;
  title?: string;
  titleIcon?: ReactNode;
  subTitle?: string;
  subTitleIcon?: ReactNode;
  selected?: boolean;
  action?: {
    visible: boolean;
    text: string;
    onClick?: () => void;
  };
  giftId: string | number;
  onClick?: (giftId: string | number) => void;
}

const Gift = (props: GiftProps) => {
  const {
    className,
    prefix: customizePrefixCls,
    title,
    subTitle,
    selected,
    action,
    onClick,
    giftId,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('gift', customizePrefixCls);
  const [isSelected, setSelected] = useState(selected);
  const [actionVisible, setActionVisible] = useState(false);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-selected`]: selected,
    },
    className,
  );

  const clickGift = () => {
    // if (typeof selected == 'undefined') {
    // setSelected(true);
    // }
    // action?.visible && setActionVisible(true);
    onClick && onClick?.(giftId);
  };
  return (
    <div className={classString} onClick={clickGift}>
      <img src={heart as any as string} alt="heart" />
      {!selected && <div className={`${prefixCls}-title`}>{title}</div>}
      <div className={`${prefixCls}-subtitle`}>{subTitle}</div>
      {selected && <div className={`${prefixCls}-button`}>{action?.text}</div>}
    </div>
  );
};

export { Gift };
