import React, { useState } from 'react';
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
}
const ThreadListExpandableIcon = (props: ThreadListExpandableIconProps) => {
  const { style, icon } = props;

  const handleClose = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  const [isOpen, setIsOpen] = useState(false);
  return (
    <Tooltip
      overlayInnerStyle={{ padding: 0 }}
      title={
        <ThreadList
          style={{
            ...style,
          }}
          onClose={handleClose}
          onClickItem={() => {
            setIsOpen(false);
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
          <Icon type="THREAD" width={24} height={24}></Icon>
        </Button>
      )}
    </Tooltip>
  );
};

export default observer(ThreadListExpandableIcon);
