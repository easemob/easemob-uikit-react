import React, { ReactElement, useState, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import { MenuItem } from './MenuItem';
import { MenuWrap } from './MenuWrap';
import './style/style.scss';

export interface DropdownProps {
  className?: string;
  style?: React.CSSProperties;
  children: ReactElement;
  menu: ReactElement[];
  isOpen?: boolean;
}

const Dropdown = ({ children, className, menu, isOpen, style = {} }: DropdownProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('dropdown');
  const classes = classNames(prefixCls, className);
  const [open, setOpen] = useState(!!isOpen);
  const containerRef = useRef(null);

  const handleOpen = () => {
    setOpen(!open);
  };

  return (
    <>
      <div className={classes} ref={containerRef} style={{ ...style }}>
        {React.cloneElement(children, {
          onClick: handleOpen,
        })}
      </div>
      {open ? (
        <MenuWrap
          onClose={() => {
            setOpen(false);
          }}
          containerRef={containerRef}
        >
          <>
            {menu?.map((item, idx) => {
              return (
                <MenuItem
                  key={idx}
                  onClick={e => {
                    item.props.onClick(e);
                    setOpen(false);
                  }}
                >
                  {item}
                </MenuItem>
              );
            })}
          </>
        </MenuWrap>
      ) : null}
    </>
  );
};

export { Dropdown };
