import { useState, useRef, useCallback, useEffect } from 'react';
import { formatCallDuration } from '../utils/callUtils';

export const useCallTimer = () => {
  const [callDuration, setCallDuration] = useState('00:00:00');
  const callStartTimeRef = useRef<number | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 开始计时
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    callStartTimeRef.current = Date.now();
    setCallDuration('00:00:00');

    callTimerRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        const formattedTime = formatCallDuration(elapsed);
        setCallDuration(formattedTime);
      }
    }, 1000);
  }, []);

  // 停止计时
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    callStartTimeRef.current = null;
    setCallDuration('00:00:00');
  }, []);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      stopCallTimer();
    };
  }, [stopCallTimer]);

  return {
    callDuration,
    startCallTimer,
    stopCallTimer,
  };
};
