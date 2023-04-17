import React, { useState, ReactNode, useRef, useContext } from 'react';
import classNames from 'classnames';
import './style/style.scss';
import { ConfigContext } from '../../../src/config/index';
import Dropdown from '../../../src/dropdown';
import { Tooltip } from '../../../src/tooltip/Tooltip';
import Icon from '../../../src/icon';
import AC, { AgoraChat } from 'agora-chat';
import { RootContext } from '../../store/rootContext';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
export interface MoreActionProps {
  prefix?: string;
  icon?: ReactNode;
  customActions?: Array<{
    title: string;
    onClick: () => void;
    icon: ReactNode;
  }>;
  defaultActions?: [{}];
}
let MoreAction = (props: MoreActionProps) => {
  const { icon, customActions, prefix: customizePrefixCls } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('moreAction', customizePrefixCls);
  const classString = classNames(prefixCls);
  const imageEl = useRef<HTMLInputElement>(null);
  const fileEl = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const { client, messageStore } = useContext(RootContext).rootStore;
  const iconNode = icon ? (
    icon
  ) : (
    <span className="icon-container">
      <Icon
        type="PLUS_CIRCLE"
        width={20}
        height={20}
        // onClick={handleClickIcon}
      ></Icon>
    </span>
  );

  const sendImage = () => {
    imageEl.current?.focus();
    imageEl.current?.click();
  };

  const sendFile = () => {
    fileEl.current?.focus();
    fileEl.current?.click();
  };

  let actions2 = [
    {
      key: 'image',
      title: t('module.image'),
      onClick: sendImage,
      icon: null,
    },
    { key: 'file', title: t('module.file'), onClick: sendFile, icon: null },
  ];

  const handleClick = e => {
    console.log(e);
  };
  const menu = (
    <ul className={classString}>
      {actions2.map((item, index) => {
        return (
          <li onClick={item.onClick} key={item.key || index}>
            {item.title}
          </li>
        );
      })}
    </ul>
  );
  const { currentCVS } = messageStore;
  const handleImageChange = e => {
    let file = AC.utils.getFileUrl(e.target);
    if (!file.filename) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }

    const option = {
      type: 'img',
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      file: file,
      onFileUploadComplete: data => {
        let sendMsg = messageStore.message.byId[imageMessage.id];
        sendMsg.thumb = data.thumb;
        sendMsg.url = data.url;
        messageStore.modifyMessage(imageMessage.id, sendMsg);
      },
    } as AgoraChat.CreateImgMsgParameters;
    const imageMessage = AC.message.create(option);

    messageStore.sendMessage(imageMessage);
  };

  const handleFileChange = e => {
    let file = AC.utils.getFileUrl(e.target);
    if (!file.filename) {
      return false;
    }
    if (!currentCVS.conversationId) {
      console.warn('No specified conversation');
      return;
    }

    const option = {
      type: 'file',
      to: currentCVS.conversationId,
      chatType: currentCVS.chatType,
      file: file,
      filename: file.filename,
      file_length: file.data.size,
      url: file.url,
    } as AgoraChat.CreateFileMsgParameters;
    const fileMessage = AC.message.create(option);

    messageStore.sendMessage(fileMessage);
  };

  return (
    <>
      <Tooltip title={menu} trigger="click" arrowPointAtCenter={false} arrow={false}>
        {iconNode}
      </Tooltip>
      {
        <input
          type="file"
          accept="image/gif,image/jpeg,image/jpg,image/png,image/svg"
          ref={imageEl}
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      }
      {<input ref={fileEl} onChange={handleFileChange} type="file" style={{ display: 'none' }} />}
    </>
  );
};

MoreAction = observer(MoreAction);
export { MoreAction };
