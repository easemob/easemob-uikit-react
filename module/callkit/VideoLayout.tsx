import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config';
import './styles/index.scss';
import CallKitHeader from './components/CallKitHeader';
import { Header } from '../header/Header';
import { Icon } from '../../component/icon/Icon';
import Button from '../../component/button';
import CallControls from './components/CallControls';

export interface VideoWindowProps {
  id: string;
  stream?: MediaStream;
  videoElement?: HTMLVideoElement;
  muted?: boolean;
  nickname?: string;
  avatar?: string;
  isLocalVideo?: boolean;
  onVideoClick?: (id: string) => void;
}

export interface VideoLayoutProps {
  videos: VideoWindowProps[];
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  maxVideos?: number; // 最多显示多少个视频，默认无限制
  aspectRatio?: number; // 视频窗口宽高比，默认1（正方形）
  gap?: number; // 视频窗口间距，默认8px
  onVideoClick?: (id: string) => void;
  // 控制按钮相关props
  showControls?: boolean; // 是否显示控制按钮
  muted?: boolean; // 是否静音
  cameraEnabled?: boolean; // 是否开启摄像头
  speakerEnabled?: boolean; // 是否开启扬声器
  screenSharing?: boolean; // 是否正在屏幕共享
  onMuteToggle?: (muted: boolean) => void;
  onCameraToggle?: (enabled: boolean) => void;
  onSpeakerToggle?: (enabled: boolean) => void;
  onScreenShareToggle?: (sharing: boolean) => void;
  onHangup?: () => void;
}

