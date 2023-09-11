import React, { useEffect, ReactNode, memo, useMemo } from 'react';
import { RootProvider } from './rootContext';
import rootStore from './index';

import AC, { AgoraChat } from 'agora-chat';
import { useEventHandler } from '../hooks/chat';

import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { resource } from '../../local/resource';

export interface ProviderProps {
  initConfig: {
    appKey: string;
    userId?: string;
    password?: string;
  };
  local?: {
    fallbackLng?: string;
    lng: 'zh' | 'en';
    resources?: {
      [key: string]: {
        translation: {
          [key: string]: string;
        };
      };
    };
  };
  onError?: (err: AgoraChat.ErrorEvent) => void;
  children?: ReactNode;
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
const Provider: React.FC<ProviderProps> = props => {
  const { initConfig, local, onError, features } = props;
  const { appKey } = initConfig;
  const client = useMemo(() => {
    return new AC.connection({
      appKey: appKey,
      delivery: true,
    });
  }, [appKey]);

  rootStore.setClient(client);
  rootStore.setInitConfig(initConfig);
  // console.log('Provider is run...');
  useEventHandler();
  let localConfig: any = {
    fallbackLng: 'en',
    lng: 'en',
    resources: resource,
  };
  if (local) {
    localConfig = {
      lng: local.lng,
      fallbackLng: local.fallbackLng || 'en',
      resources: local.resources || resource,
    };
  }
  i18n.use(initReactI18next).init(localConfig);
  // i18n.changeLanguage('zh');
  return (
    <RootProvider
      value={{
        rootStore,
        initConfig,
        features,
        client,
        onError,
      }}
    >
      {props.children}
    </RootProvider>
  );
};

export default memo(Provider);
