import React, { useEffect, useState, FC } from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';
import List from '../../../component/list';
import Header from '../../../module/header';
import { ContactItem, ContactList, ContactDetail } from '../../../module/contactList';
import GroupDetail from '../../../module/groupDetail';
import { Search } from '../../../component/input/Search';
import Chat from '../../../module/chat';
import Icon from '../../../component/icon';
import AC from 'agora-chat';
import { RootProvider } from '../../../module/store/rootContext';
import rootStore from '../../../module/store/index';
import { ConversationList, ConversationItem } from '../../../module/conversation';
// import Provider from '../../../module/store/Provider';
import { Provider, UIKitProvider } from '../../../index';
import { useClient } from '../../../module/hooks/useClient';
import { getLinkPreview, getPreviewFromContent } from 'link-preview-js';
import Button from '../../../component/button';
import Avatar from '../../../component/avatar';
import { MessageList } from '../../../module/chat/MessageList';
import Thread from '../../../module/thread';
import PinnedMessage from '../../../module/pinnedMessage';
import './index.css';
import { observer } from 'mobx-react-lite';
import axios from 'axios';
import { useConversationContext, useChatContext } from '../../../module';
import { hexToHsla, generateColors } from '../../../module/utils/color';
import UserSelect from '../../../module/userSelect';
import { usePinnedMessage } from '../../../module/hooks/usePinnedMessage';
console.log('hexToHsla', hexToHsla('#FF0000'));
console.log('hexToHsla', hexToHsla('#000000'));
console.log('hexToHsla', hexToHsla('#ffffff'));
console.log('hexToHsla 1', generateColors(hexToHsla('#FF0000')));
// import {
// 	Chat,
// 	rootStore,
// 	ConversationList,
// 	Provider,
// 	useClient,
// } from 'chatuim2';
// import 'chatuim2/style.css';
window.rootStore = rootStore;

// get url query params
const getQueryParams = () => {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  return {
    userId: params.get('userId'),
    password: params.get('password'),
    appKey: params.get('appKey'),
  };
};