const VideoLayout: React.FC<VideoLayoutProps> = ({
  videos = [],
  className,
  style,
  prefix,
  maxVideos,
  aspectRatio = 1,
  gap = 8,
  onVideoClick,
  // 控制按钮相关props
  showControls = true,
  muted = false,
  cameraEnabled = true,
  speakerEnabled = true,
  screenSharing = false,
  onMuteToggle,
  onCameraToggle,
  onSpeakerToggle,
  onScreenShareToggle,
  onHangup,
}) => {
  console.log('VideoLayout', videos);
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('video-layout', prefix);

  // 全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 容器尺寸状态
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 全屏相关函数
  const enterFullscreen = async () => {
    if (containerRef.current) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error('进入全屏失败:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('退出全屏失败:', error);
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 限制显示的视频数量
  const displayVideos = useMemo(() => {
    return maxVideos ? videos.slice(0, maxVideos) : videos;
  }, [videos, maxVideos]);

  // 计算布局参数
  const layoutConfig = useMemo(() => {
    const count = displayVideos.length; // 视频数量

    if (count === 0) {
      return { rows: 0, cols: 0, itemsPerRow: [], maxCols: 0 };
    }

    if (count <= 4) {
      // 1排
      return {
        rows: 1,
        cols: count,
        maxCols: count,
        itemsPerRow: [count],
      };
    } else if (count <= 12) {
      // 2排 - 第一排数量递增，永远不减少
      let maxCols;
      if (count <= 8) {
        maxCols = 4; // 5-8个视频: 第一排4个
        // 5个: [1][2][3][4] / [5]
        // 6个: [1][2][3][4] / [5][6]
        // 7个: [1][2][3][4] / [5][6][7]
        // 8个: [1][2][3][4] / [5][6][7][8]
      } else if (count <= 10) {
        maxCols = 5; // 9-10个视频: 第一排5个
        // 9个: [1][2][3][4][5] / [6][7][8][9]
        // 10个: [1][2][3][4][5] / [6][7][8][9][10]
      } else {
        maxCols = 6; // 11-12个视频: 第一排6个
        // 11个: [1][2][3][4][5][6] / [7][8][9][10][11]
        // 12个: [1][2][3][4][5][6] / [7][8][9][10][11][12]
      }

      const firstRowItems = Math.min(maxCols, count);
      const secondRowItems = Math.max(0, count - maxCols);

      return {
        rows: 2,
        cols: maxCols,
        maxCols: maxCols,
        itemsPerRow: [firstRowItems, secondRowItems].filter(num => num > 0),
      };
    } else {
      // 3排
      //   const maxCols = Math.ceil(count / 3);
      //   const firstRowItems = Math.min(maxCols, count);
      //   const secondRowItems = Math.min(maxCols, Math.max(0, count - maxCols));
      //   const thirdRowItems = Math.max(0, count - maxCols * 2);

      const maxCols = 6;
      const firstRowItems = 6;
      const secondRowItems = 6;
      const thirdRowItems = Math.max(0, count - maxCols * 2);

      return {
        rows: 3,
        cols: maxCols,
        maxCols: maxCols,
        itemsPerRow: [firstRowItems, secondRowItems, thirdRowItems].filter(num => num > 0),
      };
    }
  }, [displayVideos.length]);

  // 计算视频最佳尺寸的函数
  const calculateOptimalVideoSize = useCallback(
    (layoutConfig: any) => {
      const { rows, itemsPerRow } = layoutConfig;

      if (rows === 0 || containerSize.width === 0 || containerSize.height === 0) {
        return { width: '100%', actualWidth: 0, actualHeight: 0 };
      }

      // 固定高度：header 60px + callControls 60px
      const headerHeight = 60;
      const controlsHeight = showControls ? 60 : 0;
      const availableHeight = containerSize.height - headerHeight - controlsHeight;

      // 计算行间距总高度（行数-1个间距）
      const totalRowGaps = Math.max(0, rows - 1) * gap;
      const videoContainerHeight = availableHeight - totalRowGaps;

      // 每行可用高度
      const heightPerRow = videoContainerHeight / rows;

      // 基于第一排计算（因为第一排通常是最宽的）
      const firstRowCount = itemsPerRow[0] || 1;

      // 1. 基于宽度计算可能的视频宽度
      const totalWidthGaps = (firstRowCount - 1) * gap;
      const availableWidth = containerSize.width - totalWidthGaps;
      const widthBasedVideoWidth = availableWidth / firstRowCount;
      const widthBasedVideoHeight = widthBasedVideoWidth / aspectRatio;

      // 2. 基于高度计算可能的视频宽度
      const heightBasedVideoHeight = heightPerRow;
      const heightBasedVideoWidth = heightBasedVideoHeight * aspectRatio;

      // 3. 选择较小的尺寸，确保不会溢出
      let finalVideoWidth: number;
      let finalVideoHeight: number;

      if (widthBasedVideoHeight <= heightPerRow) {
        // 宽度约束更严格，使用宽度计算的结果
        finalVideoWidth = widthBasedVideoWidth;
        finalVideoHeight = widthBasedVideoHeight;
      } else {
        // 高度约束更严格，使用高度计算的结果
        finalVideoWidth = heightBasedVideoWidth;
        finalVideoHeight = heightBasedVideoHeight;
      }

      // 确保最小尺寸
      finalVideoWidth = Math.max(100, finalVideoWidth);
      finalVideoHeight = Math.max(100 / aspectRatio, finalVideoHeight);

      console.log('视频尺寸计算:', {
        containerSize,
        availableHeight,
        videoContainerHeight,
        heightPerRow,
        firstRowCount,
        widthBasedVideoWidth,
        widthBasedVideoHeight,
        heightBasedVideoWidth,
        heightBasedVideoHeight,
        finalVideoWidth,
        finalVideoHeight,
        aspectRatio,
      });

      return {
        width: `${finalVideoWidth}px`,
        actualWidth: finalVideoWidth,
        actualHeight: finalVideoHeight,
      };
    },
    [containerSize, gap, aspectRatio, showControls],
  );

  const containerClass = classNames(
    prefixCls,
    `${prefixCls}-rows-${layoutConfig.rows}`,
    {
      [`${prefixCls}-fullscreen`]: isFullscreen,
    },
    className,
  );

  const handleVideoClick = (videoId: string) => {
    onVideoClick?.(videoId);
  };

  // 计算容器样式
  const containerStyle = useMemo(() => {
    const baseStyle = {
      ...style,
      gap: `${gap}px`,
    };

    return baseStyle;
  }, [style, gap]);

  const renderVideoWindow = (
    video: VideoWindowProps,
    index: number,
    windowSize?: { width: number; height: number },
  ) => {
    const videoClass = classNames(`${prefixCls}-window`, {
      [`${prefixCls}-window-local`]: video.isLocalVideo,
      [`${prefixCls}-window-muted`]: video.muted,
    });

    // 昵称显示阈值：窗口宽度或高度小于140px时不显示昵称
    const NICKNAME_DISPLAY_THRESHOLD = 140;
    const shouldShowNickname =
      !windowSize ||
      (windowSize.width >= NICKNAME_DISPLAY_THRESHOLD &&
        windowSize.height >= NICKNAME_DISPLAY_THRESHOLD);

    console.log('renderVideoWindow', video);
    return (
      <div
        key={video.id}
        className={videoClass}
        onClick={() => handleVideoClick(video.id)}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <div className={`${prefixCls}-video-container`}>
          {video.videoElement ? (
            <video
              //   ref={ref => {
              //     if (ref && video.videoElement) {
              //       // 如果提供了videoElement，则将其内容复制到ref
              //       ref.srcObject = video.stream || null;
              //       ref.muted = video.muted || false;
              //       ref.autoplay = true;
              //       ref.playsInline = true;
              //     }
              //   }}
              className={`${prefixCls}-video`}
              muted={video.muted}
              autoPlay
              playsInline
            />
          ) : video.stream ? (
            <video
              ref={ref => {
                if (ref && video.stream) {
                  ref.srcObject = video.stream;
                }
              }}
              className={`${prefixCls}-video`}
              muted={video.muted}
              autoPlay
              playsInline
            />
          ) : (
            <div className={`${prefixCls}-placeholder`}>
              {video.avatar ? (
                <img src={video.avatar} alt={video.nickname} className={`${prefixCls}-avatar`} />
              ) : (
                <div className={`${prefixCls}-avatar-placeholder`}>
                  {video.nickname?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          )}

          {/* 昵称显示 - 根据窗口尺寸控制显示 */}
          {video.nickname && shouldShowNickname && (
            <div className={`${prefixCls}-nickname`}>{video.nickname}</div>
          )}

          {video.muted && <div className={`${prefixCls}-muted-indicator`}>🔇</div>}
        </div>
      </div>
    );
  };

  if (displayVideos.length === 0) {
    return (
      <div ref={containerRef} className={containerClass} style={containerStyle}>
        <Header
          style={{ color: 'white' }}
          subtitle="12:00"
          suffixIcon={[
            <Button
              key="fullscreen"
              type="text"
              size="small"
              style={{ color: 'white' }}
              onClick={toggleFullscreen}
            >
              <Icon
                type={isFullscreen ? 'CHEVRON_4_CLUSTER' : 'CHEVRON_4_ALL_AROUND'}
                width={24}
                height={24}
              />
            </Button>,
            <Button
              key="boxes"
              type="text"
              size="small"
              style={{ color: 'white' }}
              onClick={() => {}}
            >
              <Icon type="BOXES" width={24} height={24} />
            </Button>,
          ]}
        />
        <div className={`${prefixCls}-content`}>
          <div className={`${prefixCls}-empty`}>No video streams</div>
        </div>
        {showControls && (
          <div className={`${prefixCls}-controls`}>
            <CallControls
              callMode="video"
              muted={muted}
              cameraEnabled={cameraEnabled}
              speakerEnabled={speakerEnabled}
              screenSharing={screenSharing}
              onMuteToggle={onMuteToggle}
              onCameraToggle={onCameraToggle}
              onSpeakerToggle={onSpeakerToggle}
              onScreenShareToggle={onScreenShareToggle}
              onHangup={onHangup}
            />
          </div>
        )}
      </div>
    );
  }
  // 渲染所有元素（支持flex行布局和grid布局）
  const renderAllElements = () => {
    const { maxCols, itemsPerRow } = layoutConfig;

    // 所有布局都使用flex行结构，确保一致性
    if (layoutConfig.rows >= 1) {
      const rows: React.ReactElement[] = [];
      let videoIndex = 0;

      // 使用优化后的尺寸计算算法
      const optimalSize = calculateOptimalVideoSize(layoutConfig);

      console.log('优化后的视频尺寸:', optimalSize);

      // 为每一排创建行
      itemsPerRow.forEach((rowItems, rowIndex) => {
        // 当前排的视频
        const rowVideos = displayVideos.slice(videoIndex, videoIndex + rowItems);

        rows.push(
          <div key={`row-${rowIndex}`} className={`${prefixCls}-row`}>
            {rowVideos.map((video, index) => (
              <div
                key={video.id}
                className={`${prefixCls}-video-wrapper`}
                style={{
                  width: optimalSize.width,
                  height: `${optimalSize.actualHeight}px`,
                  flexShrink: 0, // 防止收缩
                  flexGrow: 0, // 防止伸长
                }}
              >
                {renderVideoWindow(video, videoIndex + index, {
                  width: optimalSize.actualWidth,
                  height: optimalSize.actualHeight,
                })}
              </div>
            ))}
          </div>,
        );

        videoIndex += rowItems;
      });

      return <>{rows}</>;
    }

    // 备用：直接渲染（不应该到达这里）
    return displayVideos.map((video, index) => renderVideoWindow(video, index));
  };

  console.log('displayVideos', displayVideos);
  return (
    <div ref={containerRef} className={containerClass} style={containerStyle}>
      <Header
        style={{ color: 'white' }}
        subtitle="12:00"
        suffixIcon={[
          <Button
            key="fullscreen"
            type="text"
            size="small"
            style={{ color: 'white' }}
            onClick={toggleFullscreen}
          >
            <Icon
              type={isFullscreen ? 'CHEVRON_4_CLUSTER' : 'CHEVRON_4_ALL_AROUND'}
              width={24}
              height={24}
            />
          </Button>,
          <Button
            key="boxes"
            type="text"
            size="small"
            style={{ color: 'white' }}
            onClick={() => {}}
          >
            <Icon type="BOXES" width={24} height={24} />
          </Button>,
        ]}
      />
      <div className={`${prefixCls}-content`}>{renderAllElements()}</div>
      {showControls && (
        <div className={`${prefixCls}-controls`}>
          <CallControls
            callMode="video"
            muted={muted}
            cameraEnabled={cameraEnabled}
            speakerEnabled={speakerEnabled}
            screenSharing={screenSharing}
            onMuteToggle={onMuteToggle}
            onCameraToggle={onCameraToggle}
            onSpeakerToggle={onSpeakerToggle}
            onScreenShareToggle={onScreenShareToggle}
            onHangup={onHangup}
          />
        </div>
      )}
    </div>
  );
};

export default VideoLayout;
