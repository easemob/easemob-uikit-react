import { useState, useEffect, useCallback, useRef } from 'react';
import { logDebug, logError, logWarn } from '../utils/logger';

export interface CameraDevice {
  deviceId: string;
  label: string;
  facingMode?: 'user' | 'environment'; // 前置或后置
}

export interface UseCameraDevicesResult {
  /** 摄像头设备列表（只包含前后主摄像头） */
  cameras: CameraDevice[];
  /** 当前选中的摄像头索引 */
  currentCameraIndex: number;
  /** 是否有多个摄像头（>=2）*/
  hasMultipleCameras: boolean;
  /** 是否已获得摄像头权限（deviceId 不为空）*/
  hasPermission: boolean;
  /** 是否正在加载设备列表 */
  isLoading: boolean;
  /** 切换到下一个摄像头，返回新的 deviceId */
  flipCamera: () => string | null;
}

// localStorage 缓存的 key
const CACHE_KEY = 'easemob_callkit_cameras';
// 缓存有效期：7天
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedCameraData {
  cameras: CameraDevice[];
  timestamp: number;
}

// 前置摄像头关键词（多语言）
const FRONT_CAMERA_KEYWORDS = [
  'front',
  'user',
  'facing front',
  'selfie',
  'facetime',
  '前置',
  '前',
  '前面',
  'vorder',
  'avant',
  'frontal',
  'delantera',
];

// 后置摄像头关键词（多语言）
const BACK_CAMERA_KEYWORDS = [
  'back',
  'rear',
  'environment',
  'main',
  '后置',
  '后',
  '後置',
  '背面',
  'rück',
  'arrière',
  'trasera',
  'posterior',
];

// 广角/超广角等应该排除的关键词
const EXCLUDE_KEYWORDS = [
  'wide',
  'ultra',
  'tele',
  'macro',
  'depth',
  'infrared',
  'ir',
  '广角',
  '超广',
  '长焦',
  '微距',
  '深度',
];

/**
 * 从 localStorage 获取缓存的摄像头信息
 */
function getCachedCameras(): CameraDevice[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedCameraData = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - data.timestamp > CACHE_EXPIRY_MS) {
      logDebug('🎥 摄像头缓存已过期');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    logDebug('🎥 使用缓存的摄像头信息', {
      count: data.cameras.length,
      cameras: data.cameras.map(c => ({ facingMode: c.facingMode, label: c.label })),
    });
    return data.cameras;
  } catch (error) {
    logWarn('🎥 读取摄像头缓存失败', error);
    return null;
  }
}

/**
 * 将摄像头信息保存到 localStorage
 */
