import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from '../../../component/icon/Icon';
import type {
  LayoutStrategy,
  LayoutConfig,
  VideoSize,
  ContainerSize,
  LayoutOptions,
  VideoWindowProps,
  VideoSwitchingState,
} from '../types/index';
import { LayoutMode } from '../types/index';
import { logger, logError, logWarn, logInfo, logDebug, logVerbose } from '../utils/logger';
import { useIsMobile } from '../../hooks/useScreen';
/**
 * 多人网格布局策略
 */
export class MultiPartyLayoutStrategy implements LayoutStrategy {
  calculateLayout(videoCount: number, containerSize: ContainerSize): LayoutConfig {
    if (videoCount === 0) {
      return { rows: 0, cols: 0, itemsPerRow: [], maxCols: 0, mode: LayoutMode.MULTI_PARTY };
    }
    console.log('containerSize ---->', containerSize);
    // 移动端
    if (containerSize.width < 530) {
      if (videoCount <= 2) {
        return {
          rows: 1,
          cols: videoCount,
          maxCols: videoCount,
          itemsPerRow: [videoCount],
          mode: LayoutMode.MULTI_PARTY,
        };
      } else if (videoCount > 2 && videoCount <= 4) {
        return {
          rows: 2,
          cols: 2,
          maxCols: 2,
          itemsPerRow: [2, videoCount - 2],
          mode: LayoutMode.MULTI_PARTY,
        };
      } else if (videoCount > 4 && videoCount <= 9) {
        if (videoCount <= 6) {
          return {
            rows: 3,
            cols: 2,
            maxCols: 2,
            itemsPerRow: [2, 2, videoCount - 4],
            mode: LayoutMode.MULTI_PARTY,
          };
        }
        return {
          rows: 3,
          cols: 3,
          maxCols: 3,
          itemsPerRow: [3, 3, videoCount - 6],
          mode: LayoutMode.MULTI_PARTY,
        };
      } else {
        if (videoCount <= 12) {
          return {
            rows: 4,
            cols: 3,
            maxCols: 3,
            itemsPerRow: [3, 3, 3, videoCount - 9],
            mode: LayoutMode.MULTI_PARTY,
          };
        }
        return {
          rows: 4,
          cols: 4,
          maxCols: 4,
          itemsPerRow: [4, 4, 4, videoCount - 12],
          mode: LayoutMode.MULTI_PARTY,
        };
      }
    } else {
      // 桌面端
      if (videoCount <= 4) {
        // 1排
        return {
          rows: 1,
          cols: videoCount,
          maxCols: videoCount,
          itemsPerRow: [videoCount],
          mode: LayoutMode.MULTI_PARTY,
        };
      } else if (videoCount <= 12) {
        // 2排
        let maxCols;
        if (videoCount <= 8) {
          maxCols = 4; // 5-8个视频: 第一排4个
        } else if (videoCount <= 10) {
          maxCols = 5; // 9-10个视频: 第一排5个
        } else {
          maxCols = 6; // 11-12个视频: 第一排6个
        }

        const firstRowItems = Math.min(maxCols, videoCount);
        const secondRowItems = Math.max(0, videoCount - maxCols);

        return {
          rows: 2,
          cols: maxCols,
          maxCols: maxCols,
          itemsPerRow: [firstRowItems, secondRowItems].filter(num => num > 0),
          mode: LayoutMode.MULTI_PARTY,
        };
      } else {
        // 3排
        const maxCols = 6;
        const firstRowItems = 6;
        const secondRowItems = 6;
        const thirdRowItems = Math.max(0, videoCount - maxCols * 2);

        return {
          rows: 3,
          cols: maxCols,
          maxCols: maxCols,
          itemsPerRow: [firstRowItems, secondRowItems, thirdRowItems].filter(num => num > 0),
          mode: LayoutMode.MULTI_PARTY,
        };
      }
    }
  }

