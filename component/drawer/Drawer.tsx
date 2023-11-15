import React, { useState } from 'react';
import './style/style.scss';

export interface DrawerProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  width?: string | number;
  height?: string | number;
  handle?: React.ReactNode;
}

const Drawer = (props: DrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={isOpen ? 'drawer open' : 'drawer'}>
      <div className="drawer-bar" onClick={handleToggle}></div>
      <div className="drawer-content">
        {isOpen ? <button onClick={handleToggle}>收起</button> : <span>点击展开</span>}
      </div>
    </div>
  );
};

export default Drawer;
