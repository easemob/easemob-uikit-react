import React, { useEffect, ReactNode, memo, useMemo } from 'react';
import { RootProvider } from './rootContext';
import rootStore from './index';

import AC, { AgoraChat } from 'agora-chat';
import { useEventHandler } from '../hooks/chat';

import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { resource } from '../../local/resource';
import { hexToHsla, generateColors } from '../utils/color';
export interface ProviderProps {
  initConfig: {
    appKey: string;
    userId?: string;
    token?: string;
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
  reactionConfig?: {
    map: {
      [key: string]: HTMLImageElement;
    };
  };
  theme?: {
    primaryColor?: string;
    mode?: 'light' | 'dark';
  };
}
const Provider: React.FC<ProviderProps> = props => {
  const { initConfig, local, onError, features, reactionConfig, theme } = props;
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

  useEffect(() => {
    if (initConfig.userId && initConfig.token) {
      client
        .open({
          user: initConfig.userId,
          agoraToken: initConfig.token,
        })
        .then(() => {
          // console.log('login success');
        })
        .catch(err => {
          // console.error('login fail', err);
          onError && onError?.(err);
        });
    }
  }, [initConfig.userId, initConfig.token]);

  if (theme?.primaryColor) {
    // rootStore.setTheme(theme);
    const color = hexToHsla(theme.primaryColor);
    if (color) {
      generateColors(color);
    } else {
      generateColors('hsla(203, 100%, 60%, 1)');
    }
  } else {
    generateColors('hsla(203, 100%, 60%, 1)');
  }

  return (
    <RootProvider
      value={{
        rootStore,
        initConfig,
        features,
        client,
        onError,
        reactionConfig,
        theme,
      }}
    >
      {props.children}
    </RootProvider>
  );
};

export default memo(Provider);
