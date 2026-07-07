import React, { FC, useState, useContext, useEffect } from 'react';
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
import {
  getConversationChatType,
  getConversationId,
  getConversationName,
  getCurrentUserId,
} from '../utils/index';
import { Conversation } from '../store/ConversationStore';
import Modal from '../../component/modal';

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
  renderSearch?: (props: {
    onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => React.ReactNode; // 自定义渲染 search，会传入 onSearch 供自定义 input 触发搜索
  renderItem?: (cvs: Conversation, index: number) => React.ReactNode; // 自定义渲染 item
  headerProps?: HeaderProps;
  itemProps?: Partial<ConversationItemProps>; //Omit<ConversationItemProps, 'data'>;
  presence?: boolean; // 是否显示在线状态
  showSearchList?: boolean; // 是否显示搜索列表, 当使用renderHeader时，可以用这个参数来控制是否显示搜索列表
  includeEmptyConversations?: boolean; // 是否包含空会话
}

const ConversationScrollList = ScrollList<Conversation>();

const Conversations: FC<ConversationListProps> = props => {
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
    showSearchList,
    includeEmptyConversations = false,
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
  const shouldAutoFetchUserInfo = rootStore.shouldAutoFetchUserInfo();
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const cvsStore = rootStore.conversationStore;
  const { contacts } = rootStore.addressStore;
  const currentUserId = getCurrentUserId(rootStore.client);
  const { t } = useTranslation();
  const { getConversationList, hasConversationNext } = useConversations(includeEmptyConversations);
  const globalConfig = features?.conversationList || {};

  const withPresence = presence || globalConfig?.item?.presence != false;
  useUserInfo(shouldAutoFetchUserInfo ? 'conversation' : null, withPresence);

  const groupData = rootStore.addressStore.groups;
  // 获取加入群组，把群组名放在 conversationList

  const handleItemClick = (cvs: ConversationData[0], index: number) => () => {
    const conversationId = getConversationId(cvs);
    const chatType = getConversationChatType(cvs);
    setActiveCvsId(conversationId);
    if (chatType && cvsStore.currentCvs.conversationId !== conversationId) {
      cvsStore.setCurrentCvs({
        chatType,
        conversationId,
        name: getConversationName(cvs),
        unreadCount: 0,
      });
    }
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
    if (isSearch || showSearchList) {
      // @ts-ignore
      setRenderData(cvsStore.searchList);
    } else {
      const renderData = cvsStore.conversationList.map(item => {
        const renderItem = { ...item };
        const conversationId = getConversationId(item);
        const chatType = getConversationChatType(item);
        const conversationName = getConversationName(item);
        if (chatType == 'groupChat') {
          groupData.forEach(group => {
            if (conversationId == group.groupId) {
              renderItem.name = conversationName || group.groupName || group.name;
              renderItem.avatarUrl = group.avatarUrl;
            }
          });
        } else if (chatType == 'singleChat') {
          const userInfo = rootStore.addressStore.resolveUserInfo(conversationId);
          renderItem.name = conversationName || userInfo.nickname;
          renderItem.avatarUrl = userInfo.avatarUrl;
          // renderItem.isOnline = appUsersInfo?.[conversationId]?.isOnline;
          // 如果contacts里包含这个联系人，并且有remark 则 name = remark
          const contact = contacts?.find(contact => {
            return contact.userId == conversationId;
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
  }, [cvsStore.conversationList, cvsStore.searchList, groupData.length, contacts]);

  useEffect(() => {
    cvsStore.conversationList?.forEach(cvs => {
      const conversationId = getConversationId(cvs);
      const chatType = getConversationChatType(cvs);
      if (
        !getConversationName(cvs) &&
        chatType == 'groupChat' &&
        rootStore.addressStore.groups.length > 0
      ) {
        const result = rootStore.addressStore.groups.find(item => {
          return item.groupId === conversationId;
        });
        if (!result && chatType) {
          cvsStore.updateConversationName(chatType, conversationId);
        }
      }
    });
  }, [cvsStore.conversationList?.length]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const returnValue = onSearch?.(e);
    if (returnValue === false) {
      setIsSearch(value.length > 0 ? true : false);
      return;
    }
    const searchList = initRenderData.filter(cvs => {
      const conversationId = getConversationId(cvs);
      const conversationName = getConversationName(cvs);
      if (conversationId.includes(value) || conversationName?.includes(value)) {
        return true;
      }
      return false;
    });

    setIsSearch(value.length > 0 ? true : false);
    // @ts-ignore
    cvsStore.setSearchList(searchList);
  };

  const [deleteCvsModalOpen, setDeleteCvsModalOpen] = useState(false);
  // 保存resolve, reject，用于modal的确定和取消
  const [deleteCvsPromise, setDeleteCvsPromise] = useState<{
    resolve: (value: boolean) => void;
    reject: () => void;
  }>();

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (rootStore.loginState) {
      setLoading(true);
      getConversationList()
        .then(() => {
          setLoading(false);
          if (globalConfig?.item?.pinConversation != false) {
            rootStore.conversationStore.getServerPinnedConversations();
          }
        })
        .catch(() => {
          setLoading(false);
        });
      getJoinedGroupList();
      if (shouldAutoFetchUserInfo && currentUserId) {
        rootStore.addressStore.ensureUserInfos([currentUserId]).catch(e => {
          console.warn('getUsersInfo error', e);
        });
      }
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
        onClick: data => {
          setDeleteCvsModalOpen(true);
          const p: Promise<boolean> = new Promise((res, rej) => {
            setDeleteCvsPromise({
              resolve: res,
              reject: rej,
            });
          });
          return p;
        },
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
          icon={headerProps.icon || <Icon type="PLUS_IN_CIRCLE" height={24} width={24} />}
        ></Header>
      )}

      {renderSearch
        ? renderSearch({ onSearch: handleSearch })
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
        loading={loading}
        loadMoreItems={getConversationList}
        renderItem={(cvs, index) => {
          return renderItem ? (
            renderItem(cvs, index)
          ) : (
            <CVSItem
              moreAction={itemMoreAction}
              {...itemProps}
              data={cvs}
              key={getConversationId(cvs)}
              isActive={getConversationId(cvs) === activeCvsId}
              onClick={handleItemClick(cvs, index)}
            ></CVSItem>
          );
        }}
      ></ConversationScrollList>

      <Modal
        open={deleteCvsModalOpen}
        title={t('deleteConversation')}
        onCancel={() => {
          deleteCvsPromise?.resolve?.(false);
          setDeleteCvsModalOpen(false);
        }}
        onOk={() => {
          deleteCvsPromise?.resolve?.(true);
          setDeleteCvsPromise(undefined);
          setDeleteCvsModalOpen(false);
        }}
      >
        <div>{`${t('Delete this conversation')}?`}</div>
      </Modal>
    </div>
  );
};

const ConversationList = observer(Conversations);

export { ConversationList };
