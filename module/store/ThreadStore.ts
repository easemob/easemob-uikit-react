import { observable, action, makeObservable, runInAction } from 'mobx';
import type { ChatSDK } from '../SDK';
import { eventHandler } from '../../eventHandler';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import {
  getCurrentUserId,
  getMessageId,
  getThreadLastMessage,
  getThreadMessageId,
  getThreadParentId,
  getThreadSummaryId,
} from '../utils';
type ThreadChangeInfo = Partial<ChatSDK.ChatThreadSummary> & {
  id?: string;
  chatThreadId?: string;
  operator?: string;
  operation?: 'create' | 'update' | 'destroy' | 'userRemove';
  members?: string[];
  owner?: string;
};

export interface ThreadData {
  [key: string]: {
    [key: string]: {
      info?: ThreadChangeInfo;
      originalMessage: BaseMessageType;
    };
  };
}

export interface CurrentThread {
  visible: boolean;
  creating: boolean;
  info?: ThreadChangeInfo;
  originalMessage: BaseMessageType;
}

class ThreadStore {
  rootStore;
  thread: ThreadData;
  currentThread: CurrentThread;
  showThreadPanel: boolean;
  threadList: { [key: string]: (ChatSDK.ChatThreadDetail & { members?: string[] })[] };
  constructor(rootStore: any) {
    this.rootStore = rootStore;
    this.thread = {};
    this.currentThread = {} as CurrentThread;
    this.showThreadPanel = false;
    this.threadList = {};

    makeObservable(this, {
      thread: observable,
      currentThread: observable,
      showThreadPanel: observable,
      threadList: observable,
      setThread: action,

      setCurrentThread: action,
      setThreadVisible: action,
      updateThreadInfo: action,
      updateMultiDeviceEvent: action,
      getChatThreadDetail: action,
      getGroupChatThreads: action,
      clear: action,
    });
  }

  setThread(thread: ThreadData) {
    this.thread = { ...this.thread, ...thread };
  }

  setCurrentThread(thread: CurrentThread) {
    if (!thread) {
      throw new Error('no thread');
    }
    this.currentThread = thread;
  }

  setThreadVisible(visible: boolean) {
    if (typeof visible !== 'boolean') {
      throw new Error('visible must be boolean');
    }
    this.showThreadPanel = visible;
  }

  updateThreadInfo(threadInfo: ThreadChangeInfo) {
    let chatThreadOverview: ThreadChangeInfo | undefined;

    const { operation, messageId, operator } = threadInfo;
    const parentId = getThreadParentId(threadInfo);
    const id = getThreadSummaryId(threadInfo);
    const currentThreadInfo = this.currentThread.info;
    const originalMessage = this.currentThread.originalMessage;
    const orgMsgId = getMessageId(originalMessage);

    let foundThread: ThreadChangeInfo = {};

    if (operation != 'create') {
      this.threadList[parentId]?.forEach(
        (item: ChatSDK.ChatThreadDetail & { members?: string[] }) => {
          if (getThreadSummaryId(item) === id) {
            foundThread = item as any;
          }
        },
      );
    }

    switch (operation) {
      case 'create':
        chatThreadOverview = threadInfo;
        // others create the chatThread of this message when I am creating the chatThread
        if (
          (messageId === currentThreadInfo?.messageId || orgMsgId === messageId) &&
          getCurrentUserId(this.rootStore.client) !== operator
        ) {
          // message.warn(i18next.t('Someone else created a thread for this message'));
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {},
          });
        }
        break;
      case 'update':
        if (messageId === currentThreadInfo?.messageId || orgMsgId === messageId) {
          this.setCurrentThread({
            ...this.currentThread,
            // owner: threadInfo.operator,
            creating: false,
            info: { ...threadInfo, owner: threadInfo.operator },
          });
        }
        chatThreadOverview = {
          ...threadInfo,
          lastMessage:
            getThreadLastMessage(threadInfo) ||
            getThreadLastMessage((this.currentThread.originalMessage as any)?.chatThreadOverview),
        } as ThreadChangeInfo;
        if (!foundThread) return;

        // if (threadInfo.lastMessage) {
        //   newThread.lastMessage = threadInfo.lastMessage;
        // } else {
        //   newThread.lastMessage = foundThread.lastMessage;
        // }

        this.threadList[parentId]?.splice(
          this.threadList[parentId]?.indexOf(foundThread as unknown as ChatSDK.ChatThreadDetail),
          1,
          {
            ...foundThread,
            ...threadInfo,
            name: threadInfo.name,
          } as unknown as ChatSDK.ChatThreadDetail,
        );
        break;

