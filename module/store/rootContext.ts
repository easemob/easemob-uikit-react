import React, { useEffect } from 'react';
import { AgoraChat } from 'agora-chat';
import rootStore, { RootStore } from './index';
// import client from './agoraChatConfig';

export interface RootConsumerProps {
  rootStore: RootStore;
  client: AgoraChat.Connection;
}

export interface ContextProps {
  rootStore: RootStore;
  initConfig: any;
  client: any;
}

export const RootContext = React.createContext<ContextProps>({
  rootStore,
  initConfig: {},
  client: {},
});

export const RootConsumer = RootContext.Consumer;

export const RootProvider = RootContext.Provider;
