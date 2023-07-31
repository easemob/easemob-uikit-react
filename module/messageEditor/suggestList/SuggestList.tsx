import React, { FC, useEffect, useState, useRef, useMemo } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
import { getStore } from '../../store';
import './style/style.scss';
import { MemberItem } from '../../store/AddressStore';
import { getGroupItemFromGroupsById, getGroupMemberNickName } from '../../utils';
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
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('suggest-list');
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
  const filteredUsers = useMemo(() => {
    return searchUser(memberList, props.queryString);
  }, [memberList, props.queryString]);
  usersRef.current = filteredUsers;
  
  useEffect(() => {
    setIndex(0);
    if (!filteredUsers.length) {
      props.onHide();
    }
  }, [filteredUsers]);

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
    <>
      {props.visible ? (
        <div
          className={classes}
          ref={suggestRef}
          style={{
            top: props.position.y,
            left: props.position.x,
          }}
        >
          {/* {filteredUsers.length ? '' : '无搜索结果'} */}
          {filteredUsers.map((user, i) => {
            return (
              <div key={user.userId} className={i === index ? 'active item' : 'item'}>
                <div className="name">{getGroupMemberNickName(user)}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};

export { SuggestList };
