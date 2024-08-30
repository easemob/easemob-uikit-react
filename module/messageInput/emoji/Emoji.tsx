import React, { ReactNode, useState } from 'react';
import { Tooltip, TooltipProps } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import { emoji as defaultEmojiConfig } from './emojiConfig';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
const emojiWidth = 25;
const emojiPadding = 5;

export interface EmojiConfig {
  path: string;
  map: { [key: string]: string };
}

export interface EmojiProps {
  prefix?: string;
  style?: React.CSSProperties;
  className?: string;
  emojiContainerStyle?: React.CSSProperties;
  icon?: ReactNode;
  onSelected?: (emojiString: string) => void;
  trigger?: 'click' | 'hover';
  config?: { map: any; path: string };
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  selectedList?: string[];
  onDelete?: (emojiString: string) => void;
  emojiConfig?: EmojiConfig;
  placement?: TooltipProps['placement'];
  closeAfterClick?: boolean;
}

const Emoji = (props: EmojiProps) => {
  const {
    onSelected,
    icon,
    trigger = 'click',
    onClick,
    selectedList,
    onDelete,
    emojiConfig,
    style = {},
    className,
    prefix,
    emojiContainerStyle = {},
    placement = 'bottom',
    closeAfterClick = true,
  } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const emoji: EmojiConfig = emojiConfig ? emojiConfig : defaultEmojiConfig;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('emoji-container', prefix);
  const classString = classNames(
    prefixCls,
    // {
    //   [`${prefixCls}-${themeMode}`]: !!themeMode,
    // },
    className,
  );

  const renderEmoji = () => {
    const emojiString = Object.keys(emoji.map);
    return emojiString.map(k => {
      const v = emoji.map[k as keyof typeof emoji.map];
      let btnType: ButtonProps['type'] = 'text';
      if (selectedList && selectedList.length > 0) {
        if (selectedList.includes(k)) {
          btnType = 'primary';
        }
      }
      return (
        <Button key={k} type={btnType} style={{ border: 'none' }}>
          <div className="cui-emoji-box" style={{ ...emojiContainerStyle }}>
            {emojiConfig ? (
              typeof v == 'string' ? (
                <img
                  src={new URL(`/module/assets/reactions/${v}`, import.meta.url).href}
                  alt={k}
                  width={emojiWidth}
                  height={emojiWidth}
                />
              ) : (
                v
              )
            ) : (
              <img
                src={new URL(`/module/assets/reactions/${v}`, import.meta.url).href}
                alt={k}
                width={emojiWidth}
                height={emojiWidth}
              />
            )}
          </div>
        </Button>
      );
    });
  };

  const handleEmojiClick: React.MouseEventHandler<HTMLImageElement> = e => {
    e.preventDefault();
    const selectedEmoji =
      (e.target as HTMLImageElement).alt || ((e.target as any).children[0] as HTMLImageElement).alt;
    setOpen(false);
    if (selectedList && selectedList.length > 0 && selectedList.includes(selectedEmoji)) {
      return onDelete && onDelete(selectedEmoji);
    }
    onSelected && onSelected(selectedEmoji);
  };

  const handleClickIcon = (e: React.MouseEvent<Element, MouseEvent>) => {
    onClick && onClick(e);
    setOpen(true);
  };
  const titleNode = (
    <div className={classString} onClick={handleEmojiClick}>
      {renderEmoji()}
    </div>
  );
  const iconNode = icon ? (
    <div
      onClick={handleClickIcon}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      {icon}
    </div>
  ) : (
    <span className={`${prefixCls}-iconBox`} style={{ ...style }} title={t('emoji') as string}>
      <Button type="text" shape="circle">
        <Icon
          type="FACE"
          width={24}
          height={24}
          onClick={handleClickIcon}
          // onClick={() => setOpen(true)}
        ></Icon>
      </Button>
    </span>
  );

  if (closeAfterClick == false) {
    return (
      <Tooltip
        title={titleNode}
        trigger={trigger}
        arrowPointAtCenter={false}
        arrow={false}
        placement={placement}
      >
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
        placement={placement}
        onOpenChange={() => {
          setOpen(!isOpen);
        }}
        open={isOpen}
      >
        {iconNode}
      </Tooltip>
    );
  }
};
export { Emoji };
