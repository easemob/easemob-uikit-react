import React, { useContext, useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import './style/style.scss';
import { RootContext } from '../store/rootContext';
import { ConfigContext } from '../../component/config/index';
import Header, { HeaderProps } from '../header';
import UserItem, { UserInfoData } from '../../component/userItem';
import { useUserInfo } from '../hooks/useAddress';
import { useTranslation } from 'react-i18next';
import Empty from '../empty';
import i18next from 'i18next';
export interface BlocklistProps {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  onItemClick?: (data: UserInfoData) => void;
  headerProps?: HeaderProps;
  renderHeader?: () => React.ReactNode;
  renderItems?: (data: UserInfoData, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

const Blocklist = (props: BlocklistProps) => {
  const {
    prefix,
    className,
    style,
    onItemClick,
    renderHeader,
    renderItems,
    headerProps,
    renderEmpty,
  } = props;
  const context = useContext(RootContext);
  const { rootStore, features, theme } = context;
  const themeMode = theme?.mode || 'light';
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('blocklist', prefix);

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  useEffect(() => {
    if (!rootStore.loginState) {
      return;
    }
    rootStore.addressStore.getBlockList();
  }, [rootStore.loginState]);

  useUserInfo('blocklist');

  const appUsersInfo = rootStore.addressStore.appUsersInfo;
  return (
    <div className={classString} style={{ ...style }}>
      {renderHeader ? (
        renderHeader()
      ) : (
        <Header content={t('blocklist')} avatar={<></>} {...headerProps}></Header>
      )}

      <div className={`${prefixCls}-main`}>
        {rootStore.addressStore.blockList.length === 0 ? (
          renderEmpty ? (
            renderEmpty()
          ) : (
            <Empty text={i18next.t('no contact')}></Empty>
          )
        ) : null}
        {renderItems
          ? rootStore.addressStore.blockList.map((item, index) => {
              const data = {
                userId: item,
                nickname: appUsersInfo[item]?.nickname || item,
                avatarUrl: appUsersInfo[item]?.avatarurl,
              };
              return renderItems(data, index);
            })
          : rootStore.addressStore.blockList.map(item => (
              <UserItem
                key={item}
                data={{
                  userId: item,
                  nickname: appUsersInfo[item]?.nickname || item,
                  avatarUrl: appUsersInfo[item]?.avatarurl,
                }}
                onClick={() => {
                  onItemClick?.({
                    userId: item,
                    nickname: appUsersInfo[item]?.nickname || item,
                    avatarUrl: appUsersInfo[item]?.avatarurl,
                  });
                }}
              ></UserItem>
            ))}
      </div>
    </div>
  );
};

export default observer(Blocklist);