const PinnedMessageComp = observer(() => {
  const { visible } = usePinnedMessage();
  return (
    visible && (
      <div
        style={{
          width: '350px',
          borderLeft: '1px solid #eee',
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <PinnedMessage />
      </div>
    )
  );
});

const ChatApp: FC<any> = () => {
  const client = useClient();
  // useEffect(() => {
  //   client &&
  //     client
  //       .open({
  //         user: 'zd3',
  //         // pwd: '272808',
  //         accessToken:
  //           'YWMtgwTHNZPxQviWaqMIJTHfFyhYwv00w0hrtpGKy_Jc3V2J3LcwYk0R7J9BM4gepb6yAwMAAAGLCXYIsQABTnFcluGlL4BdlKN4Qdf0EQThNgjgWh4vB9JhWxj-X18Ucg==',
  //       })
  //       .then(res => {
  //         console.log('获取token成功', res, rootStore.client);
  //       });
  // }, [client]);

  const getUrlPreviewInfo = () => {
    getLinkPreview(
      'https://api-ref.agora.io/en/chat-sdk/ios/1.x/interface_agora_chat_client.html#a3e0c211f850af4dfe61c0581f3b7aea7',
    )
      .then(data => console.log(123, data))
      .catch(e => {
        console.log(22, e);
      });
  };
  // console.log('rootStore', rootStore.conversationStore.currentCvs);

  let {
    topConversation: topConversationInner,
    currentConversation,
    conversationList,
    setCurrentConversation,
  } = useConversationContext();
  let { messages } = useChatContext();
  console.log(11111, messages);
  const topConversation = () => {
    setCurrentConversation({
      chatType: 'groupChat',
      conversationId: '226377652568065',
      name: 'zd2',
      unreadCount: 0,
    });
    console.log(222, currentConversation);
    console.log('222', rootStore.conversationStore.currentCvs);
    topConversationInner({
      chatType: 'groupChat',
      conversationId: '226377652568065',
      lastMessage: {},
    });
  };

  const thread = rootStore.threadStore;

  let TxtMsg = msg => (
    <TextMessage
      bubbleType="secondly"
      bubbleStyle={{ background: 'hsl(135.79deg 88.79% 36.46%)' }}
      shape="square"
      arrow={false}
      avatar={<Avatar style={{ background: 'pink' }}>zhangdong</Avatar>}
      textMessage={{
        msg: msg.msg || 'hello',
        type: 'txt',
        id: '1234',
        to: 'zd5',
        from: 'zd2',
        chatType: 'singleChat',
        time: Date.now(),
        status: 'read',
        bySelf: true,
      }}
    ></TextMessage>
  );

  let MsgList = <MessageList renderMessage={msg => TxtMsg(msg)}></MessageList>;

  const [tab, setTab] = useState('chat');
  const changeTab = (tab: string) => {
    setTab(tab);
  };

  useEffect(() => {
    console.log('*******', rootStore.addressStore.contacts);
    rootStore.addressStore.setAppUserInfo({
      ...rootStore.addressStore.appUsersInfo,
      lxm: {
        userId: 'lxm',
        nickname: '自定义名称',
        avatarurl: 'https://cdn4.iconfinder.com/data/icons/small-n-flat/24/cat-512.png',
      },
    });
  }, [rootStore.addressStore.contacts.length]);

  useEffect(() => {
    console.log('变化了 showThreadPanel');
  }, [thread.showThreadPanel]);

  const getRTCToken = data => {
    const { channel, chatUserId } = data;
    const agoraUId = '935243573';
    const url = `https://a41.chat.agora.io/token/rtc/channel/${channel}/agorauid/${agoraUId}?userAccount=${chatUserId}`;
    return axios
      .get(url)
      .then(function (response) {
        console.log('getRtctoken', response);
        return response.data;
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const handleClickCvs = (cvs: any) => {
    return () => {
      rootStore.conversationStore.setCurrentCvs({
        chatType: cvs.chatType,
        conversationId: cvs.conversationId,
        name: cvs.name,
        unreadCount: 0,
      });
    };
  };

  const [contactData, setContactData] = useState({ id: '', name: '', type: 'contact' });
  const currentCvs = rootStore.conversationStore.currentCvs;
  // create group
  const [userSelectVisible, setUserSelectVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  const [groupSettingVisible, setGroupSettingVisible] = useState(false);
  const [cvsItem, setCvsItem] = useState([]);
  const showGroupSetting = () => {
    setGroupSettingVisible(value => !value);
    console.log('showGroupSetting');
  };
  return (
    <>
      <div className="tab-box">
        <div
          className="tab-btn"
          onClick={() => {
            changeTab('chat');
          }}
        >
          chat
        </div>
        <div
          className="tab-btn"
          onClick={() => {
            changeTab('contact');
          }}
        >
          contact
        </div>
      </div>
      <div
        style={{
          width: '350px',
          background: '#fff',
        }}
      >
        {tab == 'chat' && (
          <ConversationList
            presence={true}
            showSearchList={false}
            onSearch={value => {
              rootStore.conversationStore.setSearchList([
                {
                  conversationId: 'zd1',
                  chatType: 'singleChat',
                },
              ]);
              return false;
            }}
            renderHeader={() => (
              <Header
                moreAction={{
                  visible: true,
                  icon: <Icon type="PLUS_IN_CIRCLE"></Icon>,
                  actions: [
                    {
                      content: 'Create Group',
                      icon: <Icon type="PLUS_IN_CIRCLE"></Icon>,
                      onClick: () => {
                        console.log('create group');
                        setUserSelectVisible(true);
                      },
                    },
                  ],
                }}
              ></Header>
            )}
            onItemClick={item => {
              console.log('cvsItem', item);
              setCvsItem(item);
            }}
            itemProps={{
              moreAction: {
                visible: true,
                actions: [{ content: 'DELETE' }],
              },
              formatDateTime: (time: number) => {
                return new Date(time).toLocaleString();
              },
            }}
            className="conversation"
            // renderItem={csv => (
            //   <ConversationItem
            //     onClick={handleClickCvs(csv)}
            //     key={csv.conversationId}
            //     data={csv}
            //     // isActive
            //   />
            // )}
          ></ConversationList>
        )}

        {tab == 'contact' && (
          <ContactList
            className="conversation"
            menu={[
              'contacts',
              'groups',
              'requests',
              {
                title: 'Block list',
                data: [
                  {
                    remark: '张4',
                    userId: 'zd1',
                  },
                  {
                    groupname: '群1',
                    groupid: '12',
                  },
                ],
              },
            ]}
            onItemClick={data => {
              console.log('data', data);
              setContactData(data);
            }}
          ></ContactList>
        )}
      </div>
      <div
        style={{
          width: '65%',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            borderLeft: '1px solid transparent',
            overflow: 'hidden',
          }}
        >
          {tab == 'chat' && (
            <>
              <Chat
                messageListProps={{
                  // renderUserProfile: a => {
                  //   return null;
                  // },
                  messageProps: {
                    formatDateTime: (time: number) => {
                      return new Date(time).toLocaleString();
                    },
                  },
                }}
                messageInputProps={{
                  enabledTyping: true,
                }}
                headerProps={{
                  moreAction: {
                    visible: false,
                    actions: [{ content: '' }],
                  },
                  // suffixIcon: (
                  //   <div>
                  //     {currentCvs.chatType !== 'singleChat' && (
                  //       <Icon type="PIN" onClick={show}></Icon>
                  //     )}
                  //     <Icon type="ELLIPSIS" onClick={showGroupSetting}></Icon>
                  //   </div>
                  // ),
                }}
                rtcConfig={{
                  getRTCToken: getRTCToken,
                  getIdMap: () => {},
                }}
                renderRepliedMessage={message => {
                  return <div>replied message {message.from}</div>;
                }}
              ></Chat>
              {groupSettingVisible && (
                <div style={{ width: '350px', borderLeft: '1px solid green' }}>
                  <GroupDetail
                    conversation={{ chatType: 'groupChat', conversationId: cvsItem.conversationId }}
                  ></GroupDetail>
                </div>
              )}
            </>
          )}
          {tab == 'contact' && (
            <ContactDetail
              data={contactData}
              onMessageBtnClick={() => {
                setTab('chat');
              }}
            ></ContactDetail>
          )}
        </div>
        {thread.showThreadPanel && (
          <div
            style={{
              width: '50%',
              borderLeft: '1px solid #eee',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <Thread></Thread>
          </div>
        )}
        <PinnedMessageComp />

        {/* <div style={{ width: '350px', borderLeft: '1px solid green' }}>
          <ContactInfo
            conversation={{ chatType: 'groupChat', conversationId: contactData.id }}
          ></ContactInfo>
        </div> */}
      </div>
      {/* <div>
        <Button onClick={getUrlPreviewInfo}>getUrlPreviewInfo</Button>
        <Button onClick={topConversation}>top 2808</Button>
        <br />
      </div> */}
      <UserSelect
        onCancel={() => {
          setUserSelectVisible(false);
        }}
        onOk={() => {
          rootStore.addressStore.createGroup(selectedUsers.map(user => user.userId));
          setUserSelectVisible(false);
        }}
        enableMultipleSelection
        onUserSelect={(user, users) => {
          setSelectedUsers(users);
        }}
        open={userSelectVisible}
        okText="创建"
      ></UserSelect>
    </>
  );
};

const App = ChatApp;

const ChatWrap = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lng, setLng] = useState<'zh' | 'en'>('en');
  const { userId, appKey, password } = getQueryParams();
  return (
    <>
      <div>
        <button
          onClick={() => {
            setTheme(theme === 'light' ? 'dark' : 'light');
          }}
        >
          Switch Theme: {theme}
        </button>
        <button
          onClick={() => {
            setLng(lng === 'zh' ? 'en' : 'zh');
          }}
        >
          Switch Language: {lng}
        </button>
      </div>

      <Provider
        initConfig={{
          appKey: appKey || 'easemob#easeim',
          userId: userId || 'sttest',
          password: password || '123',
          useUserInfo: true,

          // token:
          //   '007eJxTYFBRW8PxsjzKTEt3t/q21aylFwrC37GaPK73k382686EjO8KDGmGKcnm5hZJKSnJZiZmiSkWaUZmBpbmZsmJRikGhqbJh06XpTYEMjIY6nO0MjKwMjACIYivwpBkYGaSmGJmoGtmZJKka2iYmqxrkWpopGuaZGRikWRgapGWZAkAHZsmnQ==',
          // appKey: 'easemob#easeim',
        }}
        theme={{
          // primaryColor: 50, //'#33ffaa',
          mode: theme,
          bubbleShape: 'square',
          avatarShape: 'square',
          componentsShape: 'square',
        }}
        local={{
          fallbackLng: 'en',
          lng: lng,
          // resources: {
          //   en: {
          //     translation: {
          //       'module.conversationTitle': 'Conversation List 22',
          //       'module.deleteCvs': 'Delete Conversation 22',
          //     },
          //   },
          // },
        }}
        features={{
          conversationList: {
            search: true,
            item: {
              moreAction: true,
              deleteConversation: true,
              presence: false,
            },
          },
          chat: {
            header: {
              threadList: false,
              moreAction: true,
              clearMessage: true,
              deleteConversation: true,
              audioCall: true,
              pinMessage: true,
            },
            message: {
              status: true,
              reaction: true,
              thread: true,
              recall: true,
              translate: true,
              edit: true,
              report: false,
              forward: false,
              pin: true,
            },
            messageInput: {
              mention: true,
              typing: true,
              record: true,
              emoji: true,
              moreAction: true,
              picture: true,
              video: true,
              contactCard: false,
            },
          },
        }}
      >
        <App></App>
      </Provider>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('chatRoot') as Element).render(
  <div
    className="container"
    style={{
      display: 'flex',
      position: 'absolute',
      width: '90%',
      height: '90%',
      left: '5%',
      top: '3%',
    }}
  >
    <ChatWrap />
  </div>,
);
