import React, { FC, useEffect, useRef, useState, useContext, ReactNode } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useSize } from 'ahooks';
import { ConfigContext } from '../../src/config/index';
import './style/style.scss';
import Icon from '../../src/icon';
import Avatar from '../../src/avatar';
import Badge from '../../src/badge';
import Button from '../../src/button';
import { Search } from '../../src/input/Search';
import Header, { HeaderProps } from '../header';
import MessageEditor, { MessageEditorProps } from '../messageEditor';
import List from '../../src/list';
import { MessageList, MsgListProps } from './MessageList';

import { RootContext } from '../store/rootContext';
import { useEventHandler } from '../hooks/chat';
import { useHistoryMessages } from '../hooks/useHistoryMsg';
import Empty from '../empty';

import { useTranslation } from 'react-i18next';

// import rootStore from '../store';
export interface ChatProps {
  prefix?: string;
  className?: string;
  renderHeader?: (cvs: {
    chatType: 'singleChat' | 'groupChat';
    conversationId: string;
    name?: string;
    unreadCount?: number;
  }) => ReactNode; // 自定义渲染 Header
  renderMessageList?: () => ReactNode; // 自定义渲染 MessageList
  renderMessageEditor?: () => ReactNode; // 自定义渲染 MessageEditor
  renderEmpty?: () => ReactNode; // 自定义渲染没有会话时的内容
  // Header 的 props
  headerProps?: {
    onAvatarClick?: () => void; // 点击 Header 中 头像的回调
    moreAction?: HeaderProps['moreAction'];
  };
  messageListProps?: MsgListProps;
  messageEditorProps?: MessageEditorProps;
}

const Chat: FC<ChatProps> = props => {
  const {
    prefix: customizePrefixCls,
    className,
    renderHeader,
    renderMessageList,
    renderMessageEditor,
    renderEmpty,
    headerProps,
    messageListProps,
    messageEditorProps,
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('chat', customizePrefixCls);

  const [isEmpty, setIsEmpty] = useState(false);
  const classString = classNames(prefixCls, className);

  const rootStore = useContext(RootContext).rootStore;

  const CVS = rootStore.conversationStore.currentCvs;
  const historyMsgs = useHistoryMessages(CVS);
  const userId = rootStore.client.context.userId;
  useEffect(() => {
    let msg = historyMsgs[0] || {};
    const cvsId = msg.chatType == 'groupChat' ? msg.to : msg.from == userId ? msg.to : msg.from;

    const currentMsgs = rootStore.messageStore.message[CVS.chatType]?.[CVS.conversationId];
    if (
      !CVS.chatType ||
      (currentMsgs?.length >= 0 && (currentMsgs?.[0] as any)?.time <= msg.time) ||
      cvsId != CVS.conversationId
    ) {
      // length >= 0 没拉取过的是 undefined， length == 0 是清空过的， length > 0 是拉取过了
      console.log('不符合条件', CVS.chatType, CVS.conversationId, historyMsgs, cvsId);
      return;
    }

    console.log(
      '添加历史消息',
      CVS,
      rootStore.messageStore.message[CVS.chatType]?.[CVS.conversationId],
    );
    rootStore.messageStore.addHistoryMsgs(rootStore.conversationStore.currentCvs, historyMsgs);
  }, [CVS.conversationId, historyMsgs]);

  useEffect(() => {
    if (!rootStore.conversationStore.currentCvs.conversationId) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  }, [rootStore.conversationStore.currentCvs]);

  // const msgContainerRef = useRef<HTMLDivElement>(null);

  // const size = useSize(msgContainerRef);

  // const [msgListHeight, setMsgListHeight] = useState(
  // 	msgContainerRef?.current?.clientHeight || 0
  // );
  // useEffect(() => {
  // 	console.log(msgContainerRef.current!.clientHeight);
  // 	setMsgListHeight(msgContainerRef.current!.clientHeight);
  // }, [size]);

  return (
    <div className={classString}>
      {isEmpty ? (
        renderEmpty ? (
          renderEmpty()
        ) : (
          <Empty text={t('module.noConversation')}></Empty>
        )
      ) : (
        <>
          {renderHeader ? (
            renderHeader(rootStore.conversationStore.currentCvs)
          ) : (
            <Header
              content={
                rootStore.conversationStore.currentCvs.name ||
                rootStore.conversationStore.currentCvs.conversationId
              }
              moreAction={{
                visible: true,
                actions: [
                  {
                    content: t('module.clearMsgs'),
                    onClick: () => {
                      rootStore.messageStore.clearMessage(rootStore.conversationStore.currentCvs);
                      rootStore.client
                        .removeHistoryMessages({
                          targetId: CVS.conversationId,
                          chatType: CVS.chatType,
                          beforeTimeStamp: Date.now(),
                        })
                        .then(() => {
                          console.log('清除成功');
                        })
                        .catch(err => {
                          console.log('清除失败', err);
                        });
                    },
                  },
                  {
                    content: t('module.deleteCvs'),
                    onClick: () => {
                      rootStore.conversationStore.deleteConversation(
                        rootStore.conversationStore.currentCvs,
                      );

                      rootStore.client.deleteConversation({
                        channel: CVS.conversationId,
                        chatType: CVS.chatType,
                        deleteRoam: true,
                      });
                    },
                  },
                ],
              }}
              {...headerProps}
            ></Header>
          )}
          {renderMessageList ? (
            renderMessageList()
          ) : (
            <MessageList {...messageListProps}></MessageList>
          )}
          {renderMessageEditor ? (
            renderMessageEditor()
          ) : (
            <MessageEditor {...messageEditorProps}></MessageEditor>
          )}
        </>
      )}
    </div>
  );
};

export default observer(Chat);
