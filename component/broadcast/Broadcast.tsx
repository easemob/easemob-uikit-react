import React, { useState, useEffect, useContext } from 'react';
import Marquee from 'react-fast-marquee';
import { ConfigContext } from '../config/index';
import classNames from 'classnames';
import './style/style.scss';
export interface BroadcastProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  loop?: number;
  delay?: number;
  speed?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
  play?: boolean;
  pauseOnHover?: boolean;
  onFinish?: () => void;
}

const Broadcast = (props: BroadcastProps) => {
  const {
    prefix,
    className,
    style,
    loop = 0,
    delay = 0,
    speed = 50,
    direction = 'left',
    play = true,
    pauseOnHover = true,
    onFinish,
    children,
    prefixIcon,
    suffixIcon,
  } = props;
  const { getPrefixCls } = useContext(ConfigContext);
  const prefixCls = getPrefixCls('broadcast', prefix);

  const classString = classNames(prefixCls, className);

  return (
    <div className={classString} style={{ ...style }}>
      {prefixIcon}
      <Marquee
        loop={loop}
        delay={delay}
        speed={speed}
        direction={direction}
        play={play}
        pauseOnHover={pauseOnHover}
        onFinish={() => {
          console.log('完成');
          onFinish?.();
        }}
        autoFill={false}
        onCycleComplete={() => {
          console.log('完成');
        }}
      >
        {children}
      </Marquee>
      {suffixIcon}
    </div>
  );
};

export { Broadcast };
