/**
 * MessageList 自定义渲染器使用示例
 * 
 * 新的 customRenderers API 允许你只自定义特定类型的消息渲染，
 * 其他类型会自动使用默认的渲染逻辑。
 */

import React from 'react';
import { MessageList, MessageRenderContext } from '../../../module/chat/MessageList';
import { TextMessage } from '../../../module/textMessage';

// 示例1: 只自定义文本消息的样式
export function Example1() {
  return (
    <MessageList
      customRenderers={{
        // 只需要自定义文本消息，其他类型（图片、视频等）会使用默认渲染
        txt: (ctx: MessageRenderContext) => {
          return (
            <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
              <TextMessage
                // @ts-ignore
                textMessage={ctx.message}
                renderUserProfile={ctx.renderUserProfile}
                thread={ctx.isThread}
                {...ctx.messageProps}
              />
            </div>
          );
        },
      }}
    />
  );
}

// 示例2: 自定义多种消息类型
export function Example2() {
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          // 自定义文本消息
          return (
            <div className="my-custom-text-message">
              <TextMessage
                // @ts-ignore
                textMessage={ctx.message}
                style={{ ...ctx.style, color: 'blue' }}
                {...ctx.messageProps}
              />
            </div>
          );
        },
        img: (ctx) => {
          // 自定义图片消息
          return (
            <div className="my-custom-image-message">
              <img 
                src={(ctx.message as any).url} 
                alt="message" 
                style={{ maxWidth: '200px', borderRadius: '10px' }}
              />
            </div>
          );
        },
        // 其他类型（audio, video, file等）会使用默认渲染
      }}
    />
  );
}

// 示例3: 完全自定义某个类型，添加额外功能
export function Example3() {
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          const message = ctx.message as any;
          
          return (
            <div style={{ position: 'relative' }}>
              <TextMessage
                // @ts-ignore
                textMessage={message}
                renderUserProfile={ctx.renderUserProfile}
                thread={ctx.isThread}
                {...ctx.messageProps}
              />
              {/* 添加自定义的操作按钮 */}
              <button
                onClick={() => console.log('复制消息:', message.msg)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: '12px',
                }}
              >
                复制
              </button>
            </div>
          );
        },
      }}
    />
  );
}

// 示例4: 旧的 renderMessage API 仍然兼容（但不推荐使用）
export function Example4Legacy() {
  return (
    <MessageList
      renderMessage={(message) => {
        // 旧方式：需要处理所有类型的消息
        if (message.type === 'txt') {
          return <div>自定义文本消息</div>;
        }
        // 需要为每种类型都写渲染逻辑...
        return <div>其他类型消息</div>;
      }}
    />
  );
}

