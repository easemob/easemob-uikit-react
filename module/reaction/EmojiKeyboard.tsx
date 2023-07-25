import React, { ReactNode, useState } from 'react';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Button from '../../component/button';
import { emoji } from '../messageEditor/emoji/emojiConfig';
import { Emoji, EmojiProps } from '../messageEditor/emoji/Emoji';
import Icon from '../../component/icon';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
export interface EmojiKeyBoardProps {
  prefixCls?: string;
  onSelected?: (emoji: string) => void;
  onDelete?: (emoji: string) => void;
  selectedList?: string[];
}

const EmojiKeyBoard = (props: EmojiKeyBoardProps) => {
  const { onSelected, selectedList, onDelete, prefixCls: customizePrefixCls } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('reaction-icon', customizePrefixCls);
  const handleSelectedEmoji = (emoji: string) => {
    console.log('emoji', emoji);
    onSelected?.(emoji);
  };

  const handleDeleteEmoji = (emoji: string) => {
    onDelete?.(emoji);
  };

  const classString = classNames(prefixCls);
  return (
    <Emoji
      selectedList={selectedList}
      onSelected={handleSelectedEmoji}
      onDelete={handleDeleteEmoji}
      icon={<Icon type="FACE_PLUS" width={20} height={20} className={classString} />}
    ></Emoji>
  );
};

export { EmojiKeyBoard };
