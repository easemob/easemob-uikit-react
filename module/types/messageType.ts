import { AgoraChat } from 'agora-chat';

export type ChatType = 'singleChat' | 'groupChat';

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
  id: string;
  to: string;
  from: string;
  chatType: ChatType;
  time: number;
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
  bySelf: boolean;
}

export interface FileMessageType extends BaseMessage {
  type: 'file';
  file: FileObj;
  filename: string;
  file_length: number;
  url: string;
  body?: {
    url: string;
    type: string;
    filename: string;
  };
}

export interface TextMessageType extends BaseMessage {
  type: 'txt';
  msg: string;
  modifiedInfo: AgoraChat.ModifiedMsgInfo
}

export interface CustomMessageType extends BaseMessage {
  type: 'custom';
  customEvent: string;
  customExts: { [key: string]: any };
}

export interface ImageMessageType extends BaseMessage {
  type: 'img';
  file: FileObj;
  width?: number;
  height?: number;
  file_length?: number;
  fileInputId?: string;
  thumb?: string;
  thumb_secret?: string;
  secret?: string;
  url: string;
  body?: {
    url: string;
    type: string;
    filename: string;
  };
}

export interface AudioMessageType extends BaseMessage {
  type: 'audio';
  filename: string;
  length: number;
  file_length: number;
  url?: string;
  secret?: string;
  filetype?: string;
  body?: {
    url: string;
    type: string;
    filename: string;
  };
  file: {
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
  file: object;
  filename: string;
  length: number;
  file_length: number;
  url?: string;
  secret?: string;
  filetype?: string;
  body?: {
    url: string;
    type: string;
    filename: string;
  };
}
