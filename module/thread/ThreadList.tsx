import React, { useEffect, useState, useRef, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/panel.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Header from '../header';
import Input from '../../component/input';
import { RootContext } from '../store/rootContext';

import ScrollList from '../../component/scrollList';
import { useTranslation } from 'react-i18next';
import { ChatSDK } from 'module/SDK';
import { getConversationTime, getMsgSenderNickname } from '../utils/index';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { observer } from 'mobx-react-lite';
import i18next from 'i18next';

export interface ThreadListProps {
  className?: string;
  prefix?: string;
  style?: React.CSSProperties;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  headerContent?: React.ReactNode;
  onClose?: () => void;
  onClickItem?: (data: ChatSDK.ChatThreadOverview) => void;
  renderHeader?: () => React.ReactNode;
}
const ThreadList = (props: ThreadListProps) => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { prefix, style, onSearch, onClear, headerContent, className, renderHeader, onClickItem } =
    props;
  const context = useContext(RootContext);
  const { theme, rootStore } = context;
  const { appUsersInfo } = rootStore.addressStore || {};
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('thread-panel', prefix);
  const { t } = useTranslation();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const ThreadScrollList = ScrollList<ChatSDK.ChatThreadOverview>();
  const [search, setSearch] = useState(false);
  const handleClose = () => {
    props.onClose?.();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e);
    const value = e.target.value;

    const filterList = threadList.filter(item => {
      return item.name.includes(value);
    });
    setRenderThreadList(filterList);
  };

  const renderHeaderContent = () => {
    return (
      <div className={`${prefixCls}-header`}>
        {search ? (
          <Input
            className={`${prefixCls}-header-title-input`}
            close
            onChange={handleSearch}
            onClear={() => {
              onClear?.();
              setRenderThreadList(threadList || []);
              setSearch(false);
            }}
          ></Input>
        ) : (
          <div className={`${prefixCls}-header-title`}>
            {headerContent || `${i18next.t('thread')}${i18next.t('list')}`}
          </div>
        )}
      </div>
    );
  };
  const handleClickSearch = () => {
    setSearch(true);
  };
  const threadScrollRef = useRef(null);
  const [cursor, setCursor] = useState<string | undefined | null>();
  const CVS = rootStore.conversationStore.currentCvs;
  const threadList = rootStore.threadStore.threadList[CVS.conversationId] || [];
  const [renderThreadList, setRenderThreadList] = useState(threadList);

  const openThread = (item: ChatSDK.ChatThreadOverview) => {
    onClickItem?.(item);
    // close thread list modal
    rootStore.threadStore.joinChatThread(item.id || '');
    rootStore.threadStore.setThreadVisible(true);
    rootStore.threadStore.getChatThreadDetail(item.id);
  };
  const pagingGetThreadList = () => {
    if (cursor === null) return;
    rootStore.threadStore.getGroupChatThreads(CVS.conversationId, cursor)?.then(res => {
      setCursor(res);
      setTimeout(() => {
        // @ts-ignore
        threadScrollRef?.current?.scrollTo?.(threadList.length * 56);
      }, 100);
    });
  };
  const threadListContent = () => {
    const renderItem = (item: ChatSDK.ChatThreadOverview, index: number) => {
      let lastMsg = '';
      // @ts-ignore
      switch (item.lastMessage?.type) {
        case 'txt':
          // @ts-ignore
          lastMsg = item.lastMessage?.msg;
          break;
        case 'img':
          lastMsg = `/${t('image')}/`;
          break;
        case 'audio':
          lastMsg = `/${t('audio')}/`;
          break;
        case 'file':
          lastMsg = `/${t('file')}/`;
          break;
        case 'video':
          lastMsg = `/${t('video')}/`;
          break;
        case 'custom':
          lastMsg = `/${t('custom')}/`;
          break;
        case 'combine':
          lastMsg = `/${t('combine')}/`;
          break;
        default:
          // @ts-ignore
          console.warn('unexpected message type:', item.lastMessage?.type);
          break;
      }
      return (
        <div
          className={`${prefixCls}-item`}
          key={index}
          onClick={() => {
            openThread(item);
          }}
        >
          <span className={`${prefixCls}-item-name`}> {item.name}</span>
          {(item.lastMessage as any)?.type && (
            <div className={`${prefixCls}-item-msgBox`}>
              <Avatar size={12} src={appUsersInfo?.[item.lastMessage?.from]?.avatarurl}>
                {appUsersInfo?.[item.lastMessage?.from]?.nickname || item.lastMessage?.from}
              </Avatar>
              <div className={`${prefixCls}-item-msgBox-name`}>
                {getMsgSenderNickname(
                  item.lastMessage as unknown as BaseMessageType,
                  item.parentId,
                )}
              </div>
              <div>{lastMsg}</div>
              <div>{getConversationTime((item.lastMessage as any)?.time)}</div>
            </div>
          )}
        </div>
      );
    };

    const dom = (
      <ThreadScrollList
        ref={threadScrollRef}
        loading={false}
        loadMoreItems={pagingGetThreadList}
        scrollDirection="down"
        paddingHeight={50}
        // @ts-ignore
        data={renderThreadList}
        renderItem={renderItem}
      ></ThreadScrollList>
    );
    return dom;
  };

  useEffect(() => {
    if (!CVS.conversationId) return;
    rootStore.threadStore.getGroupChatThreads(CVS.conversationId)?.then(cursor => {
      setCursor(cursor);
    });
  }, [CVS.conversationId]);

  useEffect(() => {
    setRenderThreadList(threadList);
  }, [threadList.length, CVS.conversationId]);

  return (
    <div
      className={classString}
      style={{
        ...style,
      }}
    >
      {' '}
      {renderHeader ? (
        renderHeader()
      ) : (
        <Header
          avatar={true}
          close
          moreAction={{ visible: false, actions: [] }}
          onClickClose={handleClose}
          content={renderHeaderContent()}
          suffixIcon={
            <Button type="text" shape="circle" onClick={handleClickSearch}>
              <Icon type="SEARCH" width={24} height={24}></Icon>
            </Button>
          }
        ></Header>
      )}
      <div className={`${prefixCls}-content`}>
        <div className={`${prefixCls}-threads-box`}>{threadListContent()}</div>
      </div>
    </div>
  );
};

export default observer(ThreadList);
