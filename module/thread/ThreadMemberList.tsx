import React, { useEffect, useState, useRef, useContext } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import Button from '../../component/button';
import { Tooltip } from '../../component/tooltip/Tooltip';
import Header from '../header';
import Input from '../../component/input';
import { RootContext } from '../store/rootContext';

import ScrollList from '../../component/scrollList';
import { useTranslation } from 'react-i18next';
import type { ChatSDK } from 'module/SDK';
import { getCurrentUserId, getThreadId } from '../utils/index';
import { BaseMessageType } from '../baseMessage/BaseMessage';
import { observer } from 'mobx-react-lite';
export interface ThreadMemberListProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  data?: Array<any>;
  onItemClick?: (data: any) => void; // 点击会话事件
  onClose?: () => void;
  headerContent?: React.ReactNode;
}
const ThreadScrollList = ScrollList<string>();
const ThreadMemberList = observer((props: ThreadMemberListProps) => {
  const { prefix, onClose, className, headerContent } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = useContext(RootContext);
  const { theme, rootStore } = context;
  const { appUsersInfo } = rootStore.addressStore || {};
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('thread-panel', prefix);
  const { t } = useTranslation();
  const classString = classNames(prefixCls, className, `${prefixCls}-${themeMode}`);

  const [search, setSearch] = useState(false);
  const [modalName, setModalName] = useState<string>(`${t('thread')}${t('members')}`);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const members = threadStore.currentThread.info?.members || [];
    const filterMembers = members.filter(member => {
      return member.includes(value);
    });
    setRenderMembers(filterMembers);
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
              setRenderMembers(threadStore.currentThread.info?.members || []);
              setSearch(false);
            }}
          ></Input>
        ) : (
          <div className={`${prefixCls}-header-title`}>{headerContent || modalName}</div>
        )}
      </div>
    );
  };
  const threadStore = rootStore.threadStore;
  const [renderMembers, setRenderMembers] = useState<string[]>([]);
  const [role, setRole] = useState('member');
  useEffect(() => {
    if (threadStore.currentThread.info?.members) {
      setRenderMembers(threadStore.currentThread.info?.members);
    }
  }, [threadStore.currentThread.info?.members]);

  const actions: any[] = [
    {
      content: t('remove'),
      onClick: (item: string) => {
        threadStore.removeChatThreadMember(
          threadStore.currentThread.info?.parentId || '',
          getThreadId(threadStore.currentThread.info),
          item,
        );
      },
    },
  ];
  const threadScrollRef = useRef(null);
  const [cursor, setCursor] = useState('');
  const pagingGetThreadList = () => {
    threadStore
      .getThreadMembers(
        threadStore.currentThread.info?.parentId || '',
        getThreadId(threadStore.currentThread.info),
        cursor,
      )
      .then((data: any) => {
        setCursor(data?.cursor || '');
        setModalName(`${t('threadMembers')}(${data.length})`);
        setTimeout(() => {
          // @ts-ignore
          threadScrollRef?.current?.scrollTo?.(
            (threadStore.currentThread.info?.members?.length || 0) * 64,
          );
        }, 100);
      });
  };
  const showMoreAction = role != 'member';
  const myId = getCurrentUserId(rootStore.client);
  const renderItem = (member: string) => {
    const name = rootStore.addressStore.appUsersInfo?.[member]?.nickname;
    const avatarUrl = rootStore.addressStore.appUsersInfo?.[member]?.avatarurl;
    // if (item.attributes?.nickName) {
    //   name = item.attributes?.nickName;
    // }
    const menuNode = (member: string) => (
      <ul className={`${getPrefixCls('header')}-more`}>
        {actions.map((item, index) => {
          return (
            <li
              key={index}
              onClick={() => {
                item.onClick?.(member);
              }}
            >
              {item.content}
            </li>
          );
        })}
      </ul>
    );
    return (
      <div className={`${'cui-thread'}-members-item`} key={member}>
        <div className={`${'cui-thread'}-members-item-name`}>
          <Avatar src={avatarUrl} size={40}>
            {name}
          </Avatar>
          <div>{name || member}</div>
        </div>
        {showMoreAction && myId != member && (
          <Tooltip title={menuNode(member)} trigger="click" placement="bottom">
            {
              <Button type="text" shape="circle">
                <Icon type="ELLIPSIS"></Icon>
              </Button>
            }
          </Tooltip>
        )}
      </div>
    );
  };
  const membersContent = () => {
    const members = renderMembers || [];

    const dom = (
      <ThreadScrollList
        ref={threadScrollRef}
        loading={false}
        loadMoreItems={pagingGetThreadList}
        scrollDirection="down"
        paddingHeight={50}
        data={members}
        renderItem={renderItem}
      ></ThreadScrollList>
    );
    return dom;
  };

  const currentThread = rootStore.threadStore.currentThread;
  useEffect(() => {
    const groups = rootStore.addressStore.groups || [];
    const myId = getCurrentUserId(rootStore.client);
    if (currentThread?.info?.parentId) {
      groups.forEach(item => {
        if (item.groupId == currentThread?.info?.parentId) {
          const members = item.members || [];
          if (members.length > 0) {
            for (let index = 0; index < members.length; index++) {
              if (members[index].userId == myId) {
                if (members[index].role == 'member')
                  if (item.admins?.includes(myId)) {
                    setRole('admin');
                  } else if (
                    currentThread?.info?.ownerId == myId ||
                    currentThread?.info?.owner == myId
                  ) {
                    setRole('threadOwner');
                  }
                setRole(members[index].role);
                break;
              }
            }
          }
        }
      });
    }
  }, [getThreadId(currentThread?.info)]);

  useEffect(() => {
    threadStore
      .getThreadMembers(
        threadStore.currentThread.info?.parentId || '',
        getThreadId(threadStore.currentThread.info),
      )
      .then((data: any) => {
        setCursor(data?.cursor || '');
        setModalName(`${t('threadMembers')}(${data.length})`);
      });
  }, []);

  return (
    <div className={classString}>
      <Header
        avatar={true}
        close
        moreAction={{ visible: false, actions: [] }}
        onClickClose={() => {
          onClose?.();
        }}
        content={renderHeaderContent()}
        suffixIcon={
          <Button
            type="text"
            shape="circle"
            onClick={() => {
              setSearch(true);
            }}
          >
            <Icon type="SEARCH" width={24} height={24}></Icon>
          </Button>
        }
      ></Header>
      <div className={`${prefixCls}-content`}>
        <div className={`${'cui-chat'}-threads-box`}>{membersContent()}</div>
      </div>
    </div>
  );
});

export default ThreadMemberList;
