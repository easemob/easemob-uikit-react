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
  onError?: (err: AgoraChat.ErrorEvent) => void;
}

export const RootContext = React.createContext<ContextProps>({
  rootStore,
  initConfig: {},
  client: {},
  onError: (err: AgoraChat.ErrorEvent) => {},
});

export const RootConsumer = RootContext.Consumer;

export const RootProvider = RootContext.Provider;
