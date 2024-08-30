import React, { memo, useContext } from 'react';
import classNames from 'classnames';
import Avatar from '../../component/avatar';
import MessageStatus, { MessageStatusProps } from '../messageStatus';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { RootContext } from '../store/rootContext';
export interface UrlMessageProps {
  mediaType: 'website' | 'image' | 'application';
  url: string;
  title?: string;
  description?: string;
  favicons?: string[];
  images?: string[];
  isLoading: boolean;
}

const UrlMessage2 = (props: UrlMessageProps) => {
  const { mediaType, url, title = '', description = '', favicons, images, isLoading } = props;
  const context = useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode || 'light';
  const Loading = () => {
    return <div className="message-text-url-loading">parsing...</div>;
  };

  let content: JSX.Element | undefined;
  if (!mediaType) return null;
  if (mediaType === 'website') {
    const logo = images?.[0];
    content = (
      <>
        <div>{logo && <img src={logo} alt="image" className="message-text-url-img" />}</div>
        <div
          className={classNames('message-text-url-info', {
            'message-text-url-info-dark': themeMode === 'dark',
          })}
        >
          <div className="message-text-url-title">{title}</div>
          <div className="message-text-url-desc">{description}</div>
        </div>
      </>
    );
  }

  if (isLoading) {
    content = <Loading></Loading>;
  }
  return <div className="message-text-url">{content}</div>;
};

const UrlMessage = memo(UrlMessage2, (p, n) => {
  return p.url == n.url;
});
export { UrlMessage };
