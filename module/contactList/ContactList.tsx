import React, { FC, useEffect, useRef, useState, useContext } from 'react';
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
import { useContacts, useGroups } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import { StickyContainer } from 'react-sticky';
export interface ContactListProps {
  className?: string;
  prefix?: string;
  data?: {
    group?: Array<{
      groupId: string;
      groupName: string;
    }>;
    chatroom?: Array<{
      chatroomId: string;
      chatroomName: string;
    }>;
    contact?: Array<{
      userId: string;
      nickname: string;
    }>;
  };
  onSearch?: (e: React.ChangeEvent<HTMLInputElement>) => boolean;
}

// function getBrands(members) {
//   const reg = /[a-z]/i;
//   members.forEach(item => {
//     item.name = item.nickname || item.groupName || item.chatroomName || item.name;
//     if (reg.test(item.name.substring(0, 1))) {
//       item.initial = item.name.substring(0, 1).toUpperCase();
//     } else {
//       item.initial = '#';
//     }
//   });

//   members.sort((a, b) => a.initial.charCodeAt(0) - b.initial.charCodeAt(0));

//   let someTitle = null;
//   let someArr: Array<{
//     id: number;
//     region: string;
//     brands: Array<{
//       brandId: string;
//       name: string;
//     }>;
//   }> = [];

//   let lastObj;
//   let newObj;

//   for (var i = 0; i < members.length; i++) {
//     var newBrands = {
//       brandId: members[i].userId || members[i].groupId,
//       name: members[i].nickname || members[i].groupName,
//     };

//     if (members[i].initial === '#') {
//       if (!lastObj) {
//         lastObj = {
//           id: i,
//           region: '#',
//           brands: [],
//         };
//       }
//       lastObj.brands.push(newBrands);
//     } else {
//       if (members[i].initial !== someTitle) {
//         someTitle = members[i].initial;
//         newObj = {
//           id: i,
//           region: someTitle,
//           brands: [],
//         };
//         someArr.push(newObj);
//       }
//       newObj.brands.push(newBrands);
//     }
//   }
//   someArr.sort((a, b) => a.region.charCodeAt(0) - b.region.charCodeAt(0));
//   if (lastObj) {
//     someArr.push(lastObj);
//   }
//   // someArr.forEach((item) => {
//   // 	item.brands.forEach((val) => {
//   // 		presenceList.length &&
//   // 			presenceList.forEach((innerItem) => {
//   // 				if (val.name === innerItem.uid) {
//   // 					val.presence = innerItem;
//   // 				}
//   // 			});
//   // 	});
//   // });
//   return someArr;
// }

let ContactList: FC<ContactListProps> = props => {
  const { prefix: customizePrefixCls, className, onSearch } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactList', customizePrefixCls);

  const classString = classNames(prefixCls, className);
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(0);
  const size = useSize(listRef);

  const [renderItemData, setItemData] = useState({});

  const [addressNode, setAddressNode] = useState<JSX.Element[]>([]);

  const rootStore = useContext(RootContext).rootStore;
  const { addressStore } = rootStore;

  // 获取联系人列表
  const contactsData = useContacts();
  useEffect(() => {
    addressStore.setContacts(contactsData);
  }, [contactsData]);
  
  // 自适应高度
  useEffect(() => {
    const height = listRef.current!.clientHeight;
    setListHeight(height);
  }, [size]);

  //   const groupTag = tagName => {
  //     return <span>{tagName}</span>;
  //   };

  const [activeKey, setActiveKey] = useState<number>(9999);
  const [itemActiveKey, setItemActiveKey] = useState('');

  const [isSearch, setIsSearch] = useState(false);

  // 渲染联系人列表
  useEffect(() => {
    // const mockDatas = { ...mockData };
    const renderData = {
      contact: addressStore.contacts,
      groups: addressStore.groups,
    };

    let menu = Object.keys(renderData).map((menuItem, index2) => {
      // mockDatas[menuItem] = getBrands(mockDatas[menuItem]);
      let contacts = renderData[menuItem as 'contact' | 'groups']?.map(
        (contactItem: { userId: string; groupid: string; nickname: string; groupname: string }) => {
          const id = contactItem.userId || contactItem.groupid;
          const name = contactItem.nickname || contactItem.groupname;
          return (
            <ContactItem
              contactId={id}
              onClick={e => {
                console.log('setItemActiveKey', id);
                setItemActiveKey(id);
              }}
              key={id + Math.random().toString()}
              isActive={id == itemActiveKey}
            >
              {name || id}
            </ContactItem>
          );
        },
      );
      return (
        <ContactGroup
          onclickTitle={title => {
            setActiveKey(index2);
          }}
          title={menuItem}
          key={menuItem}
          itemCount={contacts.length}
          itemHeight={74}
        >
          {contacts}
        </ContactGroup>
      );
    });

    setAddressNode(menu);
  }, [itemActiveKey, addressStore.contacts, addressStore.groups]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(value);
    const returnValue = onSearch?.(e);
    if (returnValue === false) return;

    const contactSearchList = addressStore.contacts.filter(
      (user: { userId: string | string[]; nickname: string | string[] }) => {
        if (user.userId.includes(value) || user.nickname.includes(value)) {
          return true;
        }
        return false;
      },
    );

    const groupSearchList = addressStore.groups.filter(
      (group: { groupid: string | string[]; groupname: string | string[] }) => {
        if (group.groupid.includes(value) || group.groupname.includes(value)) {
          return true;
        }
        return false;
      },
    );

    setIsSearch(value.length > 0 ? true : false);

    addressStore.setSearchList(contactSearchList.concat(groupSearchList));
  };

  const [searchNode, setSearchNode] = useState<JSX.Element[]>();

  // 渲染搜索列表
  useEffect(() => {
    const searchList = addressStore.searchList.map(
      (item: { userId: any; groupid: any; nickname: any; groupname: any }) => {
        // console.log('contactItem', contactItem);
        const id = item.userId || item.groupid;
        const name = item.nickname || item.groupname;
        return (
          <ContactItem
            contactId={id}
            onClick={e => {
              console.log('setItemActiveKey', id);
              setItemActiveKey(id);
            }}
            key={id + Math.random().toString()}
            isActive={id == itemActiveKey}
          >
            {name || id}
          </ContactItem>
        );
      },
    );

    setSearchNode(searchList);
  }, [addressStore.searchList]);

  return (
    <div className={classString} ref={listRef} style={{ display: 'flex', flexDirection: 'column' }}>
      <Header></Header>
      <Search onChange={handleSearch}></Search>
      <div>
        <StickyContainer style={{ height: '500px', overflow: 'auto' }}>
          {isSearch ? searchNode : addressNode}
        </StickyContainer>
      </div>

      {/* 太多的情况考虑使用 List 组件优化 */}
    </div>
  );
};

ContactList = observer(ContactList);
export { ContactList };
