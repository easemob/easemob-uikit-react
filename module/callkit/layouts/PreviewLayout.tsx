// import React from 'react';
// import type {
//   LayoutStrategy,
//   LayoutConfig,
//   VideoSize,
//   ContainerSize,
//   LayoutOptions,
//   VideoWindowProps,
// } from '../types/index';
// import { LayoutMode } from '../types/index';

// /**
//  * 预览布局策略（竖屏布局，用于接通前预览自己画面）
//  */
// export class PreviewLayoutStrategy implements LayoutStrategy {
//   calculateLayout(videoCount: number, containerSize: ContainerSize): LayoutConfig {
//     return {
//       rows: 1,
//       cols: 1,
//       itemsPerRow: [1],
//       maxCols: 1,
//       mode: LayoutMode.PREVIEW,
//     };
//   }

//   calculateVideoSize(
//     layoutConfig: LayoutConfig,
//     containerSize: ContainerSize,
//     options: LayoutOptions,
//   ): VideoSize {
//     const { headerHeight, controlsHeight } = options;
//     const availableHeight = containerSize.height - headerHeight - controlsHeight;
//     const availableWidth = containerSize.width;

//     // 预览模式使用更大的视频窗口，尽可能占满可用空间
//     const aspectRatio = 9 / 16; // 宽高比（竖屏）

//     // 留出足够空间给提示文字（约80px高度）
//     const hintHeight = 80;
//     const actualAvailableHeight = Math.max(availableHeight - hintHeight, availableHeight * 0.7);

//     // 基于容器尺寸计算最优视频尺寸
//     let videoWidth = availableWidth * 0.95; // 使用95%的宽度
//     let videoHeight = videoWidth / aspectRatio;

//     // 如果高度超出容器，则基于高度计算
//     if (videoHeight > actualAvailableHeight) {
//       videoHeight = actualAvailableHeight;
//       videoWidth = videoHeight * aspectRatio;
//     }

//     // 确保最小尺寸
//     const minWidth = 200;
//     const minHeight = minWidth / aspectRatio;

//     if (videoWidth < minWidth) {
//       videoWidth = minWidth;
//       videoHeight = minHeight;
//     }

//     return {
//       width: `${videoWidth}px`,
//       height: `${videoHeight}px`,
//       actualWidth: videoWidth,
//       actualHeight: videoHeight,
//     };
//   }

//   renderLayout(
//     videos: VideoWindowProps[],
//     layoutConfig: LayoutConfig,
//     videoSize: VideoSize,
//     renderVideoWindow: (
//       video: VideoWindowProps,
//       index: number,
//       windowSize?: { width: number; height: number },
//     ) => React.ReactNode,
//     prefixCls: string,
//     gap: number,
//   ): React.ReactNode {
//     if (videos.length === 0) return null;

//     const video = videos[0]; // 预览模式只显示第一个视频（通常是本地视频）

//     // 传递窗口尺寸信息
//     const windowSize = {
//       width: videoSize.actualWidth,
//       height: videoSize.actualHeight,
//     };

//     return (
//       <div className={`${prefixCls}-preview-container`}>
//         <div
//           className={`${prefixCls}-preview-video`}
//           style={{
//             width: videoSize.width,
//             height: videoSize.height,
//             maxWidth: '100%',
//             maxHeight: '100%',
//           }}
//         >
//           {renderVideoWindow(video, 0, windowSize)}
//         </div>

//         {/* 预览提示文字 */}
//         <div className={`${prefixCls}-preview-hint`}>
//           <p>准备好了吗？</p>
//           <p>检查一下您的摄像头和麦克风</p>
//         </div>
//       </div>
//     );
//   }
// }

// /**
//  * 预览布局组件
//  */
// interface PreviewLayoutProps {
//   videos: VideoWindowProps[];
//   containerSize: ContainerSize;
//   layoutOptions: LayoutOptions;
//   renderVideoWindow: (video: VideoWindowProps, index: number) => React.ReactNode;
//   prefixCls: string;
// }

// export const PreviewLayout: React.FC<PreviewLayoutProps> = ({
//   videos,
//   containerSize,
//   layoutOptions,
//   renderVideoWindow,
//   prefixCls,
// }) => {
//   const strategy = new PreviewLayoutStrategy();
//   const layoutConfig = strategy.calculateLayout(videos.length, containerSize);
//   const videoSize = strategy.calculateVideoSize(layoutConfig, containerSize, layoutOptions);

//   return (
//     <div className={`${prefixCls}-preview`}>
//       {strategy.renderLayout(
//         videos,
//         layoutConfig,
//         videoSize,
//         renderVideoWindow,
//         prefixCls,
//         layoutOptions.gap,
//       )}
//     </div>
//   );
// };
