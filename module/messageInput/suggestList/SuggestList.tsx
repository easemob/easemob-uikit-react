import React, { FC, useEffect, useState, useRef, useMemo } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
import { getStore } from '../../store';
import './style/style.scss';
import { MemberItem } from '../../store/AddressStore';
import { getGroupItemFromGroupsById, getGroupMemberNickName, getAppUserInfo } from '../../utils';
import Avatar from '../../../component/avatar';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import Icon from '../../../component/icon';
import { RootContext } from '../../store/rootContext';
export const AT_ALL = 'ALL';
import { isSafariVersionGreaterThan17 } from './utils';

const searchUser = (memberList: MemberItem[], queryString?: string) => {
  return queryString
    ? memberList.filter(user => {
        return getGroupMemberNickName(user).startsWith(queryString);
      })
    : memberList.slice(0);
};

export interface SuggestListProps {
  visible: boolean;
  style?: React.CSSProperties;
  position: { x: number; y: number };
  queryString?: string;
  className?: string;
  onPickUser: (user: MemberItem) => void;
  onHide: () => void;
  onShow: () => void;
}

const SuggestList: FC<SuggestListProps> = props => {
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const context = React.useContext(RootContext);
  const { theme } = context;
  const themeMode = theme?.mode || 'light';
  const prefixCls = getPrefixCls('suggest');
  const listCls = getPrefixCls('suggest-list');
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    props.className,
  );
  const [index, setIndex] = useState(-1);
  const usersRef = useRef<MemberItem[]>();
  const suggestRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<number>();
  indexRef.current = index;
  const visibleRef = useRef<boolean>();
  visibleRef.current = props.visible;
  const { style = {} } = props;
  const currentCVS = getStore().messageStore.currentCVS;
  const client = getStore().client;
  const memberList = getGroupItemFromGroupsById(currentCVS.conversationId)?.members || [];

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    //@ts-ignore
    setIndex(Number(e.target.dataset.idx));
  };

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (indexRef.current !== undefined && usersRef.current?.[indexRef.current]) {
      props.onPickUser(usersRef.current?.[indexRef.current]);
      setIndex(-1);
    }
  };

  const AT_ALL_ITEM = {
    userId: AT_ALL,
    role: null,
    attributes: {
      nickName: t('atAll'),
    },
  } as any;

  const filteredUsers = useMemo(() => {
    return searchUser(
      [AT_ALL_ITEM, ...memberList].filter(user => user.userId !== client.user),
      props.queryString,
    );
  }, [memberList, props.queryString]);
  usersRef.current = filteredUsers;

  useEffect(() => {
    setIndex(0);
    if (!filteredUsers.length) {
      props.onHide();
    }
  }, [filteredUsers]);

  useEffect(() => {
    suggestRef?.current
      ?.getElementsByClassName('active')?.[0]
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);

  useEffect(() => {
    const keyDownHandler = (e: any) => {
      if (visibleRef.current) {
        if (e.code === 'Escape') {
          props.onHide();
          return;
        }
        if (e.code === 'ArrowDown') {
          setIndex(oldIndex => {
            return Math.min(oldIndex + 1, (usersRef.current?.length || 0) - 1);
          });
          return;
        }
        if (e.code === 'ArrowUp') {
          setIndex(oldIndex => Math.max(0, oldIndex - 1));
          return;
        }
        if (e.code === 'Enter') {
          if (indexRef.current !== undefined && usersRef.current?.[indexRef.current]) {
            props.onPickUser(usersRef.current?.[indexRef.current]);
            setIndex(-1);
          }
          return;
        }
      }
    };
    document.addEventListener('keyup', keyDownHandler);
    return () => {
      document.removeEventListener('keyup', keyDownHandler);
    };
  }, []);

  return (
    <div>
      {props.visible && filteredUsers.length ? (
        <div
          className={classes}
          ref={suggestRef}
          style={{
            bottom: `calc(100% - ${props.position.y}px)`,
            left: props.position.x,
            ...style,
          }}
        >
          <div className={listCls}>
            {/* {filteredUsers.length ? '' : '无搜索结果'} */}
            {filteredUsers.map((user, i) => {
              return (
                <div
                  style={{ userSelect: 'none' }}
                  key={user.userId}
                  data-idx={i}
                  className={i === index ? `active ${prefixCls}-item` : `${prefixCls}-item`}
                  onMouseEnter={onMouseEnter}
                  onMouseDown={isSafariVersionGreaterThan17() ? onClick : () => {}}
                  onClick={isSafariVersionGreaterThan17() ? () => {} : onClick}
                >
                  <div className="avatar" style={{ userSelect: 'none' }}>
                    <Avatar src={getAppUserInfo(user.userId).avatarurl} size="small">
                      {user.role === null && user.userId === AT_ALL ? (
                        <Icon
                          type="MEMBER_GROUP"
                          style={{ verticalAlign: 'sub', width: '15px', height: '15px' }}
                        ></Icon>
                      ) : (
                        getGroupMemberNickName(user)
                      )}
                    </Avatar>
                  </div>
                  <div className="name">{getGroupMemberNickName(user)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default observer(SuggestList);
