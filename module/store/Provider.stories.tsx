import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import Provider from '../store/Provider';

const lang = import.meta.env.VITE_CUSTOM_VAR as 'en' | 'zh';

const description = {
  en: {
    provider:
      '`UIKitProvider` is used to manage data. `UIKitProvider` does not render any UI, it is only used to provide a global context for other components, and it automatically listens to SDK events, passing data down to the component tree to drive component updates. Other components in UIKit must be wrapped by `UIKitProvider`.',
    initConfig: 'Initial configuration for the provider',
    theme: 'Theme configuration for the provider',
    children: 'Child components to be wrapped by the provider',

    initConfig_appKey: 'Application key for initialization',
    initConfig_userId:
      'User ID for initialization, if uikit internal automatic login is required, it is required to pass in',
    initConfig_token:
      'User token for initialization, if uikit internal automatic login is required, it is required to pass in',
    initConfig_password:
      'User password for initialization, if uikit internal automatic login is required, it is required to pass in',
    initConfig_translationTargetLanguage:
      'Translation target language, text message translation function uses',
    initConfig_useUserInfo:
      "Whether to use user information, default: true, if set to true, uikit internal will automatically get the user information of itself and other users, used to display the user's avatar and nickname, the user should call the SDK's setUserInfo method to set their own user information after login. If set to false, uikit internal will default to display the userId and default avatar, and you need to set the user information yourself.",
    initConfig_useReplacedMessageContents:
      'Set SDK whether to use replaced message contents, content review function uses',
    initConfig_maxMessages:
      'Maximum number of messages in a single conversation, exceeding which old messages will be discarded, and the old messages will be loaded out when scrolling to the top to load historical messages',
    initConfig_isFixedDeviceId: 'Whether to fix the device ID',

    theme_primaryColor: 'Primary color, 16-bit color value or hue value',
    theme_mode: 'Theme mode, light or dark',
    theme_avatarShape: 'Avatar shape, circle or square',
    theme_bubbleShape: 'Bubble shape, round or square',
    theme_componentsShape: 'Components shape, round or square',
    theme_ripple: 'Whether to enable ripple effect',

    features: 'Provider features configuration',
    features_chat: 'Chat features configuration',
    features_chat_header: 'Chat header features configuration',
    features_chat_header_threadList: 'Chat header thread list features configuration',
    features_chat_header_moreAction: 'Chat header more action features configuration',
    features_chat_header_clearMessage: 'Chat header clear message features configuration',
    features_chat_header_deleteConversation:
      'Chat header delete conversation features configuration',
    features_chat_header_audioCall: 'Chat header audio call features configuration',
    features_chat_header_videoCall: 'Chat header video call features configuration',
    features_chat_header_pinMessage: 'Chat header pin message features configuration',

    features_chat_message: 'Chat message features configuration',
    features_chat_message_status: 'Chat message status features configuration',
    features_chat_message_thread: 'Chat message thread features configuration',
    features_chat_message_reaction: 'Chat message reaction features configuration',
    features_chat_message_moreAction: 'Chat message more action features configuration',
    features_chat_message_reply: 'Chat message reply features configuration',
    features_chat_message_delete: 'Chat message delete features configuration',
    features_chat_message_recall: 'Chat message recall features configuration',
    features_chat_message_translate: 'Chat message translate features configuration',
    features_chat_message_edit: 'Chat message edit features configuration',
    features_chat_message_select: 'Chat message select features configuration',
    features_chat_message_forward: 'Chat message forward features configuration',
    features_chat_message_report: 'Chat message report features configuration',
    features_chat_message_pin: 'Chat message pin features configuration',

    features_chat_messageInput: 'Chat message input features configuration',
    features_chat_messageInput_mention: 'Chat message input mention features configuration',
    features_chat_messageInput_typing: 'Chat message input typing features configuration',
    features_chat_messageInput_record: 'Chat message input record features configuration',
    features_chat_messageInput_emoji: 'Chat message input emoji features configuration',
    features_chat_messageInput_moreAction: 'Chat message input more action features configuration',
    features_chat_messageInput_file: 'Chat message input file features configuration',
    features_chat_messageInput_picture: 'Chat message input picture features configuration',
    features_chat_messageInput_video: 'Chat message input video features configuration',
    features_chat_messageInput_contactCard:
      'Chat message input contact card features configuration',

    features_conversationList: 'Conversation list features configuration',
    features_conversationList_search: 'Conversation list search features configuration',
    features_conversationList_item: 'Conversation list item features configuration',
    features_conversationList_item_moreAction:
      'Conversation list item more action features configuration',
    features_conversationList_item_deleteConversation:
      'Conversation list item delete conversation features configuration',
    features_conversationList_item_pinConversation:
      'Conversation list item pin conversation features configuration',
    features_conversationList_item_muteConversation:
      'Conversation list item mute conversation features configuration',
    features_conversationList_item_presence:
      'Conversation list item presence features configuration',

    local: 'config for localization',
    local_fallbackLng: 'default language',
    local_lng: 'current language',
    local_resources: 'language resources',
    local_resources_key: 'language resource key, such as "en" or "zh"',
    local_resources_translation: 'language resource translation',
    local_resources_translation_key:
      'language resource translation key, such as "conversationTitle": "Conversation List"',

    reactionConfig: 'config for message reaction',
    reactionConfig_map: 'map for message reaction',
    reactionConfig_map_key:
      'message reaction key, such as "like" or "heart", value is the corresponding reaction image.',

    presenceMap: 'config for user presence',
    presenceMap_key:
      'user presence key, such as "online" or "offline", value is the corresponding presence image.',
  },
  zh: {
    provider:
      '`UIKitProvider` 组件用来管理数据。 `UIKitProvider` 不渲染任何 UI, 只用来为其他组件提供全局的 context，它自动监听 SDK 事件, 在组件树中向下传递数据来驱动组件更新，UIKit 中其他组件必须用 `UIKitProvider` 包裹。',
    initConfig: 'Provider 的初始配置',
    theme: 'Provider 的主题配置',
    children: '由 Provider 包裹的子组件',

    initConfig_appKey: '应用的唯一标识',
    initConfig_userId: '用户id，如果需要uikit内部自动登录，则需要传入',
    initConfig_token: '用户token，如果需要uikit内部自动登录，则需要传入',
    initConfig_password: '用户密码，如果需要uikit内部自动登录，则需要传入',
    initConfig_translationTargetLanguage: '翻译目标语言，文本消息的翻译功能使用',
    initConfig_useUserInfo:
      '是否使用用户属性功能，默认：true，设置为true时，uikit内部会自动获取自己和其他用户的用户属性，用来展示用户的头像和昵称，用户在登录后应该调用SDK的setUserInfo方法设置自己的用户属性。如果设置为false，则uikit内部默认展示 userId 和默认头像，需要自己设置用户信息。',
    initConfig_useReplacedMessageContents: '设置SDK是否使用替换消息内容, 内容审核功能使用。',
    initConfig_maxMessages:
      '单个会话缓存的最大消息数，超过后会丢弃旧消息，在滚动到顶部加载历史消息时还会加载出来',
    initConfig_isFixedDeviceId: '是否固定设备id',

    theme_primaryColor: '主题颜色，16进制颜色值或者Hue值',
    theme_mode: '主题模式，light 或者 dark',
    theme_avatarShape: '头像形状，circle 或者 square',
    theme_bubbleShape: '气泡形状，round 或者 square',
    theme_componentsShape: '组件形状，round 或者 square',
    theme_ripple: '是否启用涟漪效果',

    features: 'Provider 的功能配置',
    features_chat: '聊天功能配置',
    features_chat_header: '聊天头部功能配置',
    features_chat_header_threadList: '聊天头部子区列表功能配置',
    features_chat_header_moreAction: '聊天头部更多操作功能配置',
    features_chat_header_clearMessage: '聊天头部清除消息功能配置',
    features_chat_header_deleteConversation: '聊天头部删除会话功能配置',
    features_chat_header_audioCall: '聊天头部语音通话功能配置',
    features_chat_header_videoCall: '聊天头部视频通话功能配置',
    features_chat_header_pinMessage: '聊天头部置顶消息功能配置',

    features_chat_message: '聊天消息功能配置',
    features_chat_message_status: '聊天消息状态功能配置',
    features_chat_message_thread: '聊天消息子区功能配置',
    features_chat_message_reaction: '聊天消息表情回复功能配置',
    features_chat_message_moreAction: '聊天消息更多操作功能配置',
    features_chat_message_reply: '聊天消息回复功能配置',
    features_chat_message_delete: '聊天消息删除功能配置',
    features_chat_message_recall: '聊天消息撤回功能配置',
    features_chat_message_translate: '聊天消息翻译功能配置',
    features_chat_message_edit: '聊天消息编辑功能配置',
    features_chat_message_select: '聊天消息选择功能配置',
    features_chat_message_forward: '聊天消息单条转发功能配置',
    features_chat_message_report: '聊天消息举报功能配置',
    features_chat_message_pin: '聊天消息置顶功能配置',

    features_chat_messageInput: '聊天消息输入框功能配置',
    features_chat_messageInput_mention: '聊天消息输入框@功能配置',
    features_chat_messageInput_typing: '聊天消息输入框输入状态功能配置',
    features_chat_messageInput_record: '聊天消息输入框录音功能配置',
    features_chat_messageInput_emoji: '聊天消息输入框表情功能配置',
    features_chat_messageInput_moreAction: '聊天消息输入框更多操作功能配置',
    features_chat_messageInput_file: '聊天消息输入框文件功能配置',
    features_chat_messageInput_picture: '聊天消息输入框图片功能配置',
    features_chat_messageInput_video: '聊天消息输入框视频功能配置',
    features_chat_messageInput_contactCard: '聊天消息输入框联系人卡片功能配置',

    features_conversationList: '会话列表功能配置',
    features_conversationList_search: '会话列表搜索功能配置',
    features_conversationList_item: '会话列表会话项功能配置',
    features_conversationList_item_moreAction: '会话列表会话项更多操作功能配置',
    features_conversationList_item_deleteConversation: '会话列表会话项删除会话功能配置',
    features_conversationList_item_pinConversation: '会话列表会话项置顶会话功能配置',
    features_conversationList_item_muteConversation: '会话列表会话项免打扰功能配置',
    features_conversationList_item_presence: '会话列表会话项在线状态功能配置',

    local: 'Provider 的本地化配置',
    local_fallbackLng: '默认语言',
    local_lng: '当前语言',
    local_resources: '语言资源',
    local_resources_key: '语言资源键，例如 "en" 或 "zh"',
    local_resources_translation: '语言资源翻译',
    local_resources_translation_key: '语言资源翻译键, 例如 "conversationTitle": "会话列表"',

    reactionConfig: '消息表情回复功能的表情配置',
    reactionConfig_map: '消息表情回复功能的表情映射',
    reactionConfig_map_key:
      '消息表情回复功能的表情键，例如 "like" 或 "heart"，值为对应的表情图片。',

    presenceMap: '用户在线状态的自定义配置',
    presenceMap_key: '用户在线状态键，例如 "online" 或 "offline"，值为对应的在线状态图片。',
  },
};