      case 'destroy':
      case 'userRemove':
        chatThreadOverview = undefined;
        if (id === getThreadSummaryId(currentThreadInfo)) {
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {},
          });

          // const warnText = operation === 'userRemove' ? t('You have been removed from the thread') : t('The thread has been disbanded')
          this.setThreadVisible(false);

          this.threadList[parentId]?.splice(
            this.threadList[parentId]?.indexOf(foundThread as unknown as ChatSDK.ChatThreadDetail),
            1,
          );
        }

        break;
      default:
        break;
    }

    // add chatThreadOverview into original message, or update chatThreadOverview

    const message = this.rootStore.messageStore.message['groupChat'][parentId as string] || [];

    message.forEach((item: any) => {
      if (getMessageId(item) === messageId) {
        item.chatThreadOverview = chatThreadOverview;
      }
    });
  }

  //thread member received changed
  updateMultiDeviceEvent(msg: any) {
    const currentThreadInfo = this.currentThread.info;
    if (
      msg.operation === 'chatThreadLeave' &&
      getThreadSummaryId(currentThreadInfo) === msg.chatThreadId
    ) {
      this.setCurrentThread({
        ...this.currentThread,
        visible: false,
      });

      this.setThreadVisible(false);
    }
  }

  getChatThreadDetail(threadId: string): Promise<void> {
    if (!threadId) {
      throw new Error('no threadId');
    }
    // if (currentThreadInfo) {
    return this.rootStore.client.chatThreadManager
      .getChatThreadInfo({ chatThreadId: threadId })
      .then((res: ChatSDK.ChatThreadDetail) => {
        // 找到原消息
        const message = this.rootStore.messageStore.message['groupChat'][res.parentId] || [];
        const originalMessage = message.find(
          (item: any) => getMessageId(item) === getThreadMessageId(res),
        );
        this.setCurrentThread({
          ...this.currentThread,
          originalMessage: originalMessage || {},
          info: {
            // ...currentThreadInfo,
            // // @ts-ignore
            // owner: res.data.owner,
            ...res,
          },
        });
      });
    // }
  }

  getThreadMembers(
    parentId: string,
    threadId: string,
    cursor?: string,
  ): Promise<string[] & { cursor?: string }> {
    if (!parentId || !threadId) {
      throw new Error('no parentId or threadId');
    }
    return this.rootStore.client.chatThreadManager
      .getChatThreadMemberList({
        chatThreadId: threadId,
        pageSize: 50,
        cursor,
      })
      .then((res: ChatSDK.ChatThreadMemberListResult) => {
        const members = res.items.map(item => item.memberId) as string[] & { cursor?: string };
        members.cursor = res.cursor;
        runInAction(() => {
          if (!this.threadList[parentId]) {
            this.threadList[parentId] = [
              {
                chatThreadId: threadId,
                parentId: parentId,
                members,
                name: '',
                ownerId: '',
                createdAt: 0,
                messageId: '',
              },
            ];
          }
          this.threadList[parentId]?.forEach(item => {
            if (getThreadSummaryId(item) === threadId) {
              item.members = members;
            }
          });

          if (this.currentThread.info && getThreadSummaryId(this.currentThread.info) === threadId) {
            this.currentThread.info.members = members;
          }
        });
        return members;
      });
  }

  removeChatThreadMember(parentId: string, threadId: string, userId: string) {
    if (!parentId || !threadId || !userId) {
      throw new Error('no parentId or threadId or userId');
    }
    return this.rootStore.client.chatThreadManager
      .removeChatThreadMember({
        chatThreadId: threadId,
        memberId: userId,
      })
      .then(() => {
        this.getThreadMembers(parentId, threadId);
      });
  }

  joinChatThread(chatThreadId: string) {
    if (!chatThreadId) {
      throw new Error('no chatThreadId');
    }
    return this.rootStore.client.chatThreadManager
      .joinChatThread({ chatThreadId })
      .then(() => {
        // this.getThreadMembers('', chatThreadId);
        eventHandler.dispatchSuccess('joinChatThread');
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('joinChatThread', error);
      });
  }

  getGroupChatThreads(parentId: string, cursor?: string): Promise<string | null> {
    if (!parentId) {
      throw new Error('no parentId');
    }
    // if (this.threadList[parentId]?.length > 0 && !cursor) return console.error('no cursor', cursor);

    return this.rootStore.client.chatThreadManager
      .getChatThreadList({
        parentId,
        pageSize: 20,
        cursor,
      })
      .then((res: ChatSDK.ChatThreadListResult) => {
        const threads = [...(res.items || [])];
        let list = this.threadList[parentId] || [];
        if (!cursor) {
          list = [];
        }
        const chatThreadIds = threads
          .map((item: ChatSDK.ChatThreadSummary) => getThreadSummaryId(item))
          .filter((threadId): threadId is string => Boolean(threadId));
        eventHandler.dispatchSuccess('getChatThreads');
        if (chatThreadIds.length === 0) {
          runInAction(() => {
            this.threadList[parentId] = [...list, ...threads];
          });
          return null;
        }
        return this.rootStore.client.chatThreadManager
          .getChatThreadLastMessageList({
            chatThreadIds: chatThreadIds,
          })
          .then((data: ChatSDK.ChatThreadLastMessageListResult) => {
            data.items?.forEach(item => {
              const idx = threads?.findIndex(
                thread => item.chatThreadId === getThreadSummaryId(thread),
              );
              if (idx > -1) {
                threads[idx] = {
                  ...threads[idx],
                  lastMessage: item.lastMessage,
                };
              }
            });

            runInAction(() => {
              this.threadList[parentId] = [...list, ...threads];
            });

            if (threads.length < 20) {
              return null;
            }
            eventHandler.dispatchSuccess('getChatThreadLastMessage');
            return res.cursor || null;
          })
          .catch((error: unknown) => {
            eventHandler.dispatchError('getChatThreadLastMessage', error);
          });
      })
      .catch((error: unknown) => {
        eventHandler.dispatchError('getChatThreads', error);
      });
  }
  clear() {
    this.thread = {};
    this.currentThread = {} as CurrentThread;
    this.showThreadPanel = false;
    this.threadList = {};
  }
}

export default ThreadStore;
