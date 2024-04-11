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
import { useTranslation } from 'react-i18next';
export interface UserSelectProps extends ModalProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  onUserSelect?: (
    user: UserSelectInfo & { type: 'add' | 'delete' },
    userArr: UserSelectInfo[],
  ) => void;
  enableMultipleSelection?: boolean; // 参数控制是不是可以多选,false 为单选
  selectedPanelHeader?: React.ReactNode;
  selectedPanelFooter?: React.ReactNode;
  users?: UserSelectInfo[];
  checkedUsers?: UserSelectInfo[];
  disableUserIds?: string[];
  disabled?: boolean;
  searchPlaceholder?: string;
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
    users,
    checkedUsers,
    disabled,
    disableUserIds,
    searchPlaceholder,
    ...others
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('user-select', prefix);
  const context = useContext(RootContext);
  const { rootStore, theme, features } = context;
  const { addressStore } = rootStore;
  const themeMode = theme?.mode || 'light';
  const { t } = useTranslation();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );
  const [modalOpen, setModalOpen] = useState(open);
  const [selectedUsers, setSelectedUsers] = useState<UserInfoData[]>([]);
  useEffect(() => {
    if (!open) {
      setSelectedUsers([]);
    }
  }, [open]);
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
    name: user.nickname,
  }));

  // 如果传了users 则左面的panel使用users的数据渲染， 没传的话展示ContactList
  const defaultCheckedUsers = checkedUsers?.map(user => ({
    type: 'contact' as 'contact',
    id: user.userId,
  }));
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
        <div className={`${prefixCls}-container-left`}>
          {users && users.length > 0 ? (
            users.map(item => {
              return (
                <UserItem
                  avatarShape={theme?.avatarShape}
                  key={item.userId}
                  data={item}
                  onCheckboxChange={handleSelect}
                  checkable
                  disabled={
                    checkedUsers?.some(item2 => item2.userId == item.userId) ||
                    disabled ||
                    disableUserIds?.includes(item.userId)
                  }
                  checked={
                    (checkedList && checkedList.map(item => item.id).includes(item.userId)) ||
                    checkedUsers?.some(item2 => item2.userId == item.userId)
                  }
                  onClick={e => {
                    e.preventDefault();
                    // 如果 disabled 为true 则不触发点击事件
                    if (
                      checkedUsers?.some(item2 => item2.userId == item.userId) ||
                      disabled ||
                      disableUserIds?.includes(item.userId)
                    ) {
                      return;
                    }
                    handleSelect(!checkedList.map(item => item.id).includes(item.userId), item);
                  }}
                ></UserItem>
              );
            })
          ) : (
            //  左侧待选择的人，直接使用联系人列表
            <ContactList
              searchPlaceholder={searchPlaceholder}
              searchInputStyle={themeMode == 'dark' ? { backgroundColor: '#464E53' } : {}}
              style={themeMode == 'dark' ? { backgroundColor: '#2F3437' } : {}}
              onCheckboxChange={handleSelect}
              onItemClick={data => {
                const disabled = defaultCheckedUsers?.find(item => item.id === data.id);
                if (disabled) return;
                const found = checkedList.find(item => item.id === data.id);
                if (found) {
                  handleSelect(false, {
                    userId: data.id,
                    nickname: data.name,
                    avatarUrl: addressStore.appUsersInfo[data.id]?.avatarurl,
                  });
                } else {
                  handleSelect(true, {
                    userId: data.id,
                    nickname: data.name,
                    avatarUrl: addressStore.appUsersInfo[data.id]?.avatarurl,
                  });
                }
              }}
              checkable
              menu={['contacts']}
              hasMenu={false}
              header={<></>}
              checkedList={checkedList}
              defaultCheckedList={defaultCheckedUsers || []}
            ></ContactList>
          )}
        </div>
        <div className={`${prefixCls}-container`}>
          {selectedPanelHeader ? (
            <div className={`${prefixCls}-header`}>{selectedPanelHeader}</div>
          ) : (
            <div className={`${prefixCls}-header`}>{`${t('Selected group members')}（${
              selectedUsers.length
            }）`}</div>
          )}
          {/** 右侧已经选出来的人 */}
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
                  onClick={data => {
                    handleItemClose(user);
                  }}
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
                    onOk?.(e);
                  }}
                  disabled={selectedUsers.length === 0}
                >
                  {others?.okText || t('confirmBtn')}
                </Button>
                <Button
                  style={{ width: '68px' }}
                  type="default"
                  onClick={e => {
                    onCancel?.(e);
                  }}
                >
                  {others.cancelText || t('cancelBtn')}
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