export default {
  title: 'Container/UIKitProvider',
  component: Provider,
  parameters: {
    docs: {
      description: {
        component: description[lang].provider,
      },
    },
  },
  argTypes: {
    initConfig: {
      control: 'object',
      description: description[lang].initConfig,
      table: {
        type: {
          summary: 'object',
          detail: `{
    appKey: string; // ${description[lang].initConfig_appKey}
    userId?: string; // ${description[lang].initConfig_userId}
    token?: string; // ${description[lang].initConfig_token}
    password?: string; // ${description[lang].initConfig_password}
    translationTargetLanguage?: string; // ${description[lang].initConfig_translationTargetLanguage}
    useUserInfo?: boolean; // ${description[lang].initConfig_useUserInfo}
    useReplacedMessageContents?: boolean; // ${description[lang].initConfig_useReplacedMessageContents}
    maxMessages?: number; // ${description[lang].initConfig_maxMessages}
    isFixedDeviceId?: boolean; // ${description[lang].initConfig_isFixedDeviceId}
}`,
        },
      },
    },
    theme: {
      control: 'object',
      description: description[lang].theme,
      table: {
        type: {
          summary: 'object',
          detail: `{
    primaryColor?: string | number; // ${description[lang].theme_primaryColor}
    mode?: 'light' | 'dark'; // ${description[lang].theme_mode}
    avatarShape?: 'circle' | 'square'; // ${description[lang].theme_avatarShape}
    bubbleShape?: 'round' | 'square'; // ${description[lang].theme_bubbleShape}
    componentsShape?: 'round' | 'square'; // ${description[lang].theme_componentsShape}
    ripple?: boolean; // ${description[lang].theme_ripple}
}`,
        },
      },
    },
    features: {
      control: 'object',
      description: description[lang].features,
      table: {
        type: {
          summary: 'object',
          detail: `{
chat?: { // ${description[lang].features_chat}
      header?: { // ${description[lang].features_chat_header}
        threadList: boolean; // ${description[lang].features_chat_header_threadList}
        moreAction?: boolean; // ${description[lang].features_chat_header_moreAction}
        clearMessage?: boolean; // ${description[lang].features_chat_header_clearMessage}
        deleteConversation?: boolean; // ${description[lang].features_chat_header_deleteConversation}
        audioCall?: boolean; // ${description[lang].features_chat_header_audioCall}
        videoCall?: boolean; // ${description[lang].features_chat_header_videoCall}
        pinMessage?: boolean; // ${description[lang].features_chat_header_pinMessage}
      };
      message?: { // ${description[lang].features_chat_message}
        status?: boolean; // ${description[lang].features_chat_message_status}
        thread?: boolean; // ${description[lang].features_chat_message_thread}
        reaction?: boolean; // ${description[lang].features_chat_message_reaction}
        moreAction?: boolean; // ${description[lang].features_chat_message_moreAction}
        reply?: boolean; // ${description[lang].features_chat_message_reply}
        delete?: boolean; // ${description[lang].features_chat_message_delete}
        recall?: boolean; // ${description[lang].features_chat_message_recall}      
        translate?: boolean; // ${description[lang].features_chat_message_translate}
        edit?: boolean; // ${description[lang].features_chat_message_edit}
        select?: boolean; // ${description[lang].features_chat_message_select}
        forward?: boolean; // ${description[lang].features_chat_message_forward}
        report?: boolean; // ${description[lang].features_chat_message_report}
        pin?: boolean; // ${description[lang].features_chat_message_pin}
      };
      messageInput?: { // ${description[lang].features_chat_messageInput}
        mention?: boolean; // ${description[lang].features_chat_messageInput_mention}
        typing?: boolean; // ${description[lang].features_chat_messageInput_typing}
        record?: boolean; // ${description[lang].features_chat_messageInput_record}
        emoji?: boolean; // ${description[lang].features_chat_messageInput_emoji}
        moreAction?: boolean; // ${description[lang].features_chat_messageInput_moreAction}
        file?: boolean; // ${description[lang].features_chat_messageInput_file}
        picture?: boolean; // ${description[lang].features_chat_messageInput_picture}
        video?: boolean; // ${description[lang].features_chat_messageInput_video}
        contactCard?: boolean; // ${description[lang].features_chat_messageInput_contactCard}
      };
    };
    conversationList?: { // ${description[lang].features_conversationList}
      search?: boolean; // ${description[lang].features_conversationList_search}
      item?: { // ${description[lang].features_conversationList_item}
        moreAction?: boolean; // ${description[lang].features_conversationList_item_moreAction}
        deleteConversation?: boolean; // ${description[lang].features_conversationList_item_deleteConversation}
        pinConversation?: boolean; // ${description[lang].features_conversationList_item_pinConversation}
        muteConversation?: boolean; // ${description[lang].features_conversationList_item_muteConversation}
      };
    };
}`,
        },
      },
    },
    local: {
      control: 'object',
      description: description[lang].local,
      table: {
        type: {
          summary: 'object',
          detail: `{
    fallbackLng?: string; // ${description[lang].local_fallbackLng}
    lng?: string; // ${description[lang].local_lng} 
    resources?: { // ${description[lang].local_resources}
      [key: string]: { // ${description[lang].local_resources_key}
        translation: { // ${description[lang].local_resources_translation}
          [key: string]: string; // ${description[lang].local_resources_translation_key}
        };
      };
    };
}`,
        },
      },
    },
    reactionConfig: {
      control: 'object',
      description: description[lang].reactionConfig,
      table: {
        type: {
          summary: 'object',
          detail: `{
    map: { // ${description[lang].reactionConfig_map}
      [key: string]: HTMLImageElement; // ${description[lang].reactionConfig_map_key}
    };
}`,
        },
      },
    },
    presenceMap: {
      control: 'object',
      description: description[lang].presenceMap,
      table: {
        type: {
          summary: 'object',
          detail: `{
    [key: string]: string | HTMLImageElement; // ${description[lang].presenceMap_key}
}`,
        },
      },
    },
    children: {
      control: 'text',
      description: description[lang].children,
    },
  },
} as Meta<typeof Provider>;

const Template: StoryFn<typeof Provider> = args => (
  <Provider {...args}>
    <div>UIKitProvider</div>
  </Provider>
);

export const Default = {
  render: Template,
  args: {
    initConfig: {
      appKey: 'a#b',
    },
    theme: {
      mode: 'light',
    },
    children: 'This is a child component wrapped by Provider.',
  },
};
