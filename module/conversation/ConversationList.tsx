import React, { FC, useState, useContext, useEffect, ReactEventHandler } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Badge from '../../component/badge';
import Button from '../../component/button';
import { ConversationItem as CVSItem, ConversationItemProps } from './ConversationItem';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import { useConversation } from '../hooks/useConversation';
import { useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { parseChannel } from '../utils';

import { useTranslation } from 'react-i18next';

export type ConversationData = Array<{
  chatType: 'singleChat' | 'groupChat';
  conversationId: string;
  name?: string; // 昵称/群组名称
  unreadCount: number; // 会话未读数
  lastMessage: {
    type: 'txt' | 'img' | 'audio' | 'video' | 'file' | 'custom';
    msg?: string;
    time: number;
    chatType: 'singleChat' | 'groupChat';
    from: string;
  }; // 会话最后一条消息
}>;

export type ServerCvs = Array<{
  channel_id: string;
  lastMessage: any;
  unread_num: number;
}>;

export interface ConversationListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  // data?: ConversationData;
  onItemClick?: (data: ConversationData[0]) => void; // 点击会话事件
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean; // search 组件 change 事件，默认根据 会话 Id和name搜索， 如果返回 false， 会阻止默认行为
  renderHeader?: () => React.ReactNode; // 自定义渲染 header
  renderSearch?: () => React.ReactNode; // 自定义渲染 search
  renderItem?: (cvs: ConversationData[0], index: number) => React.ReactNode; // 自定义渲染 item
  headerProps?: HeaderProps;
  itemProps?: ConversationItemProps;
}

let Conversations: FC<ConversationListProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    onItemClick,
    onSearch,
    renderHeader,
    renderSearch,
    renderItem,
    headerProps = {},
    itemProps = {},
    style = {},
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('conversationList', customizePrefixCls);
  const [activeKey, setActiveKey] = useState<number>();
  const classString = classNames(prefixCls, className);
  const { getJoinedGroupList } = useGroups();

  const [isSearch, setIsSearch] = useState(false);
  const [renderData, setRenderData] = useState<ConversationData>([]);
  const [initRenderData, setInitRenderData] = useState<ConversationData>([]);
  const rootStore = useContext(RootContext).rootStore;
  const cvsStore = rootStore.conversationStore;
  const { t } = useTranslation();

  const handleItemClick = (cvs: ConversationData[0], index: number) => () => {
    setActiveKey(index);
    console.log('handleItemClick', index);
    cvsStore.setCurrentCvs({
      chatType: cvs.chatType,
      conversationId: cvs.conversationId,
      name: cvs.name,
      unreadCount: 0,
    });

    onItemClick?.(cvs);
  };

  useEffect(() => {
    if (
      !cvsStore.currentCvs ||
      (cvsStore.currentCvs && Object.keys(cvsStore.currentCvs).length == 0)
    ) {
      setActiveKey(99999);
    }
  }, [cvsStore.currentCvs]);

  const content = renderData.map((cvs, index) => {
    console.log('activeKey', activeKey);
    // TODO: 复制renderItem的内容， 把isActive onClick的实现加进去，否则用户需要自己实现这些
    return renderItem ? (
      renderItem(cvs, index)
    ) : (
      <CVSItem
        {...itemProps}
        data={cvs}
        key={cvs.conversationId}
        isActive={index === activeKey}
        onClick={handleItemClick(cvs, index)}
      ></CVSItem>
    );
  });

  const cvsData = useConversation();

  const groupData = rootStore.addressStore.groups;
  const userInfo = useUserInfo();

  let iniRenderData: any[] = [];
  // 获取加入群组，把群组名放在 conversationList
  useEffect(() => {
    if (isSearch) {
      // @ts-ignore
      setRenderData(cvsStore.searchList);
    } else {
      const renderData = cvsStore.conversationList.map(item => {
        let renderItem = { ...item };
        if (item.chatType == 'groupChat') {
          groupData.forEach(group => {
            if (item.conversationId == group.groupid) {
              renderItem.name = renderItem.name || group.groupname;
            }
          });
        } else if (item.chatType == 'singleChat') {
          renderItem.name = renderItem.name || userInfo?.[item.conversationId as string]?.nickname;
        }
        return renderItem;
      });
      // @ts-ignore
      setRenderData(renderData);
      // @ts-ignore
      setInitRenderData(renderData);
    }
  }, [cvsStore.conversationList, cvsStore.searchList, groupData, userInfo]);

  // 获取会话列表数据，格式化后setConversation
  useEffect(() => {
    const conversation = cvsData.map(cvs => {
      const { chatType, conversationId } = parseChannel(cvs.channel_id);
      return {
        chatType,
        conversationId,
        unreadCount: cvs.unread_num,
        lastMessage: cvs.lastMessage,
      };
    });
    rootStore.conversationStore.setConversation(conversation);
  }, [cvsData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const returnValue = onSearch?.(e);
    if (returnValue === false) return;
    const searchList = initRenderData.filter(cvs => {
      if (cvs.conversationId.includes(value) || cvs.name?.includes(value)) {
        return true;
      }
      return false;
    });

    setIsSearch(value.length > 0 ? true : false);
    // @ts-ignore
    cvsStore.setSearchList(searchList);
  };

  useEffect(() => {
    rootStore.loginState && getJoinedGroupList();
  }, [rootStore.loginState]);

  return (
    <div className={classString} style={style}>
      {renderHeader ? (
        renderHeader()
      ) : (
        <Header
          {...headerProps}
          back={headerProps.back || false}
          content={headerProps.content || t('module.conversationTitle')}
          icon={headerProps.icon || <Icon type="PLUS_CIRCLE" height={24} width={24} />}
        ></Header>
      )}

      {renderSearch ? (
        renderSearch()
      ) : (
        <div className={`${prefixCls}-search`}>
          <Search onChange={handleSearch}></Search>
        </div>
      )}

      {content}
    </div>
  );
};

const ConversationList = observer(Conversations);

export { ConversationList };
