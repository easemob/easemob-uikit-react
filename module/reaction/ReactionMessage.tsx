import React, { ReactNode, useState } from 'react';
import Button from '../../component/button';
import Icon from '../../component/icon';
import { ReactionButton } from './ReactionButton';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import { EmojiKeyBoard } from './EmojiKeyboard';
export interface ReactionData {
  count: number;
  isAddedBySelf?: boolean;
  reaction: string;
  userList: string[];
  op?: { operator: string; reactionType: 'create' | 'delete' }[];
}

export interface ReactionMessageProps {
  prefixCls?: string;
  className?: string;
  reactionData: ReactionData[];
  direction?: 'ltr' | 'rtl';
  icon?: ReactNode;
  onSelected?: (emojiString: string) => void;
  trigger?: 'click' | 'hover';
  config?: { map: any; path: string };
  onClick?: (emojiString: string) => void;
  onDelete?: (emojiString: string) => void;
  onShowUserList?: (emojiString: string) => void;
}

const ReactionMessage = (props: ReactionMessageProps) => {
  const {
    onSelected,
    icon,
    trigger = 'click',
    onClick,
    reactionData,
    onDelete,
    prefixCls: customizePrefixCls,
    className,
    direction = 'ltr',
    onShowUserList,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('reaction-box', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-left`]: direction == 'ltr',
      [`${prefixCls}-right`]: direction == 'rtl',
    },
    className,
  );

  const [hoverStatus, setHoverStatus] = useState(false);

  const arr = [
    '[):]',
    '[:@]',
    '[(W)]',
    '[(D)]',
    '[(E)]',
    '[(T)]',
    '[(Y)]',
    '[(I)]',
    '[(J)]',
    '[(K)]',
    '[(L)]',
    '[(M)]',
  ];

  const handleClickReaction = (emoji: string) => {
    onClick && onClick(emoji);
  };

  const handleDeleteReaction = (emoji: string) => {
    onDelete && onDelete(emoji);
  };

  const handleShowUserList = (emoji: string) => {
    onShowUserList && onShowUserList(emoji);
  };

  const selectedList: string[] = [];
  if (reactionData) {
    reactionData.forEach(item => {
      if (item.isAddedBySelf) {
        selectedList.push(item.reaction);
      }
    });
  }
  
  return (
    <div
      className={classString}
      onMouseOver={() => {
        setHoverStatus(true);
      }}
      onMouseLeave={() => {
        setHoverStatus(false);
      }}
    >
      {reactionData.map((item, index) => {
        return (
          <ReactionButton
            key={item.reaction + index}
            count={item.count}
            reaction={item.reaction}
            isAddedBySelf={item.isAddedBySelf || false}
            userList={item.userList}
            onClick={handleClickReaction}
            onDelete={handleDeleteReaction}
            onShowUserList={handleShowUserList}
          ></ReactionButton>
        );
      })}

      {hoverStatus && (
        <EmojiKeyBoard
          onSelected={handleClickReaction}
          selectedList={selectedList}
          onDelete={handleDeleteReaction}
        ></EmojiKeyBoard>
      )}
    </div>
  );
};

export { ReactionMessage };
