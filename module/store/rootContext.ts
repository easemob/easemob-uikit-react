import React, { useEffect } from 'react';
import { ChatSDK } from 'module/SDK';
import rootStore, { RootStore } from './index';
// import client from './agoraChatConfig';

export interface RootConsumerProps {
  rootStore: RootStore;
  client: ChatSDK.Connection;
}

export interface ContextProps {
  rootStore: RootStore;
  initConfig: { appKey: string; token?: string; userId?: string };
  client: ChatSDK.Connection;
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
    chatroom?: {
      message?: {
        moreAction?: boolean;
        delete?: boolean;
        translate?: boolean;
        report?: boolean;
      };
      messageEditor?: {
        emoji?: boolean;
        gift?: boolean;
      };
    };
    chatroomMember?: {
      mute?: boolean;
      remove?: boolean;
    };
  };
  reactionConfig?: {
    map: {
      [key: string]: HTMLImageElement;
    };
  };
  theme?: {
    primaryColor?: string;
    mode?: 'dark' | 'light';
    avatarShape?: 'circle' | 'square';
    bubbleShape?: 'ground' | 'square';
  };
}

export const RootContext = React.createContext<ContextProps>({
  rootStore: {} as RootStore,
  initConfig: {} as { appKey: string },
  client: {} as ChatSDK.Connection,
  reactionConfig: { map: {} },
  theme: {},
});

export const RootConsumer = RootContext.Consumer;

export const RootProvider = RootContext.Provider;
