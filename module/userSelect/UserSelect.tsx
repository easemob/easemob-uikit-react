import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import List from '../../component/list';
import Avatar from '../../component/avatar';
import Icon from '../../component/icon';
import Button from '../../component/button';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { useParentName } from '../hooks/dom';
import Input from '../../component/input';
import Header from '../header';
import { RootContext } from '../store/rootContext';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import UserItem, { UserInfoData } from '../../component/userItem';
import rootStore from '../store/index';
import Modal, { ModalProps } from '../../component/modal';
import { ContactList } from '../contactList';
import { use } from 'i18next';

export interface UserSelectProps extends ModalProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  onUserSelect?: (
    user: UserSelectInfo & { type: 'add' | 'delete' },
    userArr: UserSelectInfo[],
  ) => void;
  enableMultipleSelection?: boolean;
  selectedPanelHeader?: React.ReactNode;
  selectedPanelFooter?: React.ReactNode;
}

export interface UserSelectInfo {
  avatarUrl?: string;
  nickname?: string;
  userId: string;
}

const UserSelect: React.FC<UserSelectProps> = props => {
  const {
    onUserSelect,
    prefix,
    className,
    style,
    title = '',
    footer = '',
    closable = false,
    open,
    enableMultipleSelection,
    selectedPanelHeader,
    selectedPanelFooter,
    onCancel,
    onOk,
    ...others
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('user-select', prefix);
  const context = useContext(RootContext);
  const { rootStore, theme, features } = context;
  const { addressStore } = rootStore;
  const themeMode = theme?.mode || 'light';
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const [modalOpen, setModalOpen] = useState(open);
  const [selectedUsers, setSelectedUsers] = useState<UserInfoData[]>([]);

  const handleSelect = (checked: boolean, userInfo: UserInfoData) => {
    // enableMultipleSelection 参数控制是不是可以多选
    if (checked) {
      if (!enableMultipleSelection) {
        setSelectedUsers(value => [userInfo]);
        onUserSelect?.(
          {
            ...userInfo,
            type: 'add',
          },
          [userInfo],
        );
        return;
      }
      setSelectedUsers(value => {
        onUserSelect?.(
          {
            ...userInfo,
            type: 'add',
          },
          [...value, userInfo],
        );
        return [...value, userInfo];
      });
    } else {
      if (!enableMultipleSelection) {
        setSelectedUsers([]);
        onUserSelect?.(
          {
            ...userInfo,
            type: 'delete',
          },
          [],
        );
        return;
      }
      setSelectedUsers(value => {
        const userArr = value.filter(user => {
          return user.userId !== userInfo.userId;
        });
        onUserSelect?.(
          {
            ...userInfo,
            type: 'delete',
          },
          userArr,
        );
        return userArr;
      });
    }
  };
  const handleItemClose = (userInfo: UserInfoData) => {
    setSelectedUsers(value => {
      const userArr = value.filter(user => {
        return user.userId !== userInfo.userId;
      });
      onUserSelect?.(
        {
          ...userInfo,
          type: 'delete',
        },
        userArr,
      );
      return userArr;
    });
  };

  const checkedList = selectedUsers.map(user => ({
    id: user.userId,
    type: 'contact' as 'contact',
  }));

  const createGroup = () => {
    console.log('createGroup');
    //addressStore.createGroup(selectedUsers.map(user => user.userId));
    // onUserSelect(group);
    setModalOpen(false);
  };
  return (
    <Modal
      open={open}
      width={720}
      title={title}
      footer={footer}
      bodyStyle={{ padding: 0 }}
      closable={closable}
      onCancel={e => {
        onCancel?.(e);
      }}
      {...others}
    >
      <div className={classString}>
        <div>
          <ContactList
            onCheckboxChange={handleSelect}
            checkable
            menu={['contacts']}
            hasMenu={false}
            header={<></>}
            checkedList={checkedList}
          ></ContactList>
        </div>
        <div className={`${prefixCls}-container`}>
          {selectedPanelHeader ? (
            <div className={`${prefixCls}-header`}>{selectedPanelHeader}</div>
          ) : (
            <div className={`${prefixCls}-header`}>{`已选群成员（${selectedUsers.length}）`}</div>
          )}

          <div className={`${prefixCls}-body`}>
            {selectedUsers.map(user => {
              return (
                <UserItem
                  key={user.userId}
                  data={user}
                  // onCheckboxChange={handleSelect}
                  checked
                  closeable
                  onClose={handleItemClose}
                ></UserItem>
              );
            })}
          </div>
          {selectedPanelFooter ? (
            <div className={`${prefixCls}-footer`}>{selectedPanelFooter}</div>
          ) : (
            <div className={`${prefixCls}-footer`}>
              {/* <Button type="primary" style={{ width: '68px' }} onClick={createGroup}>
                确定
              </Button> */}
              <div>
                <Button
                  style={{ marginRight: '24px', width: '68px' }}
                  type="primary"
                  onClick={e => {
                    createGroup();
                    onOk?.(e);
                  }}
                  disabled={selectedUsers.length === 0}
                >
                  确定
                </Button>
                <Button
                  style={{ width: '68px' }}
                  type="default"
                  onClick={e => {
                    onCancel?.(e);
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UserSelect;
