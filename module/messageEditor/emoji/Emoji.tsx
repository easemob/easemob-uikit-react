import React, { ReactNode, useState } from 'react';
import { Tooltip } from '../../../component/tooltip/Tooltip';
import Button, { ButtonProps } from '../../../component/button';
import { emoji as defaultEmojiConfig } from './emojiConfig';
import Icon from '../../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
const emojiWidth = 25;
const emojiPadding = 5;

export interface EmojiConfig {
  path: string;
  map: { [key: string]: string };
}

export interface EmojiProps {
  style?: React.CSSProperties;
  emojiContainerStyle?: React.CSSProperties;
  icon?: ReactNode;
  onSelected?: (emojiString: string) => void;
  trigger?: 'click' | 'hover';
  config?: { map: any; path: string };
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  selectedList?: string[];
  onDelete?: (emojiString: string) => void;
  emojiConfig?: EmojiConfig;
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
    emojiContainerStyle = {},
  } = props;
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const emoji: EmojiConfig = emojiConfig ? emojiConfig : defaultEmojiConfig;
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
        <Button key={k} type={btnType}>
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
    // setOpen(false);
    if (selectedList && selectedList.length > 0 && selectedList.includes(selectedEmoji)) {
      return onDelete && onDelete(selectedEmoji);
    }
    onSelected && onSelected(selectedEmoji);
  };

  const handleClickIcon = (e: React.MouseEvent<Element, MouseEvent>) => {
    onClick && onClick(e);
  };
  const titleNode = <div onClick={handleEmojiClick}>{renderEmoji()}</div>;
  const iconNode = icon ? (
    icon
  ) : (
    <span className="icon-container" style={{ ...style }} title={t('emoji') as string}>
      <Icon
        type="FACE"
        width={20}
        height={20}
        onClick={handleClickIcon}
        // onClick={() => setOpen(true)}
      ></Icon>
    </span>
  );
  return (
    <Tooltip
      title={titleNode}
      trigger={trigger}
      arrowPointAtCenter={false}
      arrow={false}
      // open={isOpen}
    >
      {iconNode}
    </Tooltip>
  );
};

export { Emoji };
