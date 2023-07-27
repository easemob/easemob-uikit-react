import React, { FC, useEffect, useState, useRef } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../../component/config/index';
import './style/style.scss';

type User = { name: string; id: string };
const mockData = [
  {
    name: '张一鸣',
    id: 'zhangyiming',
  },
  {
    name: '张一鸣',
    id: 'whatthehell',
  },
  {
    name: '马化腾',
    id: 'ponyma',
  },
  {
    name: '马云',
    id: 'jackmasb',
  },
];
const searchUser = (queryString?: string) => {
  return queryString
    ? mockData.filter(({ name }) => name.startsWith(queryString))
    : mockData.slice(0);
};

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  queryString?: string;
  className?: string;
  onPickUser: (user: User) => void;
  onHide: () => void;
  onShow: () => void;
}

const SuggestList: FC<Props> = props => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('suggest-list');
  const classes = classNames(prefixCls, props.className);
  const [users, setUsers] = useState<User[]>([]);
  const [index, setIndex] = useState(-1);
  const usersRef = useRef<{ id: string; name: string }[]>();
  usersRef.current = users;
  const suggestRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<number>();
  indexRef.current = index;
  const visibleRef = useRef<boolean>();
  visibleRef.current = props.visible;

  useEffect(() => {
    const filteredUsers = searchUser(props.queryString);
    setUsers(filteredUsers);
    setIndex(0);
    if (!filteredUsers.length) {
      props.onHide();
    }
  }, [props.queryString]);

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
            marginTop: `-${suggestRef?.current?.clientHeight}px`,
            visibility: suggestRef?.current ? 'unset' : 'hidden',
          }}
        >
          {users.length ? '' : '无搜索结果'}
          {users.map((user, i) => {
            return (
              <div key={user.id} className={i === index ? 'active item' : 'item'}>
                <div className="name">{user.name}</div>
                <div className="id">{user.id}</div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
};

export { SuggestList };
