import { useCallback, useEffect, useRef, useState } from 'react';

export interface ResizableConfig {
  enabled: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  onResize?: (
    width: number,
    height: number,
    newLeft?: number,
    newTop?: number,
    direction?: string,
  ) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export interface ResizableState {
  width: number;
  height: number;
  isResizing: boolean;
  resizeDirection: string;
}

export const useResizable = (config: ResizableConfig) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = config.containerRef || internalRef;
  const [state, setState] = useState<ResizableState>({
    width: 0,
    height: 0,
    isResizing: false,
    resizeDirection: '',
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

  // 初始化容器尺寸
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setState(prev => ({
        ...prev,
        width: rect.width,
        height: rect.height,
      }));
    }
  }, []);

  // 获取调整方向 - 参考提供的代码逻辑
  const getResizeDirection = useCallback((e: MouseEvent, rect: DOMRect) => {
    const threshold = 10; // 边缘检测阈值（像素）- 增加到 10px 让悬浮检测更容易触发

    // 计算鼠标与各边缘的距离
    const topDistance = e.clientY - rect.top;
    const rightDistance = rect.right - e.clientX;
    const bottomDistance = rect.bottom - e.clientY;
    const leftDistance = e.clientX - rect.left;

    // 检测角落（优先级更高）
    if (topDistance < threshold && leftDistance < threshold) {
      return 'nw'; // 左上角
    } else if (topDistance < threshold && rightDistance < threshold) {
      return 'ne'; // 右上角
    } else if (bottomDistance < threshold && leftDistance < threshold) {
      return 'sw'; // 左下角
    } else if (bottomDistance < threshold && rightDistance < threshold) {
      return 'se'; // 右下角
    }
    // 检测边缘
    else if (topDistance < threshold) {
      return 'n'; // 上边
    } else if (rightDistance < threshold) {
      return 'e'; // 右边
    } else if (bottomDistance < threshold) {
      return 's'; // 下边
    } else if (leftDistance < threshold) {
      return 'w'; // 左边
    }

    return ''; // 不在边缘区域
  }, []);

  // 获取光标样式 - 参考提供的代码逻辑
  const getCursorStyle = useCallback((direction: string) => {
    const cursorMap: Record<string, string> = {
      n: 'ns-resize', // 上边
      s: 'ns-resize', // 下边
      e: 'ew-resize', // 右边
      w: 'ew-resize', // 左边
      nw: 'nwse-resize', // 左上角
      ne: 'nesw-resize', // 右上角
      sw: 'nesw-resize', // 左下角
      se: 'nwse-resize', // 右下角
    };
    return cursorMap[direction] || 'default';
  }, []);

  // 鼠标移动处理 - 改进稳定性
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!config.enabled || !containerRef.current) return;

      if (!isDragging) {
        // 只在非拖动状态下进行边缘检测和光标更新
        const rect = containerRef.current.getBoundingClientRect();
        const direction = getResizeDirection(e, rect);

        // 更新状态
        setState(prev => {
          // 只在方向真正改变时更新状态
          if (prev.resizeDirection !== direction) {
            return { ...prev, resizeDirection: direction };
          }
          return prev;
        });

        // 确定光标类型和调整方向
        const cursor = getCursorStyle(direction);

        // 设置光标和data属性 - 使用 !important 确保优先级
        if (direction) {
          containerRef.current.setAttribute('data-resize-direction', direction);
          // 强制设置光标，确保优先级
          containerRef.current.style.setProperty('cursor', cursor, 'important');

          // 防止其他代码重置光标，添加防护
          requestAnimationFrame(() => {
            if (
              containerRef.current &&
              containerRef.current.getAttribute('data-resize-direction') === direction
            ) {
              containerRef.current.style.setProperty('cursor', cursor, 'important');
            }
          });
        } else {
          containerRef.current.removeAttribute('data-resize-direction');
          // 清除任何通过 JS 设置的光标样式
          containerRef.current.style.removeProperty('cursor');
        }
      } else {
        // 拖动过程中，强制保持正确的 resize 样式
        const resizeCursor = getCursorStyle(state.resizeDirection);

        if (containerRef.current) {
          containerRef.current.style.setProperty('cursor', resizeCursor, 'important');
          containerRef.current.setAttribute('data-resize-direction', state.resizeDirection);

          // 强制保持光标，防止被其他代码重置
          requestAnimationFrame(() => {
            if (containerRef.current && isDragging) {
              containerRef.current.style.setProperty('cursor', resizeCursor, 'important');
            }
          });
        }

        // 执行拖拽调整
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        let newWidth = dragStart.width;
        let newHeight = dragStart.height;
        let newLeft = 0;
        let newTop = 0;

        // 根据拖拽方向计算新尺寸和位置 - 修复上边和左边的调整
        const direction = state.resizeDirection;
        const minWidth = config.minWidth || 200;
        const minHeight = config.minHeight || 150;

        switch (direction) {
          case 'e': {
            // 右边
            const proposedWidth = dragStart.width + deltaX;
            const maxWidth = config.maxWidth || Infinity;

            // 如果已经达到最大宽度且试图继续增大，则完全不变
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
            }
            break;
          }
          case 's': {
            // 下边
            const proposedHeight = dragStart.height + deltaY;
            const maxHeight = config.maxHeight || Infinity;

            // 如果已经达到最大高度且试图继续增大，则完全不变
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
            }
            break;
          }
          case 'w': {
            // 左边
            const proposedWidth = dragStart.width - deltaX;
            const maxWidth = config.maxWidth || Infinity;

            // 如果已经达到最大宽度且试图继续增大，则完全不变
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
              newLeft = dragStart.left;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
              // 计算实际的宽度变化
              const actualWidthChange = dragStart.width - newWidth;
              newLeft = dragStart.left + actualWidthChange;
            }
            break;
          }
          case 'n': {
            // 上边
            const proposedHeight = dragStart.height - deltaY;
            const maxHeight = config.maxHeight || Infinity;

            // 如果已经达到最大高度且试图继续增大，则完全不变
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
              newTop = dragStart.top;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
              // 计算实际的高度变化
              const actualHeightChange = dragStart.height - newHeight;
              newTop = dragStart.top + actualHeightChange;
            }
            break;
          }
          case 'se': {
            // 右下角
            const proposedWidth = dragStart.width + deltaX;
            const proposedHeight = dragStart.height + deltaY;
            const maxWidth = config.maxWidth || Infinity;
            const maxHeight = config.maxHeight || Infinity;

            // 处理宽度
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
            }

            // 处理高度
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
            }
            break;
          }
          case 'sw': {
            // 左下角
            const proposedWidth = dragStart.width - deltaX;
            const proposedHeight = dragStart.height + deltaY;
            const maxWidth = config.maxWidth || Infinity;
            const maxHeight = config.maxHeight || Infinity;

            // 处理宽度和左边位置
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
              newLeft = dragStart.left;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
              const actualWidthChange = dragStart.width - newWidth;
              newLeft = dragStart.left + actualWidthChange;
            }

            // 处理高度
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
            }
            break;
          }
          case 'ne': {
            // 右上角
            const proposedWidth = dragStart.width + deltaX;
            const proposedHeight = dragStart.height - deltaY;
            const maxWidth = config.maxWidth || Infinity;
            const maxHeight = config.maxHeight || Infinity;

            // 处理宽度
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
            }

            // 处理高度和上边位置
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
              newTop = dragStart.top;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
              const actualHeightChange = dragStart.height - newHeight;
              newTop = dragStart.top + actualHeightChange;
            }
            break;
          }
          case 'nw': {
            // 左上角
            const proposedWidth = dragStart.width - deltaX;
            const proposedHeight = dragStart.height - deltaY;
            const maxWidth = config.maxWidth || Infinity;
            const maxHeight = config.maxHeight || Infinity;

            // 处理宽度和左边位置
            if (dragStart.width >= maxWidth && proposedWidth > dragStart.width) {
              newWidth = dragStart.width;
              newLeft = dragStart.left;
            } else {
              newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
              const actualWidthChange = dragStart.width - newWidth;
              newLeft = dragStart.left + actualWidthChange;
            }

            // 处理高度和上边位置
            if (dragStart.height >= maxHeight && proposedHeight > dragStart.height) {
              newHeight = dragStart.height;
              newTop = dragStart.top;
            } else {
              newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
              const actualHeightChange = dragStart.height - newHeight;
              newTop = dragStart.top + actualHeightChange;
            }
            break;
          }
        }

        // 最大尺寸限制已在各个case中处理

        // 更新状态
        setState(prev => ({
          ...prev,
          width: newWidth,
          height: newHeight,
        }));

        // 应用样式 - 只应用尺寸变化，位置由 React 状态管理
        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`;
          containerRef.current.style.height = `${newHeight}px`;
        }

        // 智能处理位置回调 - 根据元素的定位方式自动计算正确的坐标
        if (config.onResize) {
          let callbackLeft: number | undefined;
          let callbackTop: number | undefined;

          // 只有在需要位置调整的方向才传递位置信息
          if (direction.includes('w') || direction.includes('n')) {
            const elementStyle = window.getComputedStyle(containerRef.current);
            const position = elementStyle.position;

            if (position === 'fixed') {
              // fixed 定位：相对于视口，直接使用计算出的位置
              callbackLeft = direction.includes('w') ? newLeft : undefined;
              callbackTop = direction.includes('n') ? newTop : undefined;
            } else if (position === 'absolute') {
              // absolute 定位：需要根据定位上下文计算
              const offsetParent = containerRef.current.offsetParent;

              if (offsetParent && offsetParent !== document.body) {
                // 有定位父元素，计算相对位置
                const parentRect = offsetParent.getBoundingClientRect();
                callbackLeft = direction.includes('w') ? newLeft - parentRect.left : undefined;
                callbackTop = direction.includes('n') ? newTop - parentRect.top : undefined;
              } else {
                // 相对于文档，直接使用计算出的位置
                callbackLeft = direction.includes('w') ? newLeft : undefined;
                callbackTop = direction.includes('n') ? newTop : undefined;
              }
            } else {
              // static/relative 定位：通常不需要位置调整
              // 但如果用户设置了 left/top，仍然提供位置信息
              callbackLeft = direction.includes('w') ? newLeft : undefined;
              callbackTop = direction.includes('n') ? newTop : undefined;
            }
          }

          config.onResize(newWidth, newHeight, callbackLeft, callbackTop, direction);
        }

        // 确保拖动过程中光标保持正确
        const cursor = getCursorStyle(direction);
        // 同时在容器上也设置 resize 光标
        if (containerRef.current) {
          containerRef.current.style.setProperty('cursor', cursor, 'important');
        }
      }
    },
    [config, isDragging, dragStart, state.resizeDirection, getResizeDirection, getCursorStyle],
  );

  // 鼠标按下处理 - 参考提供的代码逻辑
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!config.enabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const direction = getResizeDirection(e, rect);

      // 如果不在调整边缘，不处理
      if (!direction) return;

      // 阻止默认行为和事件冒泡
      e.preventDefault();
      e.stopPropagation();

      // 开始调整大小
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
      });

      setState(prev => ({
        ...prev,
        isResizing: true,
        resizeDirection: direction,
      }));

      // 添加 resizing class 用于视觉反馈
      containerRef.current.classList.add('cui-callkit-resizing');

      // 设置必要的全局样式，但不设置 body 光标
      document.body.style.setProperty('user-select', 'none', 'important');
      document.body.classList.add('cui-callkit-dragging');

      // 强制设置并保持 resize 光标
      const cursor = getCursorStyle(direction);
      containerRef.current.style.setProperty('cursor', cursor, 'important');
      containerRef.current.setAttribute('data-resize-direction', direction);

      // 防止其他代码重置光标，添加多重保护
      requestAnimationFrame(() => {
        if (containerRef.current && isDragging) {
          containerRef.current.style.setProperty('cursor', cursor, 'important');
        }
      });

      // 额外的保护，确保光标在点击后不会被重置
      setTimeout(() => {
        if (containerRef.current && isDragging) {
          containerRef.current.style.setProperty('cursor', cursor, 'important');
        }
      }, 10);
    },
    [config.enabled, getResizeDirection, getCursorStyle],
  );

  // 鼠标抬起处理 - 改进稳定性
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);

        if (containerRef.current) {
          containerRef.current.classList.remove('cui-callkit-resizing');

          // 检查鼠标是否仍在边缘区域
          const rect = containerRef.current.getBoundingClientRect();
          const direction = getResizeDirection(e, rect);

          if (direction) {
            // 如果仍在边缘，保持 resize 光标
            const cursor = getCursorStyle(direction);
            containerRef.current.style.setProperty('cursor', cursor, 'important');
            containerRef.current.setAttribute('data-resize-direction', direction);

            // 更新状态，保持正确的 resizeDirection
            setState(prev => ({
              ...prev,
              isResizing: false,
              resizeDirection: direction,
            }));
          } else {
            // 如果不在边缘，清除 resize 光标
            containerRef.current.removeAttribute('data-resize-direction');
            if (containerRef.current.style.cursor.includes('resize')) {
              containerRef.current.style.removeProperty('cursor');
            }

            // 更新状态，清空 resizeDirection
            setState(prev => ({
              ...prev,
              isResizing: false,
              resizeDirection: '',
            }));
          }
        }

        // 恢复默认样式
        document.body.style.removeProperty('user-select');
        document.body.classList.remove('cui-callkit-dragging');

        // 立即触发一次 mousemove 检测，确保边缘悬浮状态正确
        setTimeout(() => {
          if (containerRef.current && !isDragging) {
            // 手动触发边缘检测
            handleMouseMove(e);
          }
        }, 0);
      }
    },
    [isDragging, getResizeDirection, getCursorStyle],
  );

  // 鼠标离开处理 - 改进稳定性
  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // 如果不在调整大小状态，重置光标
      if (!isDragging && containerRef.current) {
        // 检查鼠标是否真的离开了容器区域
        const rect = containerRef.current.getBoundingClientRect();
        const isOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;

        if (isOutside) {
          setState(prev => ({ ...prev, resizeDirection: '' }));
          containerRef.current.removeAttribute('data-resize-direction');
          // 清除 resize 光标，让其恢复默认
          if (containerRef.current.style.cursor.includes('resize')) {
            containerRef.current.style.removeProperty('cursor');
          }
        }
      }
    },
    [isDragging],
  );

  // 绑定事件监听器 - 分离基础事件和拖拽事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !config.enabled) return;

    // 绑定容器基础事件 - 使用捕获阶段确保优先级
    container.addEventListener('mousemove', handleMouseMove, true);
    container.addEventListener('mousedown', handleMouseDown, true);
    container.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove, true);
      container.removeEventListener('mousedown', handleMouseDown, true);
      container.removeEventListener('mouseleave', handleMouseLeave, true);

      if (container) {
        container.removeAttribute('data-resize-direction');
        // 不要重置光标，让 CSS 规则处理
      }
    };
  }, [config.enabled, handleMouseMove, handleMouseDown, handleMouseLeave]);

  // 单独处理全局事件 - 避免重复绑定
  useEffect(() => {
    if (!config.enabled) return;

    // 始终监听全局鼠标抬起事件
    const handleGlobalMouseUp = (e: MouseEvent) => {
      handleMouseUp(e);
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [config.enabled, handleMouseUp]);

  // 拖拽时的全局鼠标移动事件
  useEffect(() => {
    if (!config.enabled || !isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [config.enabled, isDragging, handleMouseMove]);

  return {
    containerRef: internalRef,
    state,
    isResizable: config.enabled,
  };
};
