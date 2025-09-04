import { useCallback, useEffect, useRef, useState } from 'react';

interface DraggableState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
}

interface DraggableOptions {
  enabled?: boolean;
  resizableEnabled?: boolean; // 是否启用了调整大小功能
  onDragStart?: (startPosition: { x: number; y: number }) => void;
  onDrag?: (newPosition: { x: number; y: number }, delta: { x: number; y: number }) => void;
  onDragEnd?: (finalPosition: { x: number; y: number }) => void;
  containerRef?: React.RefObject<HTMLElement>;
  dragHandle?: string; // CSS 选择器，指定拖动手柄区域
  getCurrentPosition?: () => { left: number; top: number }; // 获取当前位置的回调
}

export const useDraggable = (options: DraggableOptions = {}) => {
  const {
    enabled = true,
    resizableEnabled = false,
    onDragStart,
    onDrag,
    onDragEnd,
    containerRef,
    dragHandle,
    getCurrentPosition,
  } = options;

  const [state, setState] = useState<DraggableState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
  });

  const dragStartRef = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(
    null,
  );
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false); // 标记是否真正发生了拖动
  const justFinishedDragRef = useRef(false); // 标记刚刚完成拖动

  // 检查是否点击在拖动区域内
  const isInDragArea = useCallback(
    (target: EventTarget | null): boolean => {
      if (!dragHandle || !containerRef?.current) return true;

      const element = target as HTMLElement;
      if (!element) return false;

      // 检查是否点击在指定的拖动手柄区域内
      const dragHandleElement = containerRef.current.querySelector(dragHandle);
      if (!dragHandleElement) return true;

      return dragHandleElement.contains(element);
    },
    [dragHandle, containerRef],
  );

  // 检查是否点击在调整大小区域内
  const isInResizeArea = useCallback(
    (event: MouseEvent): boolean => {
      // 如果调整大小功能未启用，则不存在调整大小区域，整个区域都可以拖动
      if (!resizableEnabled || !containerRef?.current) return false;

      const rect = containerRef.current.getBoundingClientRect();
      const threshold = 10; // 边缘检测阈值 - 与 useResizable 保持一致

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 检查是否在边缘区域
      const nearLeft = x <= threshold;
      const nearRight = x >= rect.width - threshold;
      const nearTop = y <= threshold;
      const nearBottom = y >= rect.height - threshold;

      return nearLeft || nearRight || nearTop || nearBottom;
    },
    [resizableEnabled, containerRef],
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !containerRef?.current) return;

      // 如果点击在调整大小区域，不处理拖动
      if (isInResizeArea(event)) return;

      // 如果指定了拖动手柄，检查是否点击在拖动区域内
      if (!isInDragArea(event.target)) return;

      // 阻止默认行为和事件冒泡
      event.preventDefault();
      event.stopPropagation();

      const startPosition = {
        x: event.clientX,
        y: event.clientY,
      };

      // 获取元素的准确位置
      let elementPosition;
      if (getCurrentPosition) {
        // 使用回调获取准确的当前位置
        const currentPos = getCurrentPosition();
        elementPosition = { x: currentPos.left, y: currentPos.top };
      } else {
        // 回退到使用 getBoundingClientRect
        const rect = containerRef.current.getBoundingClientRect();
        elementPosition = { x: rect.left, y: rect.top };
      }

      dragStartRef.current = {
        x: startPosition.x,
        y: startPosition.y,
        elementX: elementPosition.x,
        elementY: elementPosition.y,
      };

      isDraggingRef.current = true;
      hasDraggedRef.current = false; // 重置拖动标记

      setState(prev => ({
        ...prev,
        isDragging: true,
        dragOffset: { x: 0, y: 0 },
      }));

      // 设置全局样式（不设置光标，保持默认）
      document.body.style.userSelect = 'none';

      // 添加拖动中的样式类
      containerRef.current.classList.add('cui-callkit-dragging');

      onDragStart?.(startPosition);
    },
    [enabled, containerRef, isInDragArea, isInResizeArea, onDragStart, getCurrentPosition],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || !containerRef?.current) return;

      event.preventDefault();

      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;

      // 检查是否真正发生了拖动（移动距离超过阈值）
      const dragThreshold = 5; // 5px 阈值
      if (
        !hasDraggedRef.current &&
        (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)
      ) {
        hasDraggedRef.current = true;
      }

      const newPosition = {
        x: dragStartRef.current.elementX + deltaX,
        y: dragStartRef.current.elementY + deltaY,
      };

      setState(prev => ({
        ...prev,
        dragOffset: { x: deltaX, y: deltaY },
      }));

      onDrag?.(newPosition, { x: deltaX, y: deltaY });
    },
    [onDrag, containerRef],
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;

      const wasDragged = hasDraggedRef.current;

      // 只有在真正发生拖动时才阻止事件冒泡
      if (wasDragged) {
        event.preventDefault();
        event.stopPropagation();
      }

      const deltaX = event.clientX - dragStartRef.current.x;
      const deltaY = event.clientY - dragStartRef.current.y;

      const finalPosition = {
        x: dragStartRef.current.elementX + deltaX,
        y: dragStartRef.current.elementY + deltaY,
      };

      // 清理状态
      isDraggingRef.current = false;
      dragStartRef.current = null;
      hasDraggedRef.current = false; // 重置拖动标记

      setState(prev => ({
        ...prev,
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
      }));

      // 恢复样式
      document.body.style.userSelect = '';

      // 移除拖动中的样式类
      if (containerRef?.current) {
        containerRef.current.classList.remove('cui-callkit-dragging');
      }

      // 只有在真正发生拖动时才调用 onDragEnd
      if (wasDragged) {
        justFinishedDragRef.current = true;
        onDragEnd?.(finalPosition);

        // 延时重置标记，避免立即触发点击事件
        setTimeout(() => {
          justFinishedDragRef.current = false;
        }, 100);
      }
    },
    [onDragEnd, containerRef],
  );

  // 鼠标进入处理 - 不设置光标，保持默认行为
  const handleMouseEnter = useCallback(() => {
    // 不设置任何光标，让 useResizable 处理 resize 光标，其他时候保持默认
  }, []);

  const handleMouseLeave = useCallback(() => {
    // 不处理光标，让 useResizable 处理
  }, []);

  const handleMouseMoveHover = useCallback((event: MouseEvent) => {
    // 完全不处理光标，让 useResizable 处理所有光标逻辑
    // 避免任何可能的干扰
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const element = containerRef?.current;
    if (!element) return;

    // 添加事件监听器 - 使用冒泡阶段，确保 useResizable 的捕获阶段事件先执行
    element.addEventListener('mousedown', handleMouseDown, false);
    element.addEventListener('mouseenter', handleMouseEnter, false);
    element.addEventListener('mouseleave', handleMouseLeave, false);
    // 暂时移除 mousemove 监听器，避免干扰 useResizable 的光标设置
    // element.addEventListener('mousemove', handleMouseMoveHover, false);

    // 全局事件监听器（用于拖动过程中）
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // 清理事件监听器
      element.removeEventListener('mousedown', handleMouseDown, false);
      element.removeEventListener('mouseenter', handleMouseEnter, false);
      element.removeEventListener('mouseleave', handleMouseLeave, false);
      // element.removeEventListener('mousemove', handleMouseMoveHover, false);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 清理样式
      document.body.style.userSelect = '';
      element.classList.remove('cui-callkit-dragging');
    };
  }, [
    enabled,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    // handleMouseMoveHover, // 暂时移除
  ]);

  return {
    state,
    isDragging: state.isDragging,
    dragOffset: state.dragOffset,
    hasDragged: hasDraggedRef.current, // 暴露拖动状态
    justFinishedDrag: justFinishedDragRef.current, // 暴露刚完成拖动状态
  };
};
