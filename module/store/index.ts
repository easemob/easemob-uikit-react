import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
// import client from './agoraChatConfig';
import MessageStore, { Message, SelectedMessage, Typing } from './MessageStore';
import ConversationStore, {
  AT_TYPE,
  Conversation,
  CurrentConversation,
  ById,
} from './ConversationStore';
import AddressStore, { MemberRole, MemberItem, GroupItem, AppUserInfo } from './AddressStore';
import ThreadStore, { ThreadData, CurrentThread } from './ThreadStore';
import PinnedMessagesStore from './PinnedMessagesStore';
import { ChatSDK } from 'module/SDK';
import { clearPageNum } from '../hooks/useConversation';
import { clearPageNum as chatroomClearPageNum } from '../hooks/useChatroomMember';
import { ProviderProps } from '../store/Provider';
interface InitConfig {
  appKey: string;
}
class RootStore {
  messageStore;
  conversationStore;
  addressStore;
  threadStore;
  pinnedMessagesStore;
  client: ChatSDK.Connection;
  loginState = false;
  initConfig: ProviderProps['initConfig'] = { appKey: '' };
  constructor() {
    this.client = {} as ChatSDK.Connection;
    this.messageStore = new MessageStore(this);
    this.conversationStore = new ConversationStore(this);
    this.addressStore = new AddressStore();
    this.threadStore = new ThreadStore(this);
    this.pinnedMessagesStore = new PinnedMessagesStore();
    makeObservable(this, {
      client: observable,
      loginState: observable,
      setLoginState: action,
      setClient: action,
      initConfig: observable,
      setInitConfig: action,
      clear: action,
    });
  }

  setClient(client: ChatSDK.Connection) {
    this.client = client;
  }

  setLoginState(state: boolean) {
    this.loginState = state;
  }

  setInitConfig(initConfig: InitConfig) {
    this.initConfig = initConfig;
  }
  clear() {
    this.messageStore.clear();
    this.addressStore.clear();
    this.conversationStore.clear();
    this.threadStore.clear();
    this.pinnedMessagesStore.clear();
    clearPageNum();
    chatroomClearPageNum();
  }
}
let store: RootStore;
export function getStore() {
  if (!store) {
    store = new RootStore();
  }
  return store;
}

const rootStore = getStore();

export type {
  RootStore,
  InitConfig,
  MessageStore,
  Message,
  SelectedMessage,
  Typing,
  ConversationStore,
  AT_TYPE,
  Conversation,
  CurrentConversation,
  ById,
  AddressStore,
  MemberRole,
  MemberItem,
  GroupItem,
  AppUserInfo,
  ThreadStore,
  ThreadData,
  CurrentThread,
};

export default rootStore;
