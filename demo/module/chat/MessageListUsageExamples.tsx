/**
 * MessageList customRenderers 使用说明和示例
 * 
 * 这个文件展示了如何使用新的 customRenderers API 来自定义特定类型的消息渲染
 */

import React from 'react';
import { MessageList, MessageRenderContext, MessageType } from '../index';

// ===========================
// 使用场景 1: 只自定义文本消息样式
// ===========================
export function CustomTextMessageExample() {
  return (
    <MessageList
      customRenderers={{
        // 只需要定义文本消息的渲染，其他类型（图片、视频、音频等）会自动使用默认渲染
        txt: (ctx: MessageRenderContext) => {
          const message = ctx.message as any;
          return (
            <div 
              style={{ 
                ...ctx.style,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '12px',
                margin: '8px',
              }}
            >
              <p style={{ margin: 0 }}>{message.msg}</p>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                {new Date(message.time).toLocaleTimeString()}
              </span>
            </div>
          );
        },
      }}
    />
  );
}

// ===========================
// 使用场景 2: 自定义多种消息类型
// ===========================
export function MultipleCustomRenderersExample() {
  return (
    <MessageList
      customRenderers={{
        // 自定义文本消息
        txt: (ctx) => {
          const message = ctx.message as any;
          return (
            <div className="custom-text-bubble">
              <div className="message-content">{message.msg}</div>
              <div className="message-time">
                {new Date(message.time).toLocaleString()}
              </div>
            </div>
          );
        },
        
        // 自定义图片消息 - 添加水印
        img: (ctx) => {
          const message = ctx.message as any;
          return (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={message.url} 
                alt="message"
                style={{ 
                  maxWidth: '300px',
                  borderRadius: '8px',
                  ...ctx.style,
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                © 公司机密
              </div>
            </div>
          );
        },
        
        // 其他类型（audio, video, file, combine 等）会使用默认渲染
      }}
    />
  );
}

// ===========================
// 使用场景 3: 添加额外交互功能
// ===========================
export function WithExtraFeaturesExample() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          const message = ctx.message as any;
          
          const handleCopy = () => {
            navigator.clipboard.writeText(message.msg);
            setCopiedId(message.id);
            setTimeout(() => setCopiedId(null), 2000);
          };
          
          const handleTranslate = () => {
            // 调用翻译 API
            console.log('翻译消息:', message.msg);
          };
          
          return (
            <div 
              style={{ 
                position: 'relative',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                margin: '8px',
                ...ctx.style,
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>{message.msg}</p>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleCopy}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === message.id ? '✓ 已复制' : '复制'}
                </button>
                
                <button 
                  onClick={handleTranslate}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  翻译
                </button>
              </div>
            </div>
          );
        },
      }}
    />
  );
}

// ===========================
// 使用场景 4: 使用上下文中的方法和属性
// ===========================
export function UseContextExample() {
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          const message = ctx.message as any;
          
          return (
            <div
              onClick={() => {
                // 可以访问上下文中的所有方法
                console.log('消息被点击:', message);
                
                // 滚动到底部
                ctx.scrollToBottom?.();
                
                // 调用传入的回调
                ctx.messageProps?.onClick?.(message);
              }}
              style={{
                padding: '10px',
                cursor: 'pointer',
                borderRadius: '8px',
                background: '#f5f5f5',
                margin: '4px',
                ...ctx.style,
              }}
            >
              <p>{message.msg}</p>
            </div>
          );
        },
      }}
      messageProps={{
        onClick: (msg) => {
          console.log('Message clicked:', msg);
          return true;
        },
      }}
    />
  );
}

// ===========================
// 使用场景 5: 条件渲染
// ===========================
export function ConditionalRenderExample() {
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          const message = ctx.message as any;
          
          // 根据消息内容决定不同的渲染方式
          if (message.msg.startsWith('[系统]')) {
            // 系统消息样式
            return (
              <div 
                style={{
                  textAlign: 'center',
                  color: '#999',
                  padding: '8px',
                  fontSize: '14px',
                }}
              >
                {message.msg.replace('[系统]', '')}
              </div>
            );
          }
          
          if (message.msg.includes('http://') || message.msg.includes('https://')) {
            // 包含链接的消息
            return (
              <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '8px' }}>
                <p>{message.msg}</p>
                <a 
                  href={message.msg.match(/(https?:\/\/[^\s]+)/)?.[0]} 
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'underline' }}
                >
                  打开链接
                </a>
              </div>
            );
          }
          
          // 普通文本消息
          return (
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
              {message.msg}
            </div>
          );
        },
      }}
    />
  );
}

// ===========================
// 使用场景 6: 与其他库集成（例如 emoji 渲染）
// ===========================
export function WithEmojiExample() {
  // 简单的 emoji 替换函数（实际项目中可以用 emoji 库）
  const renderWithEmoji = (text: string) => {
    return text
      .replace(':)', '😊')
      .replace(':D', '😃')
      .replace(':(', '😢')
      .replace('<3', '❤️');
  };
  
  return (
    <MessageList
      customRenderers={{
        txt: (ctx) => {
          const message = ctx.message as any;
          const messageWithEmoji = renderWithEmoji(message.msg);
          
          return (
            <div 
              style={{
                padding: '12px',
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                margin: '4px',
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {messageWithEmoji}
              </span>
            </div>
          );
        },
      }}
    />
  );
}

// ===========================
// 对比：旧的方式 vs 新的方式
// ===========================

// ❌ 旧的方式：需要处理所有消息类型
export function OldWayExample() {
  return (
    <MessageList
      renderMessage={(message) => {
        // 即使只想自定义文本消息，也需要处理所有类型
        if (message.type === 'txt') {
          return <div>自定义文本消息</div>;
        }
        if (message.type === 'img') {
          // 需要重新实现图片消息的所有逻辑
          return <div>图片消息...</div>;
        }
        if (message.type === 'audio') {
          // 需要重新实现音频消息的所有逻辑
          return <div>音频消息...</div>;
        }
        // ... 需要处理所有类型
        return null;
      }}
    />
  );
}

// ✅ 新的方式：只需要自定义关心的类型
export function NewWayExample() {
  return (
    <MessageList
      customRenderers={{
        // 只自定义文本消息，其他类型自动使用默认渲染
        txt: (ctx) => <div>自定义文本消息</div>,
      }}
    />
  );
}

// ===========================
// 高级用法：动态渲染器
// ===========================
export function DynamicRenderersExample() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  
  const customRenderers = React.useMemo(() => ({
    txt: (ctx: MessageRenderContext) => {
      const message = ctx.message as any;
      const isDark = theme === 'dark';
      
      return (
        <div
          style={{
            padding: '12px',
            background: isDark ? '#2c2c2c' : '#f5f5f5',
            color: isDark ? '#fff' : '#000',
            borderRadius: '8px',
            margin: '4px',
          }}
        >
          {message.msg}
        </div>
      );
    },
  }), [theme]);
  
  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        切换主题
      </button>
      <MessageList customRenderers={customRenderers} />
    </div>
  );
}

