import React, { FC, useEffect, useRef, useState, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { ContactItem } from './ContactItem';
import List from '../../component/list';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { useSize } from 'ahooks';
import { Search } from '../../component/input/Search';
import Header from '../header';
import { ContactGroup } from './ContactGroup';
import { RootContext } from '../store/rootContext';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import UserItem, { UserInfoData } from '../../component/userItem';
import { pinyin } from 'pinyin-pro';
import rootStore from '../store/index';
import { checkCharacter } from '../utils/index';
import { useTranslation } from 'react-i18next';
// pinyin('汉语拼音', { toneType: 'none' }); // "han yu pin yin"
export interface ContactListProps {
  style?: React.CSSProperties;
  className?: string;
  prefix?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean;
  onItemClick?: (info: { id: string; type: 'contact' | 'group' | 'request'; name: string }) => void;
  menu?: (
    | 'contacts'
    | 'groups'
    | 'requests'
    | {
        title: string;
        data: ({ remark?: string; userId: string } | { groupname: string; groupid: string })[];
      }
  )[];
  hasMenu?: boolean; // 是否显示分类的menu, 默认值true, 只有menu中只有一个条目时才能设置false
  checkable?: boolean; // 是否显示checkbox
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
  header?: React.ReactNode;
  checkedList?: { id: string; type: 'contact' | 'group'; name?: string }[];
  defaultCheckedList?: { id: string; type: 'contact' | 'group'; name?: string }[];
  searchStyle?: React.CSSProperties;
  searchInputStyle?: React.CSSProperties;
  searchPlaceholder?: string;
}

function getBrands(members: any) {
  if (members.length === 0) return [];
  const innerMembers = members.concat();
  innerMembers.forEach((item: any) => {
    item.name = item.userId
      ? item.remark || rootStore.addressStore.appUsersInfo[item.userId]?.nickname || item.userId
      : item.groupname;
    item.userId && (item.nickname = item.name);
    item.avatarUrl = item.avatarUrl; //群组有avatarUrl
    if (checkCharacter(item.name.substring(0, 1)) == 'en') {
      item.initial = item.name.substring(0, 1).toUpperCase();
    } else if (checkCharacter(item.name.substring(0, 1)) == 'zh') {
      item.initial = pinyin(item.name.substring(0, 1), { toneType: 'none' })[0][0].toUpperCase();
    } else {
      item.initial = '#';
    }
  });

  innerMembers.sort((a: any, b: any) => a.initial.charCodeAt(0) - b.initial.charCodeAt(0));
  let someTitle = null;
  let someArr: Array<{
    id: number;
    region: string;
    brands: Array<{
      brandId: string;
      name: string;
    }>;
  }> = [];

  let lastObj;
  let newObj;

  for (var i = 0; i < innerMembers.length; i++) {
    var newBrands = {
      brandId: innerMembers[i].userId || innerMembers[i].groupid,
      name: innerMembers[i].name,
      avatarUrl:
        innerMembers[i].avatarUrl ||
        rootStore.addressStore.appUsersInfo[innerMembers[i].userId]?.avatarurl,
    };

    if (innerMembers[i].initial === '#') {
      if (!lastObj) {
        lastObj = {
          id: i,
          region: '#',
          brands: [] as any,
        };
      }
      lastObj.brands.push(newBrands);
    } else {
      if (innerMembers[i].initial !== someTitle) {
        someTitle = innerMembers[i].initial;
        newObj = {
          id: i,
          region: someTitle,
          brands: [] as any,
        };
        someArr.push(newObj);
      }
      newObj?.brands.push(newBrands);
    }
  }
  someArr.sort((a, b) => a.region.charCodeAt(0) - b.region.charCodeAt(0));
  if (lastObj) {
    someArr.push(lastObj);
  }
  // someArr.forEach((item) => {
  // 	item.brands.forEach((val) => {
  // 		presenceList.length &&
  // 			presenceList.forEach((innerItem) => {
  // 				if (val.name === innerItem.uid) {
  // 					val.presence = innerItem;
  // 				}
  // 			});
  // 	});
  // });
  return someArr;
}

let ContactList: FC<ContactListProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    onSearch,
    onItemClick,
    menu = ['requests', 'groups', 'contacts'],
    style,
    hasMenu = false,
    checkable = false,
    onCheckboxChange,
    header,
    checkedList,
    defaultCheckedList,
    searchStyle,
    searchInputStyle,
    searchPlaceholder,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactList', customizePrefixCls);

  const [addressNode, setAddressNode] = useState<JSX.Element[]>([]);
  const { t } = useTranslation();
  const context = useContext(RootContext);
  const { rootStore, theme, features, initConfig } = context;
  const { useUserInfo: useUserInfoConfig } = initConfig;
  const themeMode = theme?.mode || 'light';
  const { addressStore } = rootStore;
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  // 获取联系人列表
  useContacts();
  if (useUserInfoConfig) {
    useUserInfo('contacts');
  }

  const { getJoinedGroupList } = useGroups();
  getJoinedGroupList();

  const [itemActiveKey, setItemActiveKey] = useState('');

  const [isSearch, setIsSearch] = useState(false);

  const handleCheckboxChange = (checked: boolean, data: UserInfoData) => {
    onCheckboxChange?.(checked, data);
  };
  // 渲染联系人列表
  useEffect(() => {
    let renderData: { contacts: any; groups: any; newRequests: any } & Record<string, any> =
      {} as any;

    menu.forEach(item => {
      if (item == 'requests') {
        renderData.newRequests = [];
      } else if (item == 'contacts' || item == 'groups') {
        renderData[item] = undefined;
      } else {
        renderData[item.title] = item.data;
      }
    });
    menu.forEach(item => {
      if (item == 'contacts') {
        renderData.contacts = getBrands(addressStore.contacts);
      } else if (item == 'groups') {
        renderData.groups = getBrands(addressStore.groups);
      } else if (item == 'requests') {
        renderData.newRequests = addressStore.requests;
      } else {
        renderData[item.title] = getBrands(item.data);
      }
    });
    let menuNode = Object.keys(renderData).map((menuItem, index2) => {
      let contacts = renderData[menuItem as 'contacts' | 'groups']?.map((contactItem: any) => {
        return (
          <ContactItem
            checkedUserList={checkedList && checkedList.map(item => item.id)}
            defaultCheckedList={defaultCheckedList && defaultCheckedList.map(item => item.id)}
            data={contactItem}
            contactId={contactItem.region}
            onClick={(e, contactId) => {
              e.preventDefault();
              const info = getNameAndType(contactId);
              onItemClick?.({
                id: contactId,
                type: info.type,
                name: info.name,
              });
              setItemActiveKey(contactId);
            }}
            key={contactItem.region}
            selectedId={itemActiveKey}
            checkable={checkable}
            onCheckboxChange={handleCheckboxChange}
          >
            {/* {name || id} */}
          </ContactItem>
        );
      });

      if (menuItem == 'newRequests') {
        const unreadCount =
          addressStore.requests.filter(item => item.requestStatus == 'pending').length || 0;
        return (
          <ContactGroup
            title={t('newRequests') as string}
            key={menuItem}
            itemCount={addressStore.requests.length}
            unreadCount={unreadCount}
            itemHeight={84}
            hasMenu={hasMenu || menu.length !== 1}
            highlightUnread
          >
            <div>
              {addressStore.requests?.map((item, index: number) => {
                const name = addressStore.appUsersInfo[item.from]?.nickname || item.from;
                return (
                  <UserItem
                    key={item.from}
                    data={{
                      avatarUrl: addressStore.appUsersInfo[item.from]?.avatarurl,
                      nickname: name,
                      userId: item.from,
                      description: t('requestToAddContact') as string,
                    }}
                    onClick={e => {
                      setItemActiveKey(item.from);
                      addressStore.readContactInvite(item.from);
                      onItemClick?.({
                        id: item.from,
                        type: 'request',
                        name: name,
                      });
                    }}
                    selected={itemActiveKey == item.from}
                  />
                );
              })}
            </div>
          </ContactGroup>
        );
      }
      if (!contacts) return <div key="no"></div>;

      return (
        <ContactGroup
          title={t(menuItem) as string}
          key={menuItem}
          unreadCount={
            menuItem == 'contacts' ? addressStore.contacts.length : addressStore.groups.length
          }
          itemCount={
            menuItem == 'contacts' ? addressStore.contacts.length : addressStore.groups.length
          }
          itemHeight={74}
          hasMenu={hasMenu || menu.length !== 1}
        >
          {contacts}
        </ContactGroup>
      );
    });

    setAddressNode(menuNode);
  }, [
    itemActiveKey,
    addressStore.contacts,
    addressStore.groups,
    addressStore.appUsersInfo,
    addressStore.requests,
    checkedList,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const returnValue = onSearch?.(e);
    if (returnValue === false) return;
    const contactSearchList =
      (menu.includes('contacts') &&
        addressStore.contacts.filter(
          (user: { userId: string | string[]; nickname: string | string[] }) => {
            if (user.nickname.includes(value)) {
              return true;
            }
            return false;
          },
        )) ||
      [];

    const groupSearchList =
      (menu.includes('groups') &&
        addressStore.groups.filter(
          (group: { groupid: string | string[]; groupname: string | string[] }) => {
            if (group.groupname.includes(value)) {
              return true;
            }
            return false;
          },
        )) ||
      [];

    setIsSearch(value.length > 0 ? true : false);

    addressStore.setSearchList(contactSearchList.concat(groupSearchList as any));
  };

  const [searchNode, setSearchNode] = useState<JSX.Element[]>();

  // 渲染搜索列表
  useEffect(() => {
    const searchList = addressStore.searchList.map(
      (item: { userId: any; groupid: any; nickname: any; groupname: any }) => {
        const id = item.userId || item.groupid;
        const name = item.nickname || item.groupname;
        const data = {
          userId: id,
          nickname: name,
        };
        return (
          <UserItem
            checked={checkedList && checkedList.map(item => item.id).includes(id)}
            onClick={e => {
              setItemActiveKey(id);
              onItemClick?.({
                id: id,
                type: item.userId ? 'contact' : 'group',
                name: name,
              });
            }}
            data={data}
            key={id}
            selected={itemActiveKey == item.userId}
            checkable={checkable}
            onCheckboxChange={handleCheckboxChange}
          ></UserItem>
        );
      },
    );

    setSearchNode(searchList);
  }, [addressStore.searchList, itemActiveKey, checkedList?.length, addressStore.appUsersInfo]);

  const getNameAndType = (id: string) => {
    let name;
    let type: 'contact' | 'group' = 'contact';

    const findUser = addressStore.contacts.find(item => item.userId == id);
    if (findUser && findUser.remark) {
      name = findUser.remark;
      type = 'contact';
    } else if (addressStore.appUsersInfo[id]?.nickname) {
      name = addressStore.appUsersInfo[id]?.nickname;
      type = 'contact';
    } else {
      addressStore.groups.forEach(item => {
        if (item.groupid == id) {
          name = item.groupname;
          type = 'group';
        }
      });
    }

    if (!name) {
      name = id;
    }
    return { name, type };
  };

  return (
    <div className={classString} style={{ ...style }}>
      {header ? header : <Header avatar={<></>} content={t('contacts')}></Header>}
      <Search
        placeholder={searchPlaceholder}
        style={{ margin: '0 4px', width: 'auto', ...searchStyle }}
        onChange={handleSearch}
        inputStyle={{ ...searchInputStyle }}
      ></Search>
      <div className={`${prefixCls}-content`}>{isSearch ? searchNode : addressNode}</div>
    </div>
  );
};

ContactList = observer(ContactList);
export { ContactList };
