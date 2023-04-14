import { makeAutoObservable, observable, action, makeObservable } from 'mobx';

class AddressStore {
	rootStore;
	contacts;
	groups;
	chatroom;
	searchList;
	constructor(rootStore) {
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

	setContacts(contacts) {
		this.contacts = contacts;
	}

	setGroups(groups) {
		this.groups = groups;
	}

	setChatroom(chatroom) {
		this.chatroom = chatroom;
	}

	setSearchList(searchList) {
		this.searchList = searchList;
	}
}

export default AddressStore;
