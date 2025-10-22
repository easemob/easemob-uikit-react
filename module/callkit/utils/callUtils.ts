import { logWarn } from './logger';
/**
 * CallKit工具函数
 */

/**
 * 生成随机channel字符串
 * @param length 字符串长度，默认8位
 * @returns 随机字符串
 */
export const generateRandomChannel = (length: number = 8): string => {
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
};

/**
 * 格式化通话时间
 * @param seconds 秒数
 * @returns 格式化的时间字符串 (HH:MM:SS 或 MM:SS)
 */
export const formatCallDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * 获取用户头像的辅助函数
 * @param userId 用户ID
 * @param userInfoProvider 用户信息提供者
 * @returns Promise<string | undefined> 头像URL，undefined时让组件显示默认图标
 */
export const getUserAvatar = async (
  userId: string,
  userInfoProvider?: (userIds: string[]) => Promise<Array<{ userId: string; avatarUrl?: string }>>,
): Promise<string | undefined> => {
  if (!userInfoProvider) {
    return undefined; // 不使用假数据，让组件显示默认图标
  }

  try {
    const userInfos = await Promise.resolve(userInfoProvider([userId]));
    const userInfo = userInfos.find((info: any) => info.userId === userId);
    return userInfo?.avatarUrl; // 不使用假数据，让组件显示默认图标
  } catch (error) {
    logWarn(`获取用户 ${userId} 头像失败:`, error);
    return undefined; // 不使用假数据，让组件显示默认图标
  }
};

/**
 * 计算安全的屏幕位置
 * @param centerX 中心X坐标
 * @param centerY 中心Y坐标
 * @param width 窗口宽度
 * @param height 窗口高度
 * @param margin 边距
 * @returns 安全的位置坐标
 */
export const calculateSafePosition = (
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  margin: number = 20,
): { left: number; top: number } => {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const left = centerX - width / 2;
  const top = centerY - height / 2;

  const safeLeft = Math.max(margin, Math.min(left, windowWidth - width - margin));
  const safeTop = Math.max(margin, Math.min(top, windowHeight - height - margin));

  return { left: safeLeft, top: safeTop };
};
