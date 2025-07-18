import { useState, useEffect, useRef } from 'react';

/**
 * 检测视频流实际分辨率的Hook
 * 用于动态计算画中画视频的高度
 */
export const useVideoAspectRatio = (videoStream?: MediaStream | null) => {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9); // 默认16:9
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoStream) {
      setAspectRatio(16 / 9); // 没有视频流时使用默认比例
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // 设置视频流
    video.srcObject = videoStream;

    // 监听视频元数据加载完成事件
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        const ratio = video.videoWidth / video.videoHeight;
        console.log('🎬 检测到视频分辨率:', {
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: ratio,
        });
        setAspectRatio(ratio);
      }
    };

    // 监听视频流轨道变化
    const handleTrackChange = () => {
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          const ratio = settings.width / settings.height;
          console.log('🎬 从轨道设置检测到视频分辨率:', {
            width: settings.width,
            height: settings.height,
            aspectRatio: ratio,
          });
          setAspectRatio(ratio);
        }
      }
    };

    // 监听视频播放事件，确保视频元数据已加载
    const handleCanPlay = () => {
      handleLoadedMetadata();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    videoStream.addEventListener('addtrack', handleTrackChange);
    videoStream.addEventListener('removetrack', handleTrackChange);

    // 立即尝试获取分辨率
    handleLoadedMetadata();
    handleTrackChange();

    // 尝试播放视频以触发元数据加载
    video.play().catch(() => {
      // 忽略播放失败的错误，我们只需要元数据
    });

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      videoStream.removeEventListener('addtrack', handleTrackChange);
      videoStream.removeEventListener('removetrack', handleTrackChange);
    };
  }, [videoStream]);

  return { aspectRatio, videoRef };
};
