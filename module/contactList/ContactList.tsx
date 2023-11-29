import React, { FC, useEffect, useRef, useState, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { ContactItem } from './ContactItem';
import List from '../../component/list';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { useParentName } from '../hooks/dom';
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
import ContactDetail from './ContactDetail';
import { ContactRequest } from 'module/store/AddressStore';
// pinyin('汉语拼音', { toneType: 'none' }); // "han yu pin yin"
export interface ContactListProps {
  style?: React.CSSProperties;
  className?: string;
  prefix?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean;
  onItemClick?: (info: { id: string; type: 'contact' | 'group' | 'request'; name: string }) => void;
  menu: ('contacts' | 'groups')[];
  hasMenu?: boolean; // 是否显示分类的menu, 默认值true, 只有menu中只有一个条目时才能设置false
  checkable?: boolean; // 是否显示checkbox
  onCheckboxChange?: (checked: boolean, data: UserInfoData) => void;
  // checkedList?: { id: string; type: 'contact' | 'group'; name?: string }[];
}
// TODO 监听加好友 加群组 更新数据
function getBrands(members: any) {
  if (members.length === 0) return [];
  const innerMembers = members.concat();
  innerMembers.forEach((item: any) => {
    item.name = item.userId
      ? rootStore.addressStore.appUsersInfo[item.userId]?.nickname || item.userId
      : item.groupname;
    console.log('item.name', item.name);
    item.userId && (item.nickname = item.name);
    if (checkCharacter(item.name.substring(0, 1)) == 'en') {
      item.initial = item.name.substring(0, 1).toUpperCase();
    } else if (checkCharacter(item.name.substring(0, 1)) == 'zh') {
      item.initial = pinyin(item.name.substring(0, 1), { toneType: 'none' })[0][0].toUpperCase();
    } else {
      item.initial = '#';
    }
  });

  innerMembers.sort((a: any, b: any) => a.initial.charCodeAt(0) - b.initial.charCodeAt(0));
  console.log('innerMembers', innerMembers);
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
    menu = ['contacts', 'groups', 'requests'],
    style,
    hasMenu = false,
    checkable = false,
    onCheckboxChange,
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactList', customizePrefixCls);

  const [addressNode, setAddressNode] = useState<JSX.Element[]>([]);

  const context = useContext(RootContext);
  const { rootStore, theme, features } = context;
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
  useUserInfo('contacts');
  const { getJoinedGroupList } = useGroups();
  getJoinedGroupList();

  console.log('addressStore.groups', addressStore.groups);

  const [itemActiveKey, setItemActiveKey] = useState('');

  const [isSearch, setIsSearch] = useState(false);

  const handleCheckboxChange = (checked: boolean, data: UserInfoData) => {
    onCheckboxChange?.(checked, data);
  };
  // 渲染联系人列表
  useEffect(() => {
    let renderData: { contacts: any; groups: any; newRequests: ContactRequest[] } = {
      contacts: undefined,
      groups: undefined,
      newRequests: [],
    };
    menu.forEach(item => {
      if (item == 'contacts') {
        renderData.contacts = getBrands(addressStore.contacts);
      } else if (item == 'groups') {
        renderData.groups = getBrands(addressStore.groups);
      } else if (item == 'requests') {
        renderData.newRequests = addressStore.requests;
      }
    });
    let menuNode = Object.keys(renderData).map((menuItem, index2) => {
      let contacts = renderData[menuItem as 'contacts' | 'groups']?.map((contactItem: any) => {
        console.log('---contactItem', contactItem);
        const id = contactItem.brandId;
        const name = contactItem.name;
        return (
          <ContactItem
            data={contactItem}
            contactId={id}
            onClick={(e, contactId) => {
              console.log('点击 item', contactId, id);
              const info = getNameAndType(contactId);
              onItemClick?.({
                id: contactId,
                type: info.type,
                name: info.name,
              });
              setItemActiveKey(contactId);
            }}
            key={id}
            selectedId={itemActiveKey}
            checkable={checkable}
            onCheckboxChange={handleCheckboxChange}
          >
            {name || id}
          </ContactItem>
        );
      });

      if (menuItem == 'newRequests') {
        const unreadCount = addressStore.requests.filter(
          item => item.requestStatus == 'pending',
        ).length;
        return (
          <ContactGroup
            title={menuItem}
            key={menuItem}
            itemCount={unreadCount}
            itemHeight={74}
            hasMenu={hasMenu || menu.length !== 1}
            highlightUnread
          >
            <div>
              {renderData.newRequests.map(item => {
                const name = addressStore.appUsersInfo[item.from]?.nickname || item.from;
                return (
                  <UserItem
                    key={item.from}
                    data={{ nickname: name, userId: item.from, description: '请求添加好友' }}
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
      if (!contacts) return <></>;

      return (
        <ContactGroup
          title={menuItem}
          key={menuItem}
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
    addressStore.requests.length,
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const returnValue = onSearch?.(e);
    if (returnValue === false) return;
    console.log('addressStore.contacts', addressStore.contacts);
    const contactSearchList = addressStore.contacts.filter(
      (user: { userId: string | string[]; nickname: string | string[] }) => {
        if (user.nickname.includes(value)) {
          return true;
        }
        return false;
      },
    );

    const groupSearchList = addressStore.groups.filter(
      (group: { groupid: string | string[]; groupname: string | string[] }) => {
        if (group.groupname.includes(value)) {
          return true;
        }
        return false;
      },
    );

    setIsSearch(value.length > 0 ? true : false);

    addressStore.setSearchList(contactSearchList.concat(groupSearchList as any));
  };

  const [searchNode, setSearchNode] = useState<JSX.Element[]>();

  // 渲染搜索列表
  useEffect(() => {
    console.log('搜做列表', addressStore.searchList);
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
            onClick={e => {
              console.log('点击 item', id);
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
  }, [addressStore.searchList, itemActiveKey]);

  const getNameAndType = useCallback((id: string) => {
    let name;
    let type: 'contact' | 'group' = 'contact';
    if (addressStore.appUsersInfo[itemActiveKey]?.nickname) {
      name = addressStore.appUsersInfo[itemActiveKey]?.nickname;
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
  }, []);

  return (
    <div className={classString} style={{ ...style }}>
      <Header avatar={<></>} content="Contacts List"></Header>
      <Search onChange={handleSearch}></Search>
      <div className={`${prefixCls}-content`}>{isSearch ? searchNode : addressNode}</div>
    </div>
  );
};

ContactList = observer(ContactList);
export { ContactList };
