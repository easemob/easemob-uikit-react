import React, { useState, useImperativeHandle, forwardRef } from 'react';
import './style/panel.scss';
import Icon from '../../component/icon';
import Button from '../../component/button';
import { Tooltip } from '../../component/tooltip/Tooltip';

import { observer } from 'mobx-react-lite';
import ThreadList from './ThreadList';
export interface ThreadListExpandableIconProps {
  className?: string;
  prefix?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
  icon?: React.ReactNode;
  iconWidth?: string | number;
  iconHeight?: string | number;
  onClickItem?: () => void;
}
export interface ThreadListExpandableIconRef {
  open: () => void;
  close: () => void;
}

const ThreadListExpandableIcon = (
  props: ThreadListExpandableIconProps,
  ref: React.Ref<ThreadListExpandableIconRef>,
) => {
  const { style, icon, iconWidth, iconHeight } = props;

  const handleClose = (e?: React.MouseEvent<HTMLDivElement>) => {
    e?.stopPropagation();
    setIsOpen(false);
    props.onClose?.();
  };

  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
    },
    close: () => {
      setIsOpen(false);
    },
  }));
  return (
    <Tooltip
      destroyTooltipOnHide
      overlayInnerStyle={{ padding: 0 }}
      title={
        <ThreadList
          style={{
            ...style,
          }}
          onClose={handleClose}
          onClickItem={() => {
            setIsOpen(false);
            props.onClickItem?.();
          }}
        ></ThreadList>
      }
      trigger={'click'}
      arrowPointAtCenter={false}
      arrow={false}
      placement={'bottomLeft'}
      open={isOpen}
      onOpenChange={open => {
        setIsOpen(open);
      }}
    >
      {icon ? (
        icon
      ) : (
        <Button type="text" shape="circle">
          <Icon
            type="HASHTAG_IN_BUBBLE_FILL"
            width={iconWidth ? iconWidth : 24}
            height={iconHeight ? iconHeight : 24}
          ></Icon>
        </Button>
      )}
    </Tooltip>
  );
};

export default observer(forwardRef(ThreadListExpandableIcon));