  calculateVideoSize(
    layoutConfig: LayoutConfig,
    containerSize: ContainerSize,
    options: LayoutOptions,
  ): VideoSize {
    const { rows, itemsPerRow } = layoutConfig;
    const { aspectRatio, gap, headerHeight, controlsHeight } = options;

    if (rows === 0 || containerSize.width === 0 || containerSize.height === 0) {
      return { width: '100%', height: '100%', actualWidth: 0, actualHeight: 0 };
    }

    // 容器的 padding: 8px，所以宽度和高度都要减去 16px (8px * 2)
    const containerPadding = 8;
    const availableHeight =
      containerSize.height - headerHeight - controlsHeight - containerPadding * 2 - 16 - 8; // 16px callcontrols margin-top，8px 是 margin-bottom
    const availableWidth = containerSize.width - containerPadding * 2 - gap * 2;

    const totalRowGaps = Math.max(0, rows - 1) * gap;
    const videoContainerHeight = availableHeight - totalRowGaps;
    const heightPerRow = videoContainerHeight / rows;

    const firstRowCount = itemsPerRow[0] || 1;

    // 基于宽度计算
    const totalWidthGaps = (firstRowCount - 1) * gap;
    const widthBasedVideoWidth = (availableWidth - totalWidthGaps) / firstRowCount;
    const widthBasedVideoHeight = widthBasedVideoWidth / aspectRatio;

    // 基于高度计算
    const heightBasedVideoHeight = heightPerRow;
    const heightBasedVideoWidth = heightBasedVideoHeight * aspectRatio;

    // 选择较小的尺寸
    let finalVideoWidth: number;
    let finalVideoHeight: number;

    if (widthBasedVideoHeight <= heightPerRow) {
      finalVideoWidth = widthBasedVideoWidth;
      finalVideoHeight = widthBasedVideoHeight;
    } else {
      finalVideoWidth = heightBasedVideoWidth;
      finalVideoHeight = heightBasedVideoHeight;
    }

    // 确保最小尺寸
    finalVideoWidth = Math.max(100, finalVideoWidth);
    finalVideoHeight = Math.max(100 / aspectRatio, finalVideoHeight);

    return {
      width: `${finalVideoWidth}px`,
      height: `${finalVideoHeight}px`,
      actualWidth: finalVideoWidth,
      actualHeight: finalVideoHeight,
    };
  }

  renderLayout(
    videos: VideoWindowProps[],
    layoutConfig: LayoutConfig,
    videoSize: VideoSize,
    renderVideoWindow: (
      video: VideoWindowProps,
      index: number,
      windowSize?: { width: number; height: number },
    ) => React.ReactNode,
    prefixCls: string,
    gap: number,
    selectedVideoId?: string,
    onVideoClick?: (e: React.MouseEvent, videoId: string) => void,
    switchingState?: VideoSwitchingState,
  ): React.ReactNode {
    const { itemsPerRow, rows } = layoutConfig;
    const rowElements: React.ReactElement[] = [];
    let videoIndex = 0;

    itemsPerRow.forEach((rowItems, rowIndex) => {
      const rowVideos = videos.slice(videoIndex, videoIndex + rowItems);

      rowElements.push(
        <div key={`row-${rowIndex}`} className={`${prefixCls}-row`}>
          {rowVideos.map((video, index) => {
            // 所有布局都使用计算出的固定尺寸，确保不溢出
            const wrapperStyle = {
              width: videoSize.width,
              height: videoSize.height,
              flexShrink: 0,
              flexGrow: 0,
            };

            // 传递窗口尺寸信息给renderVideoWindow
            const windowSize = {
              width: videoSize.actualWidth,
              height: videoSize.actualHeight,
            };

            return (
              <div key={video.id} className={`${prefixCls}-video-wrapper`} style={wrapperStyle}>
                {renderVideoWindow(video, videoIndex + index, windowSize)}
              </div>
            );
          })}
        </div>,
      );

      videoIndex += rowItems;
    });

    return <>{rowElements}</>;
  }
}

/**
 * 主要视频 + 缩略图布局策略
 */
export class MainVideoLayoutStrategy implements LayoutStrategy {
  calculateLayout(videoCount: number, containerSize: ContainerSize): LayoutConfig {
    if (videoCount === 0) {
      return { rows: 0, cols: 0, itemsPerRow: [], maxCols: 0, mode: LayoutMode.MAIN_VIDEO };
    }

    // 主视频布局：上方一个大视频，下方一排小视频
    return {
      rows: 2,
      cols: 1,
      maxCols: 1,
      itemsPerRow: [1, Math.max(0, videoCount - 1)],
      mode: LayoutMode.MAIN_VIDEO,
    };
  }

