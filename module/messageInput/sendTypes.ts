import type { ChatSDK } from '../SDK';
import type { CurrentConversation } from '../store/ConversationStore';

export type SendMessageKind = 'text' | 'image' | 'file' | 'voice' | 'video' | 'custom' | 'combine';

export interface SendMessageRoute {
  conversationId: string;
  conversationType: ChatSDK.ChatConversationType;
  /** 定向消息接收者列表 */
  receiverList?: string[];
  /** 是否仅投递给在线用户 */
  deliverOnlineOnly?: boolean;
  /** 消息优先级 */
  priority?: 'high' | 'normal' | 'low';
}

export interface BeforeSendMessageContext<Body = unknown> {
  kind: SendMessageKind;
  route: SendMessageRoute;
  body: Body;
  ext?: Record<string, unknown>;
  isChatThread?: boolean;
}

export type BeforeSendMessage = (
  context: BeforeSendMessageContext,
) => Promise<CurrentConversation | SendMessageRoute | void>;

export function toSendMessageRoute(cvs: CurrentConversation): SendMessageRoute {
  return {
    conversationId: cvs.conversationId,
    conversationType: cvs.chatType as ChatSDK.ChatConversationType,
  };
}

export async function resolveBeforeSendRoute(
  onBeforeSendMessage: BeforeSendMessage | undefined,
  context: BeforeSendMessageContext,
): Promise<SendMessageRoute> {
  const result = await onBeforeSendMessage?.(context);
  if (result?.conversationId) {
    return {
      conversationId: result.conversationId,
      conversationType:
        'conversationType' in result
          ? result.conversationType
          : (result.chatType as ChatSDK.ChatConversationType),
    };
  }
  return context.route;
}
