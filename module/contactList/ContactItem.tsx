import React, { FC, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import Avatar from '../../component/avatar';
import UserItem, { UserInfoData } from '../../component/userItem';
import rootStore from '../store/index';
import { RootContext } from '../store/rootContext';
export interface ContactItemProps {
  contactId: string;
  className?: string;
  prefix?: string;
  avatarShape?: 'circle' | 'square';
  avatarSize?: number;
  focus?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>, contactId: string) => void;
  children?: ReactNode;
  style?: React.CSSProperties;
  isActive?: boolean;
  data: any;
  selectedId?: string;
  checkable?: boolean;
  checkedUserList?: string[];
  defaultCheckedList?: string[];
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
}

const ContactItem: FC<ContactItemProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    avatarShape = 'circle',
    avatarSize = 50,
    onClick,
    isActive = false,
    contactId,
    children,
    data,
    selectedId,
    checkable,
    checkedUserList,
    defaultCheckedList,
    onCheckboxChange,
    ...others
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactItem', customizePrefixCls);
  const context = useContext(RootContext);
  const { rootStore, theme, features } = context;
  const themeMode = theme?.mode || 'light';

  const classString = classNames(prefixCls, className);
  const { addressStore } = rootStore;
  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, contactId: string) => {
    onClick && onClick(e, contactId);
  };

  const tagClass = classNames(`${prefixCls}-tag`, {
    [`${prefixCls}-${themeMode}`]: !!themeMode,
  });

  const handleCheckboxChange = (checked: boolean, data: UserInfoData) => {
    onCheckboxChange && onCheckboxChange(checked, data);
  };
  return (
    <>
      <div className={tagClass}>{data.region}</div>
      {data.brands?.map((item: any) => {
        return (
          <div
            className={`${classString} ${
              selectedId == item.brandId ? `${prefixCls}-selected` : ''
            }`}
            onClick={e => {
              handleClick(e, item.brandId);
            }}
            style={others.style}
            key={item.brandId}
          >
            <UserItem
              checked={
                (checkedUserList && checkedUserList.includes(item.brandId)) ||
                (defaultCheckedList && defaultCheckedList.includes(item.brandId))
              }
              disabled={defaultCheckedList && defaultCheckedList.includes(item.brandId)}
              nickname={item.name}
              data={{
                userId: item.brandId,
                nickname: item.name,
                avatarUrl: addressStore.appUsersInfo[item.brandId]?.avatarurl || '',
              }}
              selected={selectedId == item.brandId}
              checkable={checkable}
              onCheckboxChange={handleCheckboxChange}
            ></UserItem>
          </div>
        );
      })}
    </>
  );
};

export { ContactItem };
