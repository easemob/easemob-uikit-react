import React, { ReactElement, ReactNode, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import Icon from '../../component/icon';
import './style/style.scss';
import { useTranslation } from 'react-i18next';
import { renderTxt } from '../textMessage/TextMessage';
import { RootContext } from '../store/rootContext';
export interface UnsentRepliedMsgProps {
  prefixCls?: string;
  className?: string;
  type: 'summary';
}

const UnsentRepliedMsg = (props: UnsentRepliedMsgProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = useContext(RootContext);
  const { rootStore, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { prefixCls: customizePrefixCls, className, type } = props;
  const prefixCls = getPrefixCls('message-reply', customizePrefixCls);
  const { t } = useTranslation();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${type}`]: type == 'summary',
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const repliedMessage = rootStore.messageStore.repliedMessage;
  const renderMsgContent = (msg: any) => {
    let content: ReactNode;
    switch (msg.type) {
      case 'txt':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            {renderTxt(msg.msg, '' as unknown as false)}
          </div>
        );
        break;
      case 'file':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            <Icon type="DOC" color="#75828A" width={16} height={16}></Icon>
            <span>{t('file')}:</span>
            {msg.filename}
          </div>
        );
        break;
      case 'audio':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            <Icon type="WAVE3" color="#75828A" width={16} height={16}></Icon>
            <span>{t('audio')}:</span>
            {msg.length}"
          </div>
        );
        break;
      case 'img':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            <span>{t('image')}</span>
            <div className={`${prefixCls}-summary-desc-img`}>
              {/* <Icon type="IMG" color="#75828A" width={24} height={24}></Icon> */}
              <img src={msg.thumb || msg.url}></img>
            </div>
          </div>
        );
        break;
      case 'combine':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            <Icon type="TIME" color="#75828A" width={16} height={16}></Icon>
            <span>{t('chatHistory')}</span>
          </div>
        );
        break;
      case 'custom':
        if (msg.customEvent === 'chatUIKit_userCard') {
          content = (
            <div className={`${prefixCls}-summary-desc`}>
              <Icon type="PERSON_SINGLE_FILL" color="#75828A" width={16} height={16}></Icon>
              <span>{t('Contact')}:</span>
              {msg.customExts?.nickname}
            </div>
          );
        }
        break;
      case 'video':
        content = (
          <div className={`${prefixCls}-summary-desc`}>
            <span>{t('video')}</span>
            <div className={`${prefixCls}-summary-desc-img`}>
              {/* <Icon type="IMG" color="#75828A" width={24} height={24}></Icon> */}
              {/* <img src={msg.thumb || msg.url}></img> */}
              <Icon type="TRIANGLE_IN_RECTANGLE_FILL" color="#75828A" width={24} height={24}></Icon>
            </div>
          </div>
        );
        break;
      default:
        content = '';
        break;
    }
    return content;
  };

  const deleteRepliedMsg = () => {
    rootStore.messageStore.setRepliedMessage(null);
  };

  const myUserId = rootStore.client.user;
  const from = repliedMessage?.from === myUserId ? t('you') : repliedMessage?.from;

  return (
    <div className={classString}>
      <div className={`${prefixCls}-summary-title`}>
        {t('replyingTo')} <span>{from}</span>
      </div>
      {renderMsgContent(repliedMessage)}
      <Icon
        className={`${prefixCls}-summary-close`}
        width={16}
        height={16}
        type="CLOSE_CIRCLE"
        onClick={deleteRepliedMsg}
      ></Icon>
    </div>
  );
};

export { UnsentRepliedMsg };
