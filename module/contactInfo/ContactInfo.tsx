import React, {
  FC,
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  ChangeEvent,
} from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import List from '../../component/list';
import Avatar from '../../component/avatar';
import Icon from '../../component/icon';
import { ConfigContext } from '../../component/config/index';
import './style/style.scss';
import { useParentName } from '../hooks/dom';
import { useSize } from 'ahooks';
import Input from '../../component/input';
import Header from '../header';
import { RootContext } from '../store/rootContext';
import { useContacts, useGroups, useUserInfo } from '../hooks/useAddress';
import { observer } from 'mobx-react-lite';
import UserItem, { UserInfoData } from '../../component/userItem';
import rootStore from '../store/index';
import Switch from '../../component/switch';
import Modal from '../../component/modal';
import { useGroupMembersAttributes, useGroupMembers } from '../hooks/useAddress';
export interface ContactInfoProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  conversation: {
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
  };
  onUserIdCopied?: (id: string) => void;
}

const ContactInfo: FC<ContactInfoProps> = (props: ContactInfoProps) => {
  const { conversation, style, className, prefix, onUserIdCopied } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('contactInfo', prefix);
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

  const { getGroupMemberList } = useGroupMembers(conversation.conversationId);
  if (conversation.conversationId) {
    getGroupMemberList?.();
  }

  const groupData = rootStore.addressStore.groups.find(
    item => item.groupid == conversation.conversationId,
  );

  useEffect(() => {
    if (!conversation.conversationId) return;
    if (conversation.chatType === 'groupChat') {
      rootStore.addressStore.getGroupInfo(conversation.conversationId);
    }

    if (groupData?.silent !== undefined || !conversation.conversationId) return;
    addressStore.getSilentModeForConversations([
      {
        conversationId: conversation.conversationId,
        chatType: conversation.chatType,
      },
    ]);
  }, [conversation]);

  const infoData = groupData?.info;
  const owner = infoData?.owner;
  const isOwner = owner == rootStore.client.user;
  const groupMembers = groupData?.members;
  const myInfo = groupMembers?.filter(item => item.userId === rootStore.client.user)[0];
  var avatarUrl = '';
  console.log('====', myInfo?.attributes?.nickName);
  const handleCopy = () => {
    var textArea = document.createElement('textarea');
    textArea.value = conversation.conversationId;
    // 添加到 DOM 元素中，方便调用 select 方法
    document.body.appendChild(textArea);
    // 选中文本
    textArea.select();
    // 执行复制命令
    document.execCommand('copy');
    // 删除临时元素
    document.body.removeChild(textArea);
    onUserIdCopied?.(conversation.conversationId);
  };

  // --------- nickname modal ---
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);
  const [nicknameInGroup, setNicknameInGroup] = useState(myInfo?.attributes?.nickName || '');

  useEffect(() => {
    setNicknameInGroup(myInfo?.attributes?.nickName || '');
  }, [myInfo?.attributes?.nickName]);

  const handleNicknameInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    if (e.target.value.length > 20) return;
    setNicknameInGroup(e.target.value);
  };
  const editNicknameInGroup = () => {
    rootStore.addressStore.setGroupMemberAttributesAsync(
      conversation.conversationId,
      rootStore.client.user,
      {
        nickName: nicknameInGroup,
      },
    );
    setNicknameModalVisible(false);
  };

  // ---------- notification --------
  const handleNotificationChange = (e: { target: { checked: boolean } }) => {
    const result = e.target.checked;
    rootStore.addressStore.setSilentModeForConversation(
      {
        conversationId: conversation.conversationId,
        chatType: conversation.chatType,
      },
      result,
    );
  };

  // -------  clear message ---------
  const [clearMsgModalVisible, setClearMsgModalVisible] = useState(false);
  const clearMessages = () => {
    rootStore.messageStore.clearMessage(conversation);
  };

  // -------  edit group info ---------
  const [editGroupInfoModalVisible, setEditGroupInfoModalVisible] = useState(false);
  const [groupInfo, setGroupInfo] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    setGroupInfo({
      name: infoData?.name || '',
      description: infoData?.description || '',
    });
  }, [infoData?.name]);

  const handleGroupInfoChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: 'name' | 'description',
  ) => {
    setGroupInfo({
      ...groupInfo,
      [type]: e.target.value,
    });
  };

  const editGroupInfo = () => {
    rootStore.addressStore.modifyGroup(
      conversation.conversationId,
      groupInfo.name,
      groupInfo.description,
    );
    setEditGroupInfoModalVisible(false);
  };

  //--------------- leave group -------

  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const leaveGroup = () => {
    if (isOwner) {
      rootStore.addressStore.destroyGroup(conversation.conversationId);
    } else {
      rootStore.addressStore.leaveGroup(conversation.conversationId);
    }

    setLeaveModalVisible(false);
  };

  return (
    <div className={classString}>
      <div className={`${prefixCls}-header`}>
        <Avatar src={avatarUrl} size={100}>
          {infoData?.name}
        </Avatar>
        <div>
          <div className={`${prefixCls}-header-name`}>{infoData?.name}</div>

          <div className={`${prefixCls}-header-id`}>
            <div>User ID:</div>
            {infoData?.id}
            <Icon type="FILE" style={{ cursor: 'copy' }} onClick={handleCopy}></Icon>
          </div>
          <div>{infoData?.description}</div>
        </div>
      </div>

      <div className={`${prefixCls}-content`}>
        <div className={`${prefixCls}-content-item`}>
          <Icon type="PERSON_DOUBLE_FILL" width={24} height={24}></Icon>
          <div className={`${prefixCls}-content-item-box`}>
            <span>Members</span>
            <div>
              {infoData?.affiliations_count}
              <Icon type="ARROW_RIGHT" width={24} height={24}></Icon>
            </div>
          </div>
        </div>

        <div className={`${prefixCls}-content-item`}>
          <Icon type="ADD_FRIEND" width={24} height={24}></Icon>
          <div className={`${prefixCls}-content-item-box`}>
            <span>我在本群的昵称</span>
            <div>
              {nicknameInGroup}
              <Icon
                type="EXCLAMATION_MARK_IN_CIRCLE"
                width={24}
                height={24}
                onClick={() => {
                  setNicknameModalVisible(true);
                }}
              ></Icon>
            </div>
          </div>
        </div>

        <div className={`${prefixCls}-content-item`}>
          <Icon type="BELL" width={24} height={24}></Icon>
          <div className={`${prefixCls}-content-item-box`}>
            <span>消息免打扰</span>
            <div>
              <Switch checked={!!groupData?.silent} onChange={handleNotificationChange}></Switch>
            </div>
          </div>
        </div>

        <div className={`${prefixCls}-content-item`}>
          <Icon type="USER" width={24} height={24}></Icon>
          <div
            className={`${prefixCls}-content-item-box`}
            onClick={() => {
              setClearMsgModalVisible(true);
            }}
          >
            <span>清空聊天记录</span>
          </div>
        </div>

        {isOwner && (
          <div className={`${prefixCls}-content-section`}>
            <div className={`${prefixCls}-content-item`}>
              <Icon type="PERSON_DOUBLE_FILL" width={24} height={24}></Icon>
              <div
                className={`${prefixCls}-content-item-box`}
                onClick={() => {
                  setEditGroupInfoModalVisible(true);
                }}
              >
                <span>修改群信息</span>
                <div>
                  <Icon type="ARROW_RIGHT" width={24} height={24}></Icon>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${prefixCls}-content-section`}>
          {isOwner && (
            <div className={`${prefixCls}-content-item`}>
              <Icon type="USER" width={24} height={24}></Icon>
              <div className={`${prefixCls}-content-item-box`}>
                <span>转移群主</span>
              </div>
            </div>
          )}

          <div className={`${prefixCls}-content-item`}>
            <Icon
              type="USER"
              width={24}
              height={24}
              style={{ fill: '#FF002B', width: '24px', height: '24px' }}
            ></Icon>
            <div
              className={`${prefixCls}-content-item-box`}
              onClick={() => {
                setLeaveModalVisible(true);
              }}
            >
              <span style={{ color: '#FF002B' }}>解散群组</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={nicknameModalVisible}
        onCancel={() => {
          setNicknameModalVisible(false);
        }}
        onOk={editNicknameInGroup}
        title={'我的群昵称'}
        wrapClassName="modify-message-modal"
      >
        <Input
          className="cui-group-nickname-input"
          maxLength={20}
          value={nicknameInGroup}
          onChange={handleNicknameInputChange}
        />
      </Modal>
      <Modal
        title={'清空聊天记录'}
        open={clearMsgModalVisible}
        onCancel={() => {
          setClearMsgModalVisible(false);
        }}
        onOk={clearMessages}
      >
        <div>{`确定清空 “${infoData?.name}” 的聊天记录吗？`}</div>
      </Modal>

      <Modal
        open={editGroupInfoModalVisible}
        onCancel={() => {
          setEditGroupInfoModalVisible(false);
        }}
        onOk={editGroupInfo}
        title={'修改群组信息'}
        wrapClassName="modify-message-modal"
      >
        <div className={`${prefixCls}-infoModal`}>
          <div>群名称</div>
          <Input
            name="name"
            className="cui-group-nickname-input"
            maxLength={20}
            value={groupInfo.name}
            onChange={e => {
              handleGroupInfoChange(e, 'name');
            }}
          />
        </div>
        <div className={`${prefixCls}-infoModal`}>
          <div>群公告</div>
          <Input
            name="description"
            className="cui-group-nickname-input"
            maxLength={20}
            value={groupInfo.description}
            onChange={e => {
              handleGroupInfoChange(e, 'description');
            }}
          />
        </div>
      </Modal>

      <Modal
        title={'解散群组'}
        open={leaveModalVisible}
        onCancel={() => {
          setLeaveModalVisible(false);
        }}
        onOk={leaveGroup}
      >
        <div>{`确定解散群组 “${infoData?.name}”，同时删除聊天记录吗？`}</div>
      </Modal>
    </div>
  );
};

export default observer(ContactInfo);
