import type { ChatSDK } from '../SDK';
export type ChatType = ChatSDK.ChatConversationType;
type TextBody = {
  content: string;
  targetLanguages?: string[];
  translations?: Record<string, string>;
};
type ImageBody = {
  localUrl?: string;
  filename?: string;
  filetype?: string;
  width?: number;
  height?: number;
  isGif?: boolean;
  isOriginalImage?: boolean;
  originalImageUrl?: string;
  bigImageUrl?: string;
  secret?: string;
  fileLength?: number;
  thumbnailUrl?: string;
};
type FileBody = {
  url?: string;
  filename?: string;
  filetype?: string;
  fileSize?: number;
  fileLength?: number;
  secret?: string;
};
type VoiceBody = FileBody & { duration: number };
type VideoBody = VoiceBody & {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
};
type CustomBody = { event: string; params?: Record<string, string> };
type LocalMessageType =
  | 'text'
  | 'image'
  | 'file'
  | 'voice'
  | 'video'
  | 'location'
  | 'cmd'
  | 'custom'
  | 'combine';

export type MessageStatus =
  | 'received'
  | 'read'
  | 'unread'
  | 'sent'
  | 'failed'
  | 'sending'
  | 'default';

export interface FileObj {
  url: string;
  filename: string;
  filetype: string;
  data: File;
}

type MessagePriority = 'high' | 'normal' | 'low';

interface Reaction {
  /** 消息 Reaction，最大长度 128 字符。 */
  reaction: string;
  /** 该 Reaction 的数量。 */
  count: number;
  /** 更新 Reaction 的操作。Reaction 更新后会触发 onReactionChange 回调。*/
  op?: { operator: string; reactionType: 'create' | 'delete' }[];
  /** 添加 Reaction 的用户 ID。 */
  userList: string[];
  /** 当前用户是否添加过此 reaction。
   * - `true`：是；
   * - `false`：否。
   */
  isAddedBySelf?: boolean;
}

interface LastMessage {
  /** 消息 ID */
  id: string;
  /** 发送方的用户 ID */
  from: string;
  /** 接收方的用户 ID */
  to: string;
  /** 消息发送的 Unix 时间戳，单位为毫秒。 */
  timestamp: number;
  /** 消息内容。 */
  payload: any;
}

interface ChatThreadOverview {
  /** 子区 ID。 */
  id: string;
  /** 子区所属群组的 ID。 */
  parentId: string;
  /** 子区名称。 */
  name: string;
  /** 子区的最新一条消息。 */
  lastMessage: LastMessage;
  /** 子区创建的 Unix 时间戳，单位为毫秒。 */
  createTimestamp: number;
  /** 子区概览信息更新的 Unix 时间戳，单位为毫秒。 */
  updateTimestamp: number;
  /** 子区的回复消息数量。 */
  messageCount: number;
}

enum ONLINESTATETYPE {
  /** 离线消息。 */
  OFFLINE = 0,
  /** 在线消息。 */
  ONLINE = 1,
  /** 未知状态。 */
  UNKNOWN = 2,
  /** 未启用消息在线状态。 */
  NONE = 3,
}

interface BaseMessage {
  msgLocalId: string;
  msgServerId: string;
  to: string;
  from: string;
  sender: ChatSDK.Sender;
  conversationId: string;
  conversationType: ChatType;
  timestamp: number;
  type: LocalMessageType;
  body: ChatSDK.MessageBody;
  ext?: { [key: string]: any };
  msgConfig?: {
    allowGroupAck: boolean;
    languages?: string[];
  };
  isChatThread?: boolean;
  priority?: MessagePriority;
  reactions?: Reaction[];
  chatThreadOverview?: ChatThreadOverview;
  onlineState?: ONLINESTATETYPE;
  status: MessageStatus;
  bySelf?: boolean;
  chatThread?: {
    parentId?: string;
  };
}

export interface FileMessageType extends BaseMessage {
  type: 'file';
  body: FileBody;
  file?: FileObj;
}

export interface TextMessageType extends BaseMessage {
  type: 'text';
  body: TextBody;
  modifiedInfo?: {
    operationTime?: number;
    operatorId?: string;
    operationCount?: number;
  };
}

export interface CustomMessageType extends BaseMessage {
  type: 'custom';
  body: CustomBody;
}

export interface ImageMessageType extends BaseMessage {
  type: 'image';
  body: ImageBody;
  file?: FileObj;
  width?: number;
  height?: number;
  fileInputId?: string;
}

export interface AudioMessageType extends BaseMessage {
  type: 'voice';
  body: VoiceBody;
  file?: {
    url: string;
    filename: string;
    filetype: 'audio';
    data: File;
    length: number;
    duration: number;
  };
}

export interface VideoMessageType extends BaseMessage {
  type: 'video';
  body: VideoBody;
  file?: object;
}
