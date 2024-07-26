import React, { useEffect, ReactNode, memo, useMemo } from 'react';
import { RootProvider } from './rootContext';
import rootStore from './index';

import { chatSDK } from '../SDK';
import { useEventHandler } from '../hooks/chat';

import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { resource } from '../../local/resource';
import { hexToHsla, generateColors, isHueValue, isHexColor } from '../utils/color';
import { eventHandler } from '../../eventHandler';

import Online from '../assets/presence/Online2.png';
import Offline from '../assets/presence/Offline2.png';
import Away from '../assets/presence/leave2.png';
import Busy from '../assets/presence/Busy2.png';
import DoNotDisturb from '../assets/presence/Do_not_Disturb2.png';
import Custom from '../assets/presence/custom2.png';

export interface ProviderProps {
  initConfig: {
    appKey: string;
    userId?: string;
    token?: string;
    password?: string;
    translationTargetLanguage?: string;
    useUserInfo?: boolean;
    msyncUrl?: string;
    restUrl?: string;
    isHttpDNS?: boolean;
    useReplacedMessageContents?: boolean;
    deviceId?: string;
    maxMessages?: number; // 单个会话显示最大消息数，超出后会自动清除，默认200，清除的消息可通过拉取更多消息获取
  };
  local?: {
    fallbackLng?: string;
    lng?: string;
    resources?: {
      [key: string]: {
        translation: {
          [key: string]: string;
        };
      };
    };
  };
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
        pinMessage?: boolean;
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
        forward?: boolean;
        report?: boolean;
        pin?: boolean;
      };
      messageInput?: {
        mention?: boolean;
        typing?: boolean;
        record?: boolean;
        emoji?: boolean;
        moreAction?: boolean;
        file?: boolean;
        picture?: boolean;
        video?: boolean;
        contactCard?: boolean;
      };
    };
    conversationList?: {
      search?: boolean;
      item?: {
        moreAction?: boolean;
        deleteConversation?: boolean;
        pinConversation?: boolean;
        muteConversation?: boolean;
        presence?: boolean;
      };
    };
  };
  reactionConfig?: {
    map: {
      [key: string]: HTMLImageElement;
    };
  };
  theme?: {
    primaryColor?: string | number;
    mode?: 'light' | 'dark';
    avatarShape?: 'circle' | 'square';
    bubbleShape?: 'ground' | 'square';
    componentsShape?: 'ground' | 'square';
  };
  presenceMap?: {
    [key: string]: string | HTMLImageElement;
  };
}
const Provider: React.FC<ProviderProps> = props => {
  const { initConfig, local, features, reactionConfig, theme, presenceMap } = props;
  const {
    appKey,
    msyncUrl,
    restUrl,
    isHttpDNS = true,
    useReplacedMessageContents,
    deviceId,
  } = initConfig;
  const client = useMemo(() => {
    return new chatSDK.connection({
      appKey: appKey,
      delivery: true,
      url: msyncUrl,
      apiUrl: restUrl,
      isHttpDNS,
      deviceId,
      useReplacedMessageContents,
    });
  }, [appKey]);

  rootStore.setClient(client);
  rootStore.setInitConfig(initConfig);
  // console.log('Provider is run...');
  useEventHandler(props);
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
          user: initConfig.userId.toLowerCase(),
          agoraToken: initConfig.token,
        })
        .then(() => {
          eventHandler.dispatchSuccess('open');
        })
        .catch(err => {
          eventHandler.dispatchError('open', err);
        });
    } else if (initConfig.userId && initConfig.password) {
      client
        .open({
          user: initConfig.userId,
          pwd: initConfig.password,
        })
        .then(() => {
          eventHandler.dispatchSuccess('open');
        })
        .catch(err => {
          eventHandler.dispatchError('open', err);
        });
    }
  }, [initConfig.userId, initConfig.token]);

  // rootStore.setTheme(theme);
  if (isHexColor(theme?.primaryColor as string)) {
    const color = hexToHsla(theme?.primaryColor as string);
    if (color) {
      generateColors(color);
    }
  } else if (isHueValue(theme?.primaryColor as number)) {
    generateColors(`hsla(${theme?.primaryColor}, 100%, 60%, 1)`);
  } else {
    generateColors('hsla(203, 100%, 60%, 1)');
  }

  const defaultPresenceMap = {
    Online,
    Offline,
    Away,
    Busy,
    'Do Not Disturb': DoNotDisturb,
    Custom,
  };

  return (
    <RootProvider
      value={{
        rootStore,
        initConfig,
        features,
        client,
        reactionConfig,
        theme,
        presenceMap: presenceMap || defaultPresenceMap,
      }}
    >
      {props.children}
    </RootProvider>
  );
};

export default memo(Provider);