function setCachedCameras(cameras: CameraDevice[]): void {
  try {
    const data: CachedCameraData = {
      cameras,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    logDebug('🎥 摄像头信息已缓存');
  } catch (error) {
    logWarn('🎥 缓存摄像头信息失败', error);
  }
}

/**
 * 检查 label 是否包含某些关键词
 */
function labelContainsKeyword(label: string, keywords: string[]): boolean {
  const lowerLabel = label.toLowerCase();
  return keywords.some(keyword => lowerLabel.includes(keyword.toLowerCase()));
}

/**
 * 检查是否是应该排除的摄像头（广角、超广角等）
 */
function shouldExcludeCamera(label: string): boolean {
  return labelContainsKeyword(label, EXCLUDE_KEYWORDS);
}

/**
 * 通过 label 判断摄像头类型
 */
function detectFacingMode(label: string): 'user' | 'environment' | undefined {
  if (labelContainsKeyword(label, FRONT_CAMERA_KEYWORDS)) {
    return 'user';
  }
  if (labelContainsKeyword(label, BACK_CAMERA_KEYWORDS)) {
    return 'environment';
  }
  return undefined;
}

/**
 * 从设备列表中筛选出前后主摄像头
 * 策略：
 * 1. 通过 label 关键词识别前置和后置摄像头
 * 2. 排除广角、超广角等非主摄像头
 * 3. 如果无法识别，回退到使用前两个摄像头
 */
function filterMainCameras(devices: MediaDeviceInfo[]): CameraDevice[] {
  const videoDevices = devices.filter(d => d.kind === 'videoinput');

  if (videoDevices.length === 0) {
    return [];
  }

  // 如果只有一个摄像头，直接返回
  if (videoDevices.length === 1) {
    return [
      {
        deviceId: videoDevices[0].deviceId,
        label: videoDevices[0].label || 'Camera',
      },
    ];
  }

  // 尝试通过 label 识别前后摄像头
  let frontCamera: CameraDevice | null = null;
  let backCamera: CameraDevice | null = null;

  for (const device of videoDevices) {
    const label = device.label || '';

    // 排除广角、超广角等
    if (shouldExcludeCamera(label)) {
      logDebug('🎥 排除非主摄像头:', label);
      continue;
    }

    const facingMode = detectFacingMode(label);

    if (facingMode === 'user' && !frontCamera) {
      frontCamera = {
        deviceId: device.deviceId,
        label: label || 'Front Camera',
        facingMode: 'user',
      };
      logDebug('🎥 识别到前置摄像头:', label);
    } else if (facingMode === 'environment' && !backCamera) {
      backCamera = {
        deviceId: device.deviceId,
        label: label || 'Back Camera',
        facingMode: 'environment',
      };
      logDebug('🎥 识别到后置摄像头:', label);
    }

    // 如果已经找到前后摄像头，退出循环
    if (frontCamera && backCamera) {
      break;
    }
  }

  const mainCameras: CameraDevice[] = [];

  if (frontCamera) {
    mainCameras.push(frontCamera);
  }

  if (backCamera) {
    mainCameras.push(backCamera);
  }

  // 如果通过 label 无法识别，回退到使用前两个摄像头
  // 通常移动设备上，第一个是前置，第二个是后置
  if (mainCameras.length < 2 && videoDevices.length >= 2) {
    logDebug('🎥 无法通过 label 识别，使用默认前两个摄像头');

    // 过滤掉已经添加的和应该排除的
    const addedIds = new Set(mainCameras.map(c => c.deviceId));
    const remaining = videoDevices.filter(
      d => !addedIds.has(d.deviceId) && !shouldExcludeCamera(d.label),
    );

    for (const device of remaining) {
      if (mainCameras.length >= 2) break;

      const camera: CameraDevice = {
        deviceId: device.deviceId,
        label: device.label || `Camera ${mainCameras.length + 1}`,
      };

      // 尝试猜测 facingMode
      if (mainCameras.length === 0) {
        camera.facingMode = 'user'; // 假设第一个是前置
      } else {
        camera.facingMode = 'environment'; // 假设第二个是后置
      }

      mainCameras.push(camera);
    }
  }

  logDebug('🎥 筛选出的主摄像头:', {
    count: mainCameras.length,
    cameras: mainCameras.map(c => ({ facingMode: c.facingMode, label: c.label })),
  });

  return mainCameras;
}

/**
 * 获取摄像头设备列表的 hook
 * - 只返回前后两个主摄像头（过滤掉广角、超广角等）
 * - 使用 enumerateDevices + label 分析，不调用 getUserMedia，避免与 RTC SDK 冲突
 * - 使用 localStorage 缓存
 * - 提供翻转摄像头功能
 */
export const useCameraDevices = (): UseCameraDevicesResult => {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // 获取设备列表（只使用 enumerateDevices，不会干扰正在使用的摄像头）
  const getDevices = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);

      // 如果不是强制刷新，先尝试使用缓存
      //   if (!forceRefresh) {
      //     const cachedCameras = getCachedCameras();
      //     if (cachedCameras && cachedCameras.length > 1) {
      //       if (mountedRef.current) {
      //         setCameras(cachedCameras);
      //         setIsLoading(false);
      //       }
      //       return;
      //     }
      //   }

      // 使用 enumerateDevices 获取设备列表（不会干扰正在使用的摄像头）
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      if (!mountedRef.current) return;

      // 筛选出前后主摄像头
      const mainCameras = filterMainCameras(allDevices);

      if (mainCameras.length > 1) {
        // 缓存结果
        setCachedCameras(mainCameras);
      }

      setCameras(mainCameras);
    } catch (error) {
      logError('🎥 useCameraDevices: 获取摄像头设备失败', error);
      if (mountedRef.current) {
        setCameras([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 强制刷新设备列表（清除缓存）
  const refreshDevices = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    await getDevices(true);
  }, [getDevices]);

  // 初始化
  useEffect(() => {
    mountedRef.current = true;
    getDevices(false);

    // 监听设备变化（插拔摄像头）
    const handleDeviceChange = () => {
      logDebug('🎥 useCameraDevices: 检测到设备变化，刷新列表');
      localStorage.removeItem(CACHE_KEY);
      getDevices(true);
    };

    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);

    return () => {
      mountedRef.current = false;
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [getDevices]);

  // 是否有多个摄像头
  const hasMultipleCameras = cameras.length >= 2;

  // 是否已获得权限（检查第一个摄像头的 deviceId 是否为空）
  const hasPermission = cameras.length > 0 && cameras[0].deviceId !== '';

  // 翻转摄像头
  const flipCamera = useCallback(() => {
    if (!hasMultipleCameras || !hasPermission) {
      logWarn('🎥 useCameraDevices: 无法翻转摄像头', {
        hasMultipleCameras,
        hasPermission,
        camerasCount: cameras.length,
      });
      return null;
    }

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    const newDeviceId = cameras[nextIndex].deviceId;
    logDebug('🎥 useCameraDevices: 切换摄像头', {
      from: currentCameraIndex,
      to: nextIndex,
      fromFacingMode: cameras[currentCameraIndex]?.facingMode,
      toFacingMode: cameras[nextIndex]?.facingMode,
      newDeviceId: newDeviceId.slice(0, 8),
    });

    return newDeviceId;
  }, [cameras, currentCameraIndex, hasMultipleCameras, hasPermission]);

  return {
    cameras,
    currentCameraIndex,
    hasMultipleCameras,
    hasPermission,
    isLoading,
    flipCamera,
  };
};
