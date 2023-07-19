import React from 'react';

export interface ConfigConsumerProps {
  getPrefixCls: (suffixCls?: string, customizePrefixCls?: string) => string;
  iconPrefixCls?: any;
  getPopupContainer?: (triggerNode?: HTMLElement) => HTMLElement;
}

const defaultGetPrefixCls = (suffixCls?: string, customizePrefixCls?: string) => {
  if (customizePrefixCls) return customizePrefixCls;

  return suffixCls ? `cui-${suffixCls}` : 'cui';
};

export const ConfigContext = React.createContext<ConfigConsumerProps>({
  // We provide a default function for Context without provider
  getPrefixCls: defaultGetPrefixCls,
});

export const ConfigConsumer = ConfigContext.Consumer;

export const ConfigProvider = ConfigContext.Provider;
