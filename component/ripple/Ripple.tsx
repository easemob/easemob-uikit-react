import React, { useState, useRef, useContext } from 'react';
import './ripple.css'; // 需要添加对应的CSS样式
import { RootContext } from '../../module/store/rootContext';
export interface RippleProps {
  color?: string;
}

const Ripple = (props: RippleProps) => {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; size: number; color: string }[]
  >([]);
  const rippleContainer = useRef<HTMLDivElement>(null);

  const { theme } = useContext(RootContext);
  const themeMode = theme?.mode;
  const {
    color = themeMode == 'dark' ? 'var(--cui-primary-color4)' : 'var(--cui-primary-color7)',
  } = props;

  const createRipple = (event: any) => {
    const rippleContainerRect = rippleContainer.current!.getBoundingClientRect?.();
    const size = Math.max(rippleContainerRect?.width, rippleContainerRect.height);
    const x = event.clientX - rippleContainerRect.left - size / 2;
    const y = event.clientY - rippleContainerRect.top - size / 2;

    const newRipple = {
      id: new Date().getTime(),
      x,
      y,
      size,
      color,
    };

    setRipples([...ripples, newRipple]);

    // 移除水波纹
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600); // 动画时长
  };

  return (
    <div className="ripple-container" ref={rippleContainer} onClick={createRipple}>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            top: ripple.y,
            left: ripple.x,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: ripple.color,
          }}
        />
      ))}
    </div>
  );
};

export default Ripple;
