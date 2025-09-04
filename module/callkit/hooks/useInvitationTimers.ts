import { useRef, useCallback, useEffect } from 'react';

export const useInvitationTimers = () => {
  const invitationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const invitedMembers = useRef<Set<string>>(new Set());

  // 清理指定用户的邀请定时器
  const clearInvitationTimer = useCallback((userId: string) => {
    const timer = invitationTimers.current.get(userId);
    if (timer) {
      clearTimeout(timer);
      invitationTimers.current.delete(userId);
    }
  }, []);

  // 清理所有邀请定时器
  const clearAllInvitationTimers = useCallback(() => {
    invitationTimers.current.forEach(timer => {
      clearTimeout(timer);
    });
    invitationTimers.current.clear();
    invitedMembers.current.clear();
  }, []);

  // 为指定用户设置邀请超时定时器
  const setInvitationTimer = useCallback(
    (userId: string, timeoutMs: number, onTimeout: (userId: string) => void) => {
      // 先清理已存在的定时器
      clearInvitationTimer(userId);

      // 添加到邀请成员列表
      invitedMembers.current.add(userId);

      // 设置新的定时器
      const timer = setTimeout(() => {
        onTimeout(userId);
        // 清理定时器
        invitationTimers.current.delete(userId);
        invitedMembers.current.delete(userId);
      }, timeoutMs);

      invitationTimers.current.set(userId, timer);
    },
    [clearInvitationTimer],
  );

  // 用户加入时清理定时器
  const handleUserJoined = useCallback(
    (userId: string) => {
      clearInvitationTimer(userId);
      invitedMembers.current.delete(userId);
    },
    [clearInvitationTimer],
  );

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      clearAllInvitationTimers();
    };
  }, [clearAllInvitationTimers]);

  return {
    setInvitationTimer,
    clearInvitationTimer,
    clearAllInvitationTimers,
    handleUserJoined,
  };
};
