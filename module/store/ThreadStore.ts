import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
import { ChatSDK } from '../SDK';
import { eventHandler } from '../../eventHandler';
import { BaseMessageType } from '../baseMessage/BaseMessage';
export interface ThreadData {
  [key: string]: {
    [key: string]: {
      info?: ChatSDK.ThreadChangeInfo & { owner?: string };
      originalMessage: ChatSDK.MessageBody;
    };
  };
}

export interface CurrentThread {
  visible: boolean;
  creating: boolean;
  info?: ChatSDK.ThreadChangeInfo & { owner?: string; members?: string[] };
  originalMessage: ChatSDK.MessageBody;
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

  updateThreadInfo(threadInfo: ChatSDK.ThreadChangeInfo) {
    let chatThreadOverview: ChatSDK.ThreadChangeInfo | undefined;

    const { operation, messageId, parentId, id, operator } = threadInfo;
    const currentThreadInfo = this.currentThread.info;
    const originalMessage = this.currentThread.originalMessage;
    // @ts-ignore
    const orgMsgId = originalMessage?.mid || originalMessage?.id;

    let foundThread: ChatSDK.ThreadChangeInfo = {} as ChatSDK.ThreadChangeInfo;

    if (operation != 'create') {
      this.threadList[parentId]?.forEach(item => {
        if (item.id === id) {
          // @ts-ignore
          foundThread = item;
        }
      });
    }

    switch (operation) {
      case 'create':
        chatThreadOverview = threadInfo;
        // others create the chatThread of this message when I am creating the chatThread
        if (
          (messageId === currentThreadInfo?.messageId || orgMsgId === messageId) &&
          this.rootStore.client.context.userId !== operator
        ) {
          // message.warn(i18next.t('Someone else created a thread for this message'));
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {} as ChatSDK.MessageBody,
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
        chatThreadOverview = threadInfo;

        if (!foundThread) return;
        let newThread = {
          ...foundThread,
          name: threadInfo.name,
        };
        threadInfo.lastMessage ? (newThread.lastMessage = threadInfo.lastMessage) : null;

        this.threadList[parentId]?.splice(
          this.threadList[parentId]?.indexOf(foundThread as unknown as ChatSDK.ChatThreadDetail),
          1,
          newThread as unknown as ChatSDK.ChatThreadDetail,
        );
        break;

      case 'destroy':
      case 'userRemove':
        chatThreadOverview = undefined;
        if (id === currentThreadInfo?.id) {
          this.setCurrentThread({
            visible: false,
            creating: false,
            info: undefined,
            originalMessage: {} as ChatSDK.MessageBody,
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

    const message = this.rootStore.messageStore.message['groupChat'][parentId as string];

    message.forEach((item: any) => {
      if (item.mid === messageId || item.id === messageId) {
        item.chatThreadOverview = chatThreadOverview;
      }
    });
  }

  //thread member received changed
  updateMultiDeviceEvent(msg: any) {
    const currentThreadInfo = this.currentThread.info;
    if (msg.operation === 'chatThreadLeave' && currentThreadInfo?.id === msg.chatThreadId) {
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
    const currentThreadInfo = this.currentThread.info;
    // if (currentThreadInfo) {
    return this.rootStore.client
      .getChatThreadDetail({ chatThreadId: threadId })
      .then((res: any) => {
        // 找到原消息
        const message = this.rootStore.messageStore.message['groupChat'][res.data.parentId];
        const originalMessage = message.find(
          (item: any) => item.mid === res.data.messageId || item.id === res.data.messageId,
        );
        this.setCurrentThread({
          ...this.currentThread,
          originalMessage: originalMessage,
          info: {
            // ...currentThreadInfo,
            // // @ts-ignore
            // owner: res.data.owner,
            ...res.data,
          },
        });
      });
    // }
  }

  getThreadMembers(parentId: string, threadId: string): Promise<string[]> {
    if (!parentId || !threadId) {
      throw new Error('no parentId or threadId');
    }
    return this.rootStore.client
      .getChatThreadMembers({
        chatThreadId: threadId,
        pageSize: 50,
      })
      .then((res: { data: { affiliations: string[] } }) => {
        const members = res.data.affiliations;

        if (!this.threadList[parentId]) {
          this.threadList[parentId] = [
            {
              id: threadId,
              parentId: parentId,
              members,
              name: '',
              owner: '',
              created: 0,
              messageId: '',
            },
          ];
        }
        this.threadList[parentId]?.forEach(item => {
          if (item.id === threadId) {
            item.members = members;
          }
        });

        if (this.currentThread.info?.id === threadId) {
          this.currentThread.info.members = members;
        }
        return members;
      });
  }

  removeChatThreadMember(parentId: string, threadId: string, userId: string) {
    if (!parentId || !threadId || !userId) {
      throw new Error('no parentId or threadId or userId');
    }
    return this.rootStore.client
      .removeChatThreadMember({
        chatThreadId: threadId,
        username: userId,
      })
      .then((res: any) => {
        this.getThreadMembers(parentId, threadId);
      });
  }

  joinChatThread(chatThreadId: string) {
    if (!chatThreadId) {
      throw new Error('no chatThreadId');
    }
    return this.rootStore.client
      .joinChatThread({ chatThreadId })
      .then((res: any) => {
        // this.getThreadMembers('', chatThreadId);
        eventHandler.dispatchSuccess('joinChatThread');
      })
      .catch((error: ChatSDK.ErrorEvent) => {
        eventHandler.dispatchError('joinChatThread', error);
      });
  }

  getGroupChatThreads(parentId: string, cursor?: string): Promise<string | null> {
    if (!parentId) {
      throw new Error('no parentId');
    }
    // if (this.threadList[parentId]?.length > 0 && !cursor) return console.error('no cursor', cursor);

    return this.rootStore.client
      .getChatThreads({
        parentId,
        pageSize: 20,
        cursor,
      })
      .then((res: ChatSDK.AsyncResult<ChatSDK.ChatThreadDetail[]>) => {
        const threads = res.entities || [];
        let list = this.threadList[parentId] || [];
        if (!cursor) {
          list = [];
        }
        const chatThreadIds = threads?.map((item: { id: any }) => {
          return item.id;
        });
        eventHandler.dispatchSuccess('getChatThreads');
        return this.rootStore.client
          .getChatThreadLastMessage({
            chatThreadIds: chatThreadIds,
          })
          .then((data: ChatSDK.AsyncResult<ChatSDK.ChatThreadLastMessage[]>) => {
            data.entities?.forEach(item => {
              let idx = threads?.findIndex(thread => item.chatThreadId === thread.id);
              (item.lastMessage as BaseMessageType).chatType = 'groupChat';
              // @ts-ignore
              threads[idx].lastMessage = item.lastMessage;
            });

            this.threadList[parentId] = [...list, ...threads];

            if (threads.length < 20) {
              return null;
            }
            eventHandler.dispatchSuccess('getChatThreadLastMessage');
            return res.properties.cursor;
          })
          .catch((error: ChatSDK.ErrorEvent) => {
            eventHandler.dispatchError('getChatThreadLastMessage', error);
          });
      })
      .catch((error: ChatSDK.ErrorEvent) => {
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
