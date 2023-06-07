import { makeAutoObservable, observable, action, makeObservable } from 'mobx';
//@ts-ignore
class AddressStore {
  rootStore;
  contacts: any;
  groups: any;
  chatroom: any;
  searchList: any;
  constructor(rootStore: any) {
    this.rootStore = rootStore;

    this.contacts = [];
    this.groups = [];
    this.chatroom = [];
    this.searchList = [];
    makeObservable(this, {
      contacts: observable,
      groups: observable,
      chatroom: observable,
      searchList: observable,
      setContacts: action,
      setGroups: action,
      setChatroom: action,
    });
  }

  setContacts(contacts: any) {
    this.contacts = contacts;
  }

  setGroups(groups: any) {
    this.groups = groups;
  }

  setChatroom(chatroom: any) {
    this.chatroom = chatroom;
  }

  setSearchList(searchList: any) {
    this.searchList = searchList;
  }
}

export default AddressStore;
