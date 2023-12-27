import React, { FC, useState, useContext, useEffect, ReactEventHandler } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import { ConversationItem as CVSItem, ConversationItemProps } from './ConversationItem';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import { useConversations } from '../hooks/useConversation';
import { useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import { RootContext } from '../store/rootContext';
import { useTranslation } from 'react-i18next';
import ScrollList from '../../component/scrollList';
import { getUsersInfo } from '../utils/index';
import { AT_TYPE, Conversation } from '../store/ConversationStore';

export type ConversationData = Array<Conversation>;

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
  onItemClick?: (data: Conversation) => void; // 点击会话事件
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean; // search 组件 change 事件，默认根据 会话 Id和name搜索， 如果返回 false， 会阻止默认行为
  renderHeader?: () => React.ReactNode; // 自定义渲染 header
  renderSearch?: () => React.ReactNode; // 自定义渲染 search
  renderItem?: (cvs: Conversation, index: number) => React.ReactNode; // 自定义渲染 item
  headerProps?: HeaderProps;
  itemProps?: ConversationItemProps;
  presence?: boolean; // 是否显示在线状态
}

const ConversationScrollList = ScrollList<Conversation>();

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
    presence,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('conversationList', customizePrefixCls);
  const [activeCvsId, setActiveCvsId] = useState<string>();

  const { getJoinedGroupList } = useGroups();

  const [isSearch, setIsSearch] = useState(false);
  const [renderData, setRenderData] = useState<ConversationData>([]);
  const [initRenderData, setInitRenderData] = useState<ConversationData>([]);
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const cvsStore = rootStore.conversationStore;
  const { appUsersInfo, contacts } = rootStore.addressStore;
  const { t } = useTranslation();
  const { getConversationList, hasConversationNext } = useConversations();
  const globalConfig = features?.conversationList || {};

  const withPresence = presence || globalConfig?.item?.presence != false;
  useUserInfo('conversation', withPresence);

  const groupData = rootStore.addressStore.groups;
  // 获取加入群组，把群组名放在 conversationList

  const handleItemClick = (cvs: ConversationData[0], index: number) => () => {
    setActiveCvsId(cvs.conversationId);
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
      setActiveCvsId('-1');
    } else {
      setActiveCvsId(cvsStore.currentCvs.conversationId);
    }
  }, [cvsStore.currentCvs]);

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
          renderItem.name =
            renderItem.name || appUsersInfo?.[item.conversationId as string]?.nickname;
          renderItem.avatarUrl = appUsersInfo?.[item.conversationId as string]?.avatarurl;
          // renderItem.isOnline = appUsersInfo?.[item.conversationId as string]?.isOnline;
          // 如果contacts里包含这个联系人，并且有remark 则 name = remark
          const contact = contacts?.find(contact => {
            return contact.userId == item.conversationId;
          });
          if (contact?.remark) {
            renderItem.name = contact.remark;
          }
        }
        return renderItem;
      });

      // @ts-ignore
      setRenderData(renderData);
      // @ts-ignore
      setInitRenderData(renderData);
    }
  }, [cvsStore.conversationList, cvsStore.searchList, groupData.length, appUsersInfo]);

  useEffect(() => {
    cvsStore.conversationList?.forEach(cvs => {
      if (!cvs.name && cvs.chatType == 'groupChat' && rootStore.addressStore.groups.length > 0) {
        let result = rootStore.addressStore.groups.find(item => {
          return item.groupid === cvs.conversationId;
        });
        if (!result) {
          cvsStore.updateConversationName(cvs.chatType, cvs.conversationId);
        }
      }
    });
  }, [cvsStore.conversationList?.length]);

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
    if (rootStore.loginState) {
      getConversationList().then(() => {
        if (globalConfig?.item?.pinConversation != false) {
          rootStore.conversationStore.getServerPinnedConversations();
        }
      });
      getJoinedGroupList();
      getUsersInfo({
        userIdList: [rootStore.client.user],
      });
    }
  }, [rootStore.loginState]);

  let itemMoreAction: ConversationItemProps['moreAction'];
  if (globalConfig?.item?.moreAction) {
    itemMoreAction = {
      visible: true,
      actions: [],
    };
    if (globalConfig?.item?.deleteConversation != false) {
      itemMoreAction.actions.push({
        content: 'DELETE',
      });
    }
    if (globalConfig?.item?.pinConversation != false) {
      itemMoreAction.actions.push({
        content: 'PIN',
      });
    }
    if (globalConfig?.item?.muteConversation != false) {
      itemMoreAction.actions.push({
        content: 'SILENT',
      });
    }
  }
  if (globalConfig?.item?.moreAction == false) {
    itemMoreAction = {
      visible: false,
      actions: [],
    };
  }
  let showSearch = true;
  if (globalConfig.search == false) {
    showSearch = false;
  }
  return (
    <div className={classString} style={style}>
      {renderHeader ? (
        renderHeader()
      ) : (
        <Header
          {...headerProps}
          back={headerProps.back || false}
          content={headerProps.content || t('conversationTitle')}
          icon={headerProps.icon || <Icon type="PLUS_CIRCLE" height={24} width={24} />}
        ></Header>
      )}

      {renderSearch
        ? renderSearch()
        : showSearch && (
            <div className={`${prefixCls}-search`}>
              <Search onChange={handleSearch}></Search>
            </div>
          )}
      <ConversationScrollList
        // style={{ height: 'calc(100% - 110px)' }}
        hasMore={hasConversationNext}
        data={renderData}
        scrollDirection="down"
        loading={false}
        loadMoreItems={getConversationList}
        renderItem={(cvs, index) => {
          return renderItem ? (
            renderItem(cvs, index)
          ) : (
            <CVSItem
              moreAction={itemMoreAction}
              {...itemProps}
              data={cvs}
              key={cvs.conversationId}
              isActive={cvs.conversationId === activeCvsId}
              onClick={handleItemClick(cvs, index)}
            ></CVSItem>
          );
        }}
      ></ConversationScrollList>
    </div>
  );
};

const ConversationList = observer(Conversations);

export { ConversationList };
