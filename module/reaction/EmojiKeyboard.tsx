import React, { ReactNode, useState, useContext } from 'react';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Button from '../../component/button';
// import { emoji } from '../messageInput/emoji/emojiConfig';
import { Emoji, EmojiProps } from '../messageInput/emoji/Emoji';
import Icon from '../../component/icon';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { emoji } from './emojiConfig';
import { RootContext } from '../store/rootContext';
import './style/style.scss';
export interface EmojiKeyBoardProps {
  prefixCls?: string;
  onSelected?: (emoji: string) => void;
  onDelete?: (emoji: string) => void;
  selectedList?: string[];
  reactionConfig?: EmojiProps['emojiConfig'];
  placement?: EmojiProps['placement'];
}

const EmojiKeyBoard = (props: EmojiKeyBoardProps) => {
  const {
    onSelected,
    selectedList,
    onDelete,
    prefixCls: customizePrefixCls,
    reactionConfig,
    placement,
  } = props;
  const context = useContext(RootContext);
  const { reactionConfig: globalRatConfig } = context;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('reaction-icon', customizePrefixCls);
  const handleSelectedEmoji = (emoji: string) => {
    onSelected?.(emoji);
  };

  const handleDeleteEmoji = (emoji: string) => {
    onDelete?.(emoji);
  };

  const classString = classNames(prefixCls);
  return (
    <Emoji
      emojiConfig={reactionConfig || (globalRatConfig as EmojiProps['emojiConfig']) || emoji}
      selectedList={selectedList}
      onSelected={handleSelectedEmoji}
      onDelete={handleDeleteEmoji}
      icon={<Icon type="FACE_PLUS" width={20} height={20} className={classString} />}
      placement={placement}
    ></Emoji>
  );
};

export { EmojiKeyBoard };
