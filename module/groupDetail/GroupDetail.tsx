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
import GroupMember, { GroupMemberProps } from '../groupMember';
import { useTranslation } from 'react-i18next';
export interface GroupDetailProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  conversation: {
    chatType: 'groupChat';
    conversationId: string;
  };
  onUserIdCopied?: (id: string) => void;
  groupMemberProps?: GroupMemberProps;
  onLeaveGroup?: () => void;
  onDestroyGroup?: () => void;
}

const GroupDetail: FC<GroupDetailProps> = (props: GroupDetailProps) => {
  const {
    conversation,
    style,
    className,
    prefix,
    onUserIdCopied,
    groupMemberProps,
    onLeaveGroup,
    onDestroyGroup,
  } = props;

  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('groupSetting', prefix);
  const context = useContext(RootContext);
  const { rootStore, theme, features, initConfig } = context;
  const { addressStore } = rootStore;
  const themeMode = theme?.mode || 'light';
  const componentsShape = theme?.componentsShape || 'ground';
  const { t } = useTranslation();
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const memberBoxClass = classNames(`${prefixCls}-member-box`, {
    [`${prefixCls}-${themeMode}`]: !!themeMode,
  });
  const { useUserInfo } = initConfig;
  const { getGroupMemberList } = useGroupMembers(conversation.conversationId, useUserInfo ?? true);
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
  const avatarUrl = groupData?.avatarUrl;
  const handleCopy = () => {
    const textArea = document.createElement('textarea');
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
    setClearMsgModalVisible(false);
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
      onDestroyGroup?.();
    } else {
      rootStore.addressStore.leaveGroup(conversation.conversationId);
      onLeaveGroup?.();
    }
    setLeaveModalVisible(false);
  };

  // ------------ members ------
  const [memberVisible, setMemberVisible] = useState({
    open: false,
    type: 'showMember',
  });

  // ---- transfer owner
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<UserInfoData | null>(null);
  const transferOwner = () => {
    if (!selectedOwner) {
      setTransferModalVisible(false);
      return console.warn('no selected owner');
    } else {
      addressStore.changeGroupOwner(conversation.conversationId, selectedOwner.userId);
    }
    setTransferModalVisible(false);
    setMemberVisible({
      open: false,
      type: 'showMember',
    });
  };
  return (
    <>
      <div
        className={classString}
        style={{ ...style, display: memberVisible.open ? 'none' : 'flex' }}
      >
        <div className={`${prefixCls}-header`}>
          <Avatar src={avatarUrl} size={100} shape={componentsShape}>
            {infoData?.name}
          </Avatar>
          <div>
            <div className={`${prefixCls}-header-name`}>{infoData?.name}</div>

            <div className={`${prefixCls}-header-id`}>
              <div>{t('group')} ID:</div>
              {infoData?.id}
              <Icon type="DOC_ON_DOC" style={{ cursor: 'copy' }} onClick={handleCopy}></Icon>
            </div>
            <div className={`${prefixCls}-header-description`}>{infoData?.description}</div>
          </div>
        </div>

        <div className={`${prefixCls}-content`}>
          <div className={`${prefixCls}-content-item`}>
            <Icon type="PERSON_DOUBLE_FILL" width={24} height={24}></Icon>
            <div
              className={`${prefixCls}-content-item-box`}
              onClick={() => {
                setMemberVisible({
                  open: true,
                  type: 'showMember',
                });
              }}
            >
              <span>{t('groupMembers')}</span>
              <div>
                {groupMembers?.length ?? infoData?.affiliations_count}
                <Icon type="ARROW_RIGHT" width={24} height={24}></Icon>
              </div>
            </div>
          </div>
          {/** 先不提供这个功能 */}
          {/* <div className={`${prefixCls}-content-item`}>
            <Icon type="PERSON_SINGLE_LINE_FILL" width={24} height={24}></Icon>
            <div
              className={`${prefixCls}-content-item-box`}
              onClick={() => {
                setNicknameModalVisible(true);
              }}
            >
              <span>{t('myAliasInGroup')}</span>
              <div>
                {nicknameInGroup}
                <Icon type="SLASH_IN_BOX" width={24} height={24}></Icon>
              </div>
            </div>
          </div> */}

          <div className={`${prefixCls}-content-item`}>
            <Icon type="BELL" width={24} height={24}></Icon>
            <div className={`${prefixCls}-content-item-box`}>
              <span>{t('muteNotifications')}</span>
              <div>
                <Switch checked={!!groupData?.silent} onChange={handleNotificationChange}></Switch>
              </div>
            </div>
          </div>

          <div className={`${prefixCls}-content-item`}>
            <Icon type="ERASER" width={24} height={24}></Icon>
            <div
              className={`${prefixCls}-content-item-box`}
              onClick={() => {
                setClearMsgModalVisible(true);
              }}
            >
              <span>{t('clearChatHistory')}</span>
            </div>
          </div>

          {isOwner && (
            <div className={`${prefixCls}-content-section`}>
              <div className={`${prefixCls}-content-item`}>
                <Icon type="SLASH_IN_BOX" width={24} height={24}></Icon>
                <div
                  className={`${prefixCls}-content-item-box`}
                  onClick={() => {
                    setEditGroupInfoModalVisible(true);
                  }}
                >
                  <span>{t('editGroupDetail')}</span>
                  <div>
                    <Icon type="ARROW_RIGHT" width={24} height={24}></Icon>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`${prefixCls}-content-section`}>
            {isOwner && (
              <div
                className={`${prefixCls}-content-item`}
                onClick={() => {
                  setMemberVisible({
                    open: true,
                    type: 'transferOwner',
                  });
                }}
              >
                <Icon type="ARROWS_ROUND" width={24} height={24}></Icon>
                <div className={`${prefixCls}-content-item-box`}>
                  <span>{t('transferOwner')}</span>
                </div>
              </div>
            )}

            <div className={`${prefixCls}-content-item`}>
              <Icon
                type={isOwner ? 'DELETE' : 'ARROW_RIGHT_SQUARE_FILL'}
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
                <span style={{ color: '#FF002B' }}>
                  {isOwner ? t('disbandGroup') : t('leaveGroup')}
                </span>
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
          title={t('myAliasInGroup')}
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
          title={t('clearChatHistory')}
          open={clearMsgModalVisible}
          onCancel={() => {
            setClearMsgModalVisible(false);
          }}
          onOk={clearMessages}
        >
          <div>{`${t('Want to delete all chat history')}?`}</div>
        </Modal>

        <Modal
          open={editGroupInfoModalVisible}
          onCancel={() => {
            setEditGroupInfoModalVisible(false);
          }}
          onOk={editGroupInfo}
          title={t('editGroupDetail')}
          wrapClassName="modify-message-modal"
        >
          <div className={`${prefixCls}-infoModal`}>
            <div>{`${t('group')} ${t('name')}`}</div>
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
            <div>{`${t('group')} ${t('announcement')}`}</div>
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
          title={isOwner ? t('disbandGroup') : t('leaveGroup')}
          open={leaveModalVisible}
          onCancel={() => {
            setLeaveModalVisible(false);
          }}
          onOk={leaveGroup}
        >
          <div>{`${t('want')} ${
            isOwner ? t('disbandGroup').toLocaleLowerCase() : t('leaveGroup').toLocaleLowerCase()
          } “${infoData?.name}” ${t('and delete all chat history')}?`}</div>
        </Modal>
      </div>

      <div
        className={memberBoxClass}
        style={{ ...style, display: memberVisible.open ? 'flex' : 'none' }}
      >
        <GroupMember
          headerProps={
            (memberVisible.type === 'transferOwner' && {
              content: t('transferOwner'),
              suffixIcon: (
                <div
                  className={`${prefixCls}-select`}
                  onClick={() => {
                    setTransferModalVisible(true);
                  }}
                >
                  {t('done')}
                </div>
              ),
            }) ||
            {}
          }
          onClickBack={() => {
            setMemberVisible({
              open: false,
              type: 'showMember',
            });
          }}
          checkable={memberVisible.type == 'transferOwner'}
          groupMembers={groupData?.members}
          groupId={infoData?.id || ''}
          onUserSelect={(
            userInfo: UserInfoData & { type: 'add' | 'delete' },
            selectedUsers: UserInfoData[],
          ) => {
            if (userInfo.type == 'add') {
              setSelectedOwner(userInfo);
            } else {
              setSelectedOwner(null);
            }
          }}
          checkedUsers={
            memberVisible.type == 'transferOwner'
              ? [
                  {
                    userId: rootStore.client.user,
                  },
                ]
              : []
          }
          isOwner={isOwner}
          moreAction={
            memberVisible.type === 'transferOwner'
              ? {
                  visible: false,
                  actions: [],
                }
              : undefined
          }
          {...groupMemberProps}
        ></GroupMember>

        <Modal
          title={t('transferOwner')}
          open={transferModalVisible}
          onCancel={() => {
            setTransferModalVisible(false);
          }}
          onOk={transferOwner}
        >
          <div>
            {selectedOwner
              ? `${t('Want to transfer group ownership to')} “${
                  selectedOwner.nickname || selectedOwner.userId
                }”?`
              : t('Please select the person to be transferred')}
          </div>
        </Modal>
      </div>
    </>
  );
};
GroupDetail.displayName = 'GroupDetail';
export default observer(GroupDetail);
