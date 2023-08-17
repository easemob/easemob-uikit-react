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

export const AT_ALL = 'ALL';

const searchUser = (memberList: MemberItem[], queryString?: string) => {
  return queryString
    ? memberList.filter(user => {
        return getGroupMemberNickName(user).startsWith(queryString);
      })
    : memberList.slice(0);
};

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  queryString?: string;
  className?: string;
  onPickUser: (user: MemberItem) => void;
  onHide: () => void;
  onShow: () => void;
}

const SuggestList: FC<Props> = props => {
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('suggest');
  const listCls = getPrefixCls('suggest-list');
  const classes = classNames(prefixCls, props.className);
  const [index, setIndex] = useState(-1);
  const usersRef = useRef<MemberItem[]>();
  const suggestRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<number>();
  indexRef.current = index;
  const visibleRef = useRef<boolean>();
  visibleRef.current = props.visible;
  let currentCVS = getStore().messageStore.currentCVS;
  const memberList = getGroupItemFromGroupsById(currentCVS.conversationId)?.members || [];

  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    //@ts-ignore
    setIndex(Number(e.target.dataset.idx));
  };

  const onClick = () => {
    if (indexRef.current !== undefined && usersRef.current?.[indexRef.current]) {
      props.onPickUser(usersRef.current?.[indexRef.current]);
      setIndex(-1);
    }
  };

  const AT_ALL_ITEM = {
    userId: AT_ALL,
    role: null,
    attributes: {
      nickName: t('module.atAll'),
    },
  } as any;

  const filteredUsers = useMemo(() => {
    return searchUser([AT_ALL_ITEM, ...memberList], props.queryString);
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
          }}
        >
          <div className={listCls}>
            {/* {filteredUsers.length ? '' : '无搜索结果'} */}
            {filteredUsers.map((user, i) => {
              return (
                <div
                  key={user.userId}
                  data-idx={i}
                  className={i === index ? `active ${prefixCls}-item` : `${prefixCls}-item`}
                  onMouseEnter={onMouseEnter}
                  onClick={onClick}
                >
                  <div className="avatar">
                    <Avatar src={getAppUserInfo(user.userId).avatarurl} size="small">
                      {getGroupMemberNickName(user)}
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
