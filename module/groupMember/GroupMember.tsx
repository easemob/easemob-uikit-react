import React, { FC, useEffect, useRef, useState, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import List from '../../component/list';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import Icon from '../../component/icon';
import { useParentName } from '../hooks/dom';
import { useSize } from 'ahooks';
import { Search } from '../../component/input/Search';
import Header, { HeaderProps } from '../header';
import { RootContext } from '../store/rootContext';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import UserItem, { UserInfoData, UserItemProps } from '../../component/userItem';
import rootStore from '../store/index';
import { checkCharacter } from '../utils/index';
import UserSelect, { UserSelectInfo } from '../userSelect';
import Button from '../../component/button';
import { useTranslation } from 'react-i18next';
export interface GroupMemberProps extends UserItemProps {
  style?: React.CSSProperties;
  className?: string;
  prefix?: string;
  headerProps?: HeaderProps;
  onItemClick?: (info: { id: string; type: 'contact' | 'group'; name: string }) => void;
  checkable?: boolean; // 是否显示checkbox
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
  groupMembers: any;
  onPrivateChat?: (userId: string) => void | boolean;
  onAddContact?: (userId: string) => void | boolean;
  onClickBack?: () => void;
  groupId: string;
  isOwner?: boolean;
  onUserSelect?: (
    user: UserSelectInfo & { type: 'add' | 'delete' },
    users: UserSelectInfo[],
  ) => void;
  enableMultipleSelection?: boolean;
  checkedUsers?: UserInfoData[];
}

const GroupMember: FC<GroupMemberProps> = props => {
  const {
    style,
    className,
    prefix,
    onItemClick,
    checkable,
    groupMembers,
    onPrivateChat,
    onAddContact,
    onClickBack,
    groupId,
    onUserSelect,
    enableMultipleSelection,
    isOwner = true,
    headerProps,
    moreAction,
    checkedUsers,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('group-member', prefix);
  const context = React.useContext(RootContext);
  const { rootStore, theme, features } = context;
  const { addressStore, conversationStore } = rootStore;
  const themeMode = theme?.mode || 'light';
  const { t } = useTranslation();
  useContacts();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const groupData = rootStore.addressStore.groups.find(item => item.groupid == groupId);

  const privateChat = (userId: string) => {
    console.log('privateChat', userId);
    const result = onPrivateChat?.(userId);
    if (result == false) return;
    let name = addressStore.appUsersInfo?.[userId]?.nickname;
    conversationStore.addConversation({
      chatType: 'singleChat',
      conversationId: userId,
      name: name,
      lastMessage: {
        time: Date.now(),
        type: 'txt',
        msg: '',
        id: '',
        chatType: 'singleChat',
        to: userId,
      },
      unreadCount: 0,
    });
    conversationStore.setCurrentCvs({
      chatType: 'singleChat',
      conversationId: userId,
      name: name,
    });
    onPrivateChat?.(userId);
  };

  const addContact = (userId: string) => {
    console.log('addContact', userId);
    const result = onAddContact?.(userId);
    if (result == false) return;
    rootStore.addressStore.addContact(userId);
  };

  const addGroupMember = () => {
    console.log('addGroupMember');
    if (addMemberData.type == 'add') {
      const userIds = selectedUsers.map(item => item.userId);
      rootStore.addressStore.inviteToGroup(groupId, userIds);
    } else {
      const userIds = selectedUsers.map(item => item.userId);
      rootStore.addressStore.removeGroupMembers(groupId, userIds);
    }
    setAddMemberData({
      ...addMemberData,
      open: false,
    });
  };
  const deleteGroupMember = () => {
    console.log('groupMembers', groupMembers, groupData);
    const users = groupMembers.map((item: any) => {
      return {
        userId: item.userId,
        nickname: addressStore.appUsersInfo?.[item.userId]?.nickname,
        avatar: addressStore.appUsersInfo?.[item.userId]?.avatarurl,
      };
    });
    setAddMemberData({
      title: t('removeGroupMembers'),
      users: users,
      type: 'delete',
      open: true,
    });
    // removeGroupMembers
    // rootStore.addressStore.inviteToGroup(groupId, groupId);
  };

  const [addMemberData, setAddMemberData] = useState({
    title: '添加群成员',
    users: [],
    type: 'add',
    open: false,
  });

  const [selectedUsers, setSelectedUsers] = useState<UserInfoData[]>([]);

  const [selectedUsersOut, setSelectedUsersOut] = useState<UserInfoData[]>([]);
  const handleSelect = (checked: boolean, userInfo: UserInfoData) => {
    // enableMultipleSelection 参数控制是不是可以多选
    if (checked) {
      if (!enableMultipleSelection) {
        setSelectedUsersOut(value => [userInfo]);
        onUserSelect?.(
          {
            ...userInfo,
            type: 'add',
          },
          [userInfo],
        );
        return;
      }
      setSelectedUsersOut(value => {
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
        setSelectedUsersOut([]);
        onUserSelect?.(
          {
            ...userInfo,
            type: 'delete',
          },
          [],
        );
        return;
      }
      setSelectedUsersOut(value => {
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

  // 给groupMember 加上 isInContact属性
  const renderData =
    groupMembers?.map((item: any) => {
      let renderItem = { ...item };
      renderItem.isInContact = addressStore.contacts.some((contact: any) => {
        return contact.userId === item.userId;
      });
      return renderItem;
    }) || [];

  return (
    <div className={classString} style={{ ...style }}>
      <Header
        avatar={<></>}
        back
        content={t('groupMembers')}
        onClickBack={onClickBack}
        suffixIcon={
          isOwner ? (
            <div>
              <Icon
                type="PERSON_ADD"
                style={{
                  padding: '6px',
                  margin: '2px',
                  width: '24px',
                  height: '24px',
                }}
                onClick={() => {
                  setAddMemberData({
                    title: t('addGroupMembers'),
                    users: [],
                    type: 'add',
                    open: true,
                  });
                }}
              ></Icon>
              <Icon
                type="PERSON_MINUS"
                style={{
                  padding: '6px',
                  margin: '2px',
                  width: '24px',
                  height: '24px',
                }}
                onClick={deleteGroupMember}
              ></Icon>
            </div>
          ) : null
        }
        {...headerProps}
      ></Header>
      <div className={`${prefixCls}-container`}>
        {renderData?.map((item: any) => {
          let name = addressStore.appUsersInfo?.[item.userId]?.nickname;
          const avatarUrl = addressStore.appUsersInfo?.[item.userId]?.avatarurl;
          if (item.attributes?.nickName) {
            name = item.attributes?.nickName;
          }
          const contactData = addressStore.contacts.find((contact: any) => {
            return contact.userId === item.userId;
          });

          if (contactData && contactData.remark) {
            name = contactData.remark;
          }
          return (
            <UserItem
              avatarShape={theme?.avatarShape}
              key={item.userId}
              data={{ userId: item.userId, nickname: name, avatarUrl: avatarUrl }}
              checkable={checkable}
              disabled={checkedUsers?.some(item2 => item2.userId == item.userId)}
              checked={
                (selectedUsersOut &&
                  selectedUsersOut.map(item2 => item2.userId).includes(item.userId)) ||
                checkedUsers?.some(item2 => item2.userId == item.userId)
              }
              onCheckboxChange={handleSelect}
              moreAction={
                moreAction ||
                (item.userId == rootStore.client.user
                  ? undefined
                  : {
                      visible: true,
                      icon: <Icon type="ELLIPSIS" color="#33B1FF" height={20}></Icon>,
                      actions: [
                        {
                          content: item.isInContact ? t('privateChat') : t('addGroupMembers'),
                          onClick: () => {
                            item.isInContact ? privateChat(item.userId) : addContact(item.userId);
                          },
                        },
                      ],
                    })
              }
            ></UserItem>
          );
        })}
      </div>

      <UserSelect
        title={addMemberData.title}
        selectedPanelHeader={<></>}
        onCancel={() => {
          setAddMemberData({
            ...addMemberData,
            open: false,
          });
        }}
        selectedPanelFooter={
          <div>
            <Button
              style={{ marginRight: '24px', width: '68px' }}
              type="primary"
              onClick={() => {
                addGroupMember();
              }}
              disabled={selectedUsers.length === 0}
            >
              {t('confirmBtn')}
            </Button>
            <Button
              style={{ width: '68px' }}
              type="default"
              onClick={() => {
                setAddMemberData({
                  ...addMemberData,
                  open: false,
                });
              }}
            >
              {t('cancelBtn')}
            </Button>
          </div>
        }
        closable={true}
        enableMultipleSelection={true}
        open={addMemberData.open}
        onUserSelect={(user, users) => {
          console.log('onUserSelect', user, users);
          setSelectedUsers(users);
        }}
        users={addMemberData.users}
        checkedUsers={
          addMemberData.type == 'add'
            ? groupMembers
            : [
                {
                  userId: rootStore.client.user,
                },
              ]
        }
      />
    </div>
  );
};

export default observer(GroupMember);