  calculateVideoSize(
    layoutConfig: LayoutConfig,
    containerSize: ContainerSize,
    options: LayoutOptions,
  ): VideoSize {
    const { aspectRatio, gap, headerHeight, controlsHeight } = options;

    if (containerSize.width === 0 || containerSize.height === 0) {
      return { width: '100%', height: '100%', actualWidth: 0, actualHeight: 0 };
    }
    // 简化计算：总的可用高度减去所有固定高度部分
    const totalFixedHeight = headerHeight + controlsHeight + 16 + 8; // header + controls + margins
    const containerPadding = 16;
    const thumbnailHeight = 72;
    const containerGap = 12;

    const availableHeight = containerSize.height - totalFixedHeight - 14; // 距离header 14
    const availableWidth = containerSize.width - containerPadding * 2;

    // 主视频可用高度 = 可用高度 - 缩略图高度 - 间距
    const mainVideoMaxHeight =
      availableHeight - thumbnailHeight - containerGap - containerPadding * 2;
    const mainVideoMaxWidth = availableWidth;

    // 基于宽度计算视频尺寸
    let videoWidth = mainVideoMaxWidth;
    let videoHeight = videoWidth / aspectRatio;
    // 如果高度超出限制，则基于高度计算
    if (videoHeight > mainVideoMaxHeight) {
      videoHeight = mainVideoMaxHeight;
      videoWidth = mainVideoMaxHeight * aspectRatio;
    }

    // 确保最小尺寸
    videoWidth = Math.max(100, videoWidth);
    videoHeight = Math.max(100 / aspectRatio, videoHeight);

    // 使用小的尺寸
    if (videoWidth > videoHeight) {
      videoWidth = videoHeight * aspectRatio;
    } else {
      videoHeight = videoWidth / aspectRatio;
    }
    return {
      width: `${videoWidth}px`,
      height: `${videoHeight}px`,
      actualWidth: videoWidth,
      actualHeight: videoHeight,
    };
  }

  renderLayout(
    videos: VideoWindowProps[],
    layoutConfig: LayoutConfig,
    videoSize: VideoSize,
    renderVideoWindow: (
      video: VideoWindowProps,
      index: number,
      windowSize?: { width: number; height: number },
    ) => React.ReactNode,
    prefixCls: string,
    gap: number,
    selectedVideoId?: string,
    onVideoClick?: (e: React.MouseEvent, videoId: string) => void,
    switchingState?: VideoSwitchingState,
    onExitMainVideoMode?: () => void,
  ): React.ReactNode {
    if (videos.length === 0) return null;

    // 找到选中的视频
    const selectedVideo = videos.find(v => v.id === selectedVideoId) || videos[0];
    const otherVideos = videos.filter(v => v.id !== selectedVideo.id);

    const thumbnailHeight = 72;
    // 固定缩略图宽度为72px，保持正方形
    const thumbnailWidth = 72;

    return (
      <MainVideoLayoutContent
        selectedVideo={selectedVideo}
        otherVideos={otherVideos}
        videoSize={videoSize}
        thumbnailWidth={thumbnailWidth}
        thumbnailHeight={thumbnailHeight}
        renderVideoWindow={renderVideoWindow}
        prefixCls={prefixCls}
        gap={gap}
        onVideoClick={onVideoClick}
        isMainVideoMode={true}
        onExitMainVideoMode={onExitMainVideoMode}
      />
    );
  }
}

/**
 * 主视频布局内容组件（一大多小布局）
 */
interface MainVideoLayoutContentProps {
  selectedVideo: VideoWindowProps;
  otherVideos: VideoWindowProps[];
  videoSize: VideoSize;
  thumbnailWidth: number;
  thumbnailHeight: number;
  renderVideoWindow: (
    video: VideoWindowProps,
    index: number,
    windowSize?: { width: number; height: number },
  ) => React.ReactNode;
  prefixCls: string;
  gap: number;
  onVideoClick?: (e: React.MouseEvent, videoId: string) => void;
  isMainVideoMode?: boolean;
  onExitMainVideoMode?: () => void;
}

