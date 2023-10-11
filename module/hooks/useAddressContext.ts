import { useContext, useEffect, useState } from 'react';
import { RootContext } from '../store/rootContext';
import { reaction } from 'mobx';
const useAddressContext = () => {
  const rootStore = useContext(RootContext).rootStore;
  const { addressStore } = rootStore;

  const {
    appUsersInfo,
    setAppUserInfo,
    groups,
    setGroups,
    updateGroupName,
    setGroupMembers,
    removeGroupMember,
    setGroupMemberAttributes,
    setGroupAdmins,
  } = addressStore;
  const [appUsersInfoInner, setAppUsersInfoInner] = useState(appUsersInfo);
  const [groupsInner, setGroupsInner] = useState(groups);
  useEffect(() => {
    const disposer = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return addressStore.appUsersInfo;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setAppUsersInfoInner(newValue);
      },
    );

    const disposerGroup = reaction(
      () => {
        // 返回 MobX 要监听的 observable 数据
        return addressStore.groups;
      },
      (newValue, oldValue) => {
        // 监听 MobX 变化的代码逻辑
        console.log('MobX 变化了 message', newValue, oldValue);
        setGroupsInner(newValue);
      },
    );

    return () => {
      disposer(); // 清理 reaction
      disposerGroup();
    };
  }, []);

  return {
    appUsersInfo: appUsersInfoInner,
    groups: groupsInner,
    setAppUserInfo: setAppUserInfo.bind(addressStore),
    setGroups: setGroups.bind(addressStore),
    updateGroupName: updateGroupName.bind(addressStore),
    setGroupMembers: setGroupMembers.bind(addressStore),
    removeGroupMember: removeGroupMember.bind(addressStore),
    setGroupMemberAttributes: setGroupMemberAttributes.bind(addressStore),
    setGroupAdmins: setGroupAdmins.bind(addressStore),
  };
};

export { useAddressContext };
