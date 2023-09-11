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
  features?: {
    chat?: {
      header?: {
        threadList: boolean;
        moreAction?: boolean;
        clearMessage?: boolean;
        deleteConversation?: boolean;
        audioCall?: boolean;
        videoCall?: boolean;
      };
      message?: {
        status?: boolean;
        thread?: boolean;
        reaction?: boolean;
        moreAction?: boolean;
        reply?: boolean;
        delete?: boolean;
        recall?: boolean;
        translate?: boolean;
        edit?: boolean;
        select?: boolean;
      };
      messageEditor?: {
        mention?: boolean;
        typing?: boolean;
        record?: boolean;
        emoji?: boolean;
        moreAction?: boolean;
        file?: boolean;
        picture?: boolean;
      };
    };
    conversationList?: {
      search?: boolean;
      item?: {
        moreAction?: boolean;
        deleteConversation?: boolean;
      };
    };
  };
}

export const RootContext = React.createContext<ContextProps>({
  rootStore,
  initConfig: {},
  client: {},
  onError: (err: AgoraChat.ErrorEvent) => {},
});

export const RootConsumer = RootContext.Consumer;

export const RootProvider = RootContext.Provider;
