import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
// import client from './agoraChatConfig';
import MessageStore, { RecallMessage, Message, SelectedMessage, Typing } from './MessageStore';
import ConversationStore, {
  AT_TYPE,
  Conversation,
  CurrentConversation,
  ById,
} from './ConversationStore';
import AddressStore, { MemberRole, MemberItem, GroupItem, AppUserInfo } from './AddressStore';
import ThreadStore, { ThreadData, CurrentThread } from './ThreadStore';
import { AgoraChat } from 'agora-chat';
interface InitConfig {
  appKey: string;
}
class RootStore {
  messageStore;
  conversationStore;
  addressStore;
  threadStore;
  client: AgoraChat.Connection;
  loginState = false;
  initConfig = { appKey: '' };
  constructor() {
    this.client = {} as AgoraChat.Connection;
    this.messageStore = new MessageStore(this);
    this.conversationStore = new ConversationStore(this);
    this.addressStore = new AddressStore();
    this.threadStore = new ThreadStore(this);

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

  setClient(client: AgoraChat.Connection) {
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
  RecallMessage,
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