const MainVideoLayoutContent: React.FC<MainVideoLayoutContentProps> = ({
  selectedVideo,
  otherVideos,
  videoSize,
  thumbnailWidth,
  thumbnailHeight,
  renderVideoWindow,
  prefixCls,
  gap,
  onVideoClick,
  isMainVideoMode = false,
  onExitMainVideoMode,
  // switchingState,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 移除切换状态相关代码

  // 检查滚动状态
  const checkScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    // 增加一些容差值(5px)来确保检测更灵敏
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, [otherVideos.length, thumbnailWidth]);

  // 滚动到指定位置
  const scrollTo = useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollAmount = thumbnailWidth + gap;
      const currentScrollLeft = container.scrollLeft;
      const targetScrollLeft =
        direction === 'left'
          ? currentScrollLeft - scrollAmount * 2
          : currentScrollLeft + scrollAmount * 2;

      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
    },
    [thumbnailWidth, gap],
  );

  // 监听滚动事件和尺寸变化
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      checkScrollState();
    };

    const handleResize = () => {
      // 延迟检查，确保布局完成
      setTimeout(checkScrollState, 100);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // 初始检查，延迟执行确保DOM渲染完成
    const timer = setTimeout(checkScrollState, 200);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [checkScrollState]);

  // 当视频列表变化时重新检查滚动状态
  useEffect(() => {
    // 延迟检查，确保DOM更新完成
    const timer = setTimeout(() => {
      checkScrollState();
    }, 300);

    return () => clearTimeout(timer);
  }, [otherVideos.length, checkScrollState]);

  // 渲染主视频区域
  const renderMainVideo = () => {
    return (
      <div
        className={`${prefixCls}-video-wrapper ${prefixCls}-main-video-wrapper ${prefixCls}-video-appearing`}
        style={{
          width: videoSize.width,
          height: videoSize.height,
          cursor: 'pointer',
          position: 'relative',
        }}
        key={selectedVideo.id} // 添加key确保在切换时重新触发动画
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          onVideoClick?.(e, selectedVideo.id);
        }}
      >
        {renderVideoWindow(selectedVideo, 0, {
          width: videoSize.actualWidth,
          height: videoSize.actualHeight,
        })}
      </div>
    );
  };

  logDebug('canScrollLeft', canScrollLeft);
  return (
    <>
      {/* 主视频区域 */}
      <div className={`${prefixCls}-main-video`}>{renderMainVideo()}</div>

      {/* 缩略图区域 */}
      {otherVideos.length > 0 && (
        <div className={`${prefixCls}-thumbnails`}>
          {/* 左滑动按钮 */}
          {canScrollLeft && (
            <button
              className={`${prefixCls}-scroll-button ${prefixCls}-scroll-button-left`}
              onClick={() => scrollTo('left')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M8 2L4 6L8 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* 右滑动按钮 */}
          {canScrollRight && (
            <button
              className={`${prefixCls}-scroll-button ${prefixCls}-scroll-button-right`}
              onClick={() => scrollTo('right')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M4 2L8 6L4 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* 缩略图滚动容器 */}
          <div
            className={`${prefixCls}-thumbnails-scroll`}
            ref={scrollContainerRef}
            style={{
              // 确保容器可以滚动
              width: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: `${gap}px`, // 每个窗口有2px border，所以gap要减去4px
                // 计算总宽度
                width: `${otherVideos.length * (thumbnailWidth + gap) - gap}px`,
                minWidth: 'max-content',
                height: '100%',
              }}
            >
              {otherVideos.map((video, index) => {
                return (
                  <div
                    key={video.id}
                    className={`${prefixCls}-video-wrapper ${prefixCls}-thumbnail-wrapper ${prefixCls}-video-appearing`}
                    style={{
                      width: `${thumbnailWidth}px`,
                      height: `${thumbnailHeight}px`,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onVideoClick?.(e, video.id);
                    }}
                  >
                    {renderVideoWindow(video, index + 1, {
                      width: thumbnailWidth,
                      height: thumbnailHeight,
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * 多人布局组件
 */
interface MultiPartyLayoutProps {
  videos: VideoWindowProps[];
  containerSize: ContainerSize;
  layoutOptions: LayoutOptions;
  renderVideoWindow: (
    video: VideoWindowProps,
    index: number,
    windowSize?: { width: number; height: number },
  ) => React.ReactNode;
  prefixCls: string;
  style?: React.CSSProperties;
  // 🔧 新增：布局切换回调
  onLayoutModeChange?: (layoutMode: 'grid' | 'main') => void;
}

export const MultiPartyLayout: React.FC<MultiPartyLayoutProps> = ({
  videos,
  containerSize,
  layoutOptions,
  renderVideoWindow,
  prefixCls,
  style,
  onLayoutModeChange,
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isMainVideoMode, setIsMainVideoMode] = useState(false);
  const [isVideoSwitching, setIsVideoSwitching] = useState(false);
  const [switchingFromVideoId, setSwitchingFromVideoId] = useState<string | null>(null);
  const [switchingToVideoId, setSwitchingToVideoId] = useState<string | null>(null);

  const handleVideoClick = useCallback(
    (e: React.MouseEvent, videoId: string) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isMainVideoMode) {
        // 首次进入主视频模式
        setSelectedVideoId(videoId);
        setIsMainVideoMode(true);
        // 🔧 新增：调用布局切换回调
        onLayoutModeChange?.('main');
      } else if (selectedVideoId !== videoId) {
        // 直接切换视频，不需要复杂动画
        setSelectedVideoId(videoId);
      }
    },
    [isMainVideoMode, selectedVideoId, onLayoutModeChange],
  );

  const handleExitMainVideoMode = useCallback(() => {
    setIsMainVideoMode(false);
    setSelectedVideoId(null);
    // 🔧 新增：调用布局切换回调
    onLayoutModeChange?.('grid');
  }, [onLayoutModeChange]);

  // 选择布局策略
  const strategy = isMainVideoMode ? new MainVideoLayoutStrategy() : new MultiPartyLayoutStrategy();
  const layoutConfig = strategy.calculateLayout(videos.length, containerSize);
  const videoSize = strategy.calculateVideoSize(layoutConfig, containerSize, layoutOptions);

  // 包装 renderVideoWindow 函数，添加点击事件和 hover 图标
  const wrappedRenderVideoWindow = useCallback(
    (video: VideoWindowProps, index: number, windowSize?: { width: number; height: number }) => {
      if (isMainVideoMode) {
        if (index === 0) {
          // 主视频窗口：点击回到网格，hover显示CHEVRON_4_CLUSTER
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={handleExitMainVideoMode}
              onMouseEnter={e => {
                const icon = (e.currentTarget as HTMLElement).querySelector('.hover-icon');
                if (icon) (icon as HTMLElement).style.opacity = '1';
              }}
              onMouseLeave={e => {
                const icon = (e.currentTarget as HTMLElement).querySelector('.hover-icon');
                if (icon) (icon as HTMLElement).style.opacity = '0';
              }}
            >
              {renderVideoWindow(video, index, windowSize)}
              {/* 主视频 hover 图标 - 调整位置以避免与NetworkQuality重叠 */}
              {/* <div
                className="hover-icon"
                style={{
                  position: 'absolute',
                  top: '9px',
                  right: '40px', // 调整位置：NetworkQuality(right:8px + width:16px + gap:8px) = 32px
                  zIndex: 10,
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  // background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon type="CHEVRON_4_CLUSTER" width={16} height={16} color="#ffffff" />
              </div> */}
            </div>
          );
        } else {
          // 缩略图：只保留点击功能，不显示hover图标
          return (
            <div
              style={{
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
              onClick={(e: React.MouseEvent) => handleVideoClick(e, video.id)}
            >
              {renderVideoWindow(video, index, windowSize)}
            </div>
          );
        }
      }

      // 网格模式：添加 hover 图标
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            position: 'relative',
          }}
          onClick={(e: React.MouseEvent) => handleVideoClick(e, video.id)}
          onMouseEnter={e => {
            const icon = (e.currentTarget as HTMLElement).querySelector('.hover-icon');
            if (icon) (icon as HTMLElement).style.opacity = '1';
          }}
          onMouseLeave={e => {
            const icon = (e.currentTarget as HTMLElement).querySelector('.hover-icon');
            if (icon) (icon as HTMLElement).style.opacity = '0';
          }}
        >
          {renderVideoWindow(video, index, windowSize)}
          {/* 网格模式 hover 图标 */}
          {/* <div
            className="hover-icon"
            style={{
              position: 'absolute',
              top: '8px',
              right: '32px', // 调整位置：NetworkQuality(right:8px + width:16px + gap:8px) = 32px
              zIndex: 10,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              // background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon type="CHEVRON_4_ALL_AROUND" width={16} height={16} color="#ffffff" />
          </div> */}
        </div>
      );
    },
    [renderVideoWindow, isMainVideoMode, handleVideoClick, handleExitMainVideoMode],
  );

  return (
    <div
      className={`${prefixCls}-multi-party ${prefixCls}-rows-${layoutConfig.rows} ${
        isMainVideoMode ? `${prefixCls}-main-video-mode` : ''
      }`}
      style={style}
    >
      {/* 渲染布局 */}
      {strategy.renderLayout(
        videos,
        layoutConfig,
        videoSize,
        wrappedRenderVideoWindow,
        prefixCls,
        layoutOptions.gap,
        selectedVideoId || undefined,
        (e: React.MouseEvent, videoId: string) => handleVideoClick(e, videoId),
        {
          isVideoSwitching,
          switchingFromVideoId,
          switchingToVideoId,
        },
        isMainVideoMode ? handleExitMainVideoMode : undefined,
      )}
    </div>
  );
};
