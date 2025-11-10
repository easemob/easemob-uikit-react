import React, { ReactNode, useState, useContext, useImperativeHandle, useRef } from 'react';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Button from '../../component/button';
// import { emoji } from '../messageInput/emoji/emojiConfig';
import { Emoji, EmojiProps, EmojiRef } from '../messageInput/emoji/Emoji';
import Icon from '../../component/icon';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { emoji } from './emojiConfig';
import { RootContext } from '../store/rootContext';
import { useIsMobile } from '../hooks/useScreen';
import './style/style.scss';
export interface EmojiKeyBoardProps {
  prefixCls?: string;
  onSelected?: (emoji: string) => void;
  onDelete?: (emoji: string) => void;
  selectedList?: string[];
  reactionConfig?: EmojiProps['emojiConfig'];
  placement?: EmojiProps['placement'];
  onClick?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  onOpenChange?: (open: boolean) => void;
}

export interface EmojiKeyBoardRef {
  open?: () => void;
  close?: () => void;
}

const EmojiKeyBoard = React.forwardRef<EmojiKeyBoardRef, EmojiKeyBoardProps>((props, ref) => {
  const {
    onSelected,
    selectedList,
    onDelete,
    prefixCls: customizePrefixCls,
    reactionConfig,
    placement,
    onClick,
    onOpenChange,
  } = props;
  const context = useContext(RootContext);
  const { reactionConfig: globalRatConfig } = context;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('reaction-icon', customizePrefixCls);
  const isMobile = useIsMobile();
  const handleSelectedEmoji = (emoji: string) => {
    onSelected?.(emoji);
  };

  const handleDeleteEmoji = (emoji: string) => {
    onDelete?.(emoji);
  };

  const classString = classNames(prefixCls);
  const emojiRef = useRef<EmojiRef>(null);
  useImperativeHandle(ref, () => ({
    open: () => emojiRef.current?.open?.(),
    close: () => emojiRef.current?.close?.(),
  }));
  return (
    <Emoji
      ref={emojiRef}
      emojiConfig={reactionConfig || (globalRatConfig as EmojiProps['emojiConfig']) || emoji}
      selectedList={selectedList}
      onSelected={handleSelectedEmoji}
      onDelete={handleDeleteEmoji}
      icon={
        <Icon
          type="FACE_PLUS"
          width={isMobile ? 16 : 20}
          height={isMobile ? 16 : 20}
          className={classString}
        />
      }
      placement={placement}
      onClick={e => {
        onClick?.(e);
      }}
      onOpenChange={open => {
        onOpenChange?.(open);
      }}
    ></Emoji>
  );
});
EmojiKeyBoard.displayName = 'EmojiKeyBoard';
export { EmojiKeyBoard };
