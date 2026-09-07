import React, { useEffect, ReactNode, memo, useMemo } from 'react';
import { RootProvider } from './rootContext';
import rootStore from './index';

import { ChatClient, UIKitManagers } from '../SDK';
import type { ChatSDK } from '../SDK';
import type { UIKitChatClient } from '../SDK';
import type { AppUserInfoProvider } from './AddressStore';
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

export type GroupInfo = {
  groupId: string;
  groupName?: string;
  groupAvatar?: string;
};

export type GroupInfoProviderResult = GroupInfo[] | Record<string, GroupInfo>;
export type GroupInfoProvider = (
  groupIds: string[],
) => Promise<GroupInfoProviderResult> | GroupInfoProviderResult;

export interface UIKitDataProviders {
  userInfo?: AppUserInfoProvider;
  groupInfo?: GroupInfoProvider;
}

export interface ProviderInitConfig {
  /** 应用身份。appKey 和 appId 必须且只能传一个。 */
  appKey?: string;
  /** 应用 ID。appKey 和 appId 必须且只能传一个。 */
  appId?: string;
  userId?: string;
  token?: string;
  password?: string;
  translationTargetLanguage?: string;
  useUserInfo?: boolean;
  /** 登录后自动同步的数据类型（对应 SDK enableSyncData），默认 ['contact', 'group', 'conversation'] */
  enableSyncData?: readonly ('contact' | 'group' | 'conversation')[];
  /** 是否启用用户资料同步增强（对应 SDK enableUserInfoSync），默认 false */
  enableUserInfoSync?: boolean;
  msyncUrl?: string;
  restUrl?: string;
  isHttpDNS?: boolean;
  useReplacedMessageContents?: boolean;
  deviceId?: string;
  maxMessages?: number;
  isFixedDeviceId?: boolean;
  useOwnUploadFun?: boolean;
  countMemberJoinToUnread?: boolean;
}

export interface ProviderProps {
  initConfig: ProviderInitConfig;
  /**
   * 用户信息提供器。业务方只需要根据 userId 批量返回用户信息，UIKit 会自动按需调用并缓存。
   * 返回值支持数组或以 userId 为 key 的对象；avatarurl 仍兼容，但推荐使用 avatarUrl。
   * @deprecated Prefer `providers.userInfo`.
   */
  userInfoProvider?: AppUserInfoProvider;
  providers?: UIKitDataProviders;
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
    bubbleShape?: 'round' | 'square';
    componentsShape?: 'round' | 'square';
    ripple?: boolean;
  };
  presenceMap?: {
    [key: string]: string | HTMLImageElement;
  };
}
const Provider: React.FC<ProviderProps> = props => {
  const {
    initConfig,
    userInfoProvider,
    providers,
    local,
    features,
    reactionConfig,
    theme,
    presenceMap,
  } = props;
  const normalizedProviders = useMemo<UIKitDataProviders>(
    () => ({
      userInfo: providers?.userInfo ?? userInfoProvider,
      groupInfo: providers?.groupInfo,
    }),
    [providers?.groupInfo, providers?.userInfo, userInfoProvider],
  );
  const {
    appKey,
    appId,
    msyncUrl,
    restUrl,
    useReplacedMessageContents,
    deviceId,
    isFixedDeviceId = true,
    useOwnUploadFun = false,
    enableSyncData = ['contact', 'group', 'conversation'],
    useUserInfo = true,
  } = initConfig;
  const normalizedInitConfig = useMemo(
    () => ({
      ...initConfig,
      useUserInfo,
      enableUserInfoSync: initConfig.enableUserInfoSync ?? useUserInfo,
    }),
    [initConfig, useUserInfo],
  );
  const { enableUserInfoSync } = normalizedInitConfig;

  const initOptions = useMemo<ChatSDK.InitConfig & { managers: typeof UIKitManagers }>(() => {
    if ((!appKey && !appId) || (appKey && appId)) {
      throw new Error('Provider initConfig must include exactly one of appKey or appId.');
    }

    if (appId && (restUrl || msyncUrl)) {
      throw new Error(
        'Provider initConfig.restUrl and msyncUrl cannot be used with appId initialization.',
      );
    }

    const serviceConfig: ChatSDK.ServiceConfig | undefined =
      restUrl || msyncUrl
        ? {
            serverUrls: {
              restApiUrl: restUrl,
              wsUrl: msyncUrl,
            },
          }
        : undefined;

    return {
      ...(appId ? { appId } : { appKey: appKey as string }),
      enableDeliveryReceipt: true,
      enableSyncData,
      enableUserInfoSync,
      serviceConfig,
      deviceId,
      useReplacedMessageContents,
      useFixedDeviceId: isFixedDeviceId,
      useCustomAttachmentUpload: useOwnUploadFun,
      uiKitVersion: '1.6.0',
      managers: UIKitManagers,
      // serviceConfig: {
      //   serverUrls: {
      //     restApiUrl: 'https://tke-sdb-a1.easemob.com',
      //     wsUrl: 'wss://tke-sdb-im-api-wechat.easemob.com/websocket',
      //     syncWsUrl: 'wss://tke-sdb-fusion.easemob.com/ws',
      //   },
      // },
    };
  }, [
    appId,
    appKey,
    deviceId,
    enableSyncData,
    enableUserInfoSync,
    isFixedDeviceId,
    msyncUrl,
    restUrl,
    useOwnUploadFun,
    useReplacedMessageContents,
  ]);

  const client = useMemo(() => {
    return ChatClient.init(initOptions) as UIKitChatClient;
  }, [initOptions]);

  useEffect(() => {
    rootStore.setClient(client);
    rootStore.setInitConfig(normalizedInitConfig);
    rootStore.setUserInfoProvider(normalizedProviders.userInfo);
  }, [client, normalizedInitConfig, normalizedProviders.userInfo]);

  const normalizedProps = useMemo(
    () => ({
      ...props,
      initConfig: normalizedInitConfig,
      providers: normalizedProviders,
      userInfoProvider: normalizedProviders.userInfo,
    }),
    [props, normalizedInitConfig, normalizedProviders],
  );

  // console.log('Provider is run...');
  useEventHandler(normalizedProps, client);

  const localConfig = useMemo(
    () => ({
      fallbackLng: local?.fallbackLng || 'en',
      lng: local?.lng || 'en',
      resources: local?.resources || resource,
    }),
    [local],
  );

  useMemo(() => {
    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init(localConfig);
    } else {
      i18n.changeLanguage(localConfig.lng);
    }
  }, [localConfig]);

  // i18n.changeLanguage('zh');

  useEffect(() => {
    if (initConfig.userId && initConfig.token) {
      client
        .login({
          userId: initConfig.userId.toLowerCase(),
          token: initConfig.token,
        })
        .then(() => {
          eventHandler.dispatchSuccess('open');
        })
        .catch(err => {
          eventHandler.dispatchError('open', err);
        });
    } else if (initConfig.userId && initConfig.password) {
      eventHandler.dispatchError(
        'open',
        new Error('Password login is not supported by SDK 5. Use userId and token.') as never,
      );
    }
  }, [client, initConfig.password, initConfig.token, initConfig.userId]);

  useEffect(() => {
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
  }, [theme?.primaryColor]);

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
        initConfig: normalizedInitConfig,
        features,
        providers: normalizedProviders,
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

const P = memo(Provider);
P.displayName = 'Provider';
export default P;
