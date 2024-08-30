import React, { ReactNode, ChangeEventHandler, ChangeEvent } from 'react';
import './style/style.scss';
import { tuple } from '../_utils/type';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import Icon from '../icon';
import { RootContext } from '../../module/store/rootContext';
import './style/search.scss';
import { useTranslation } from 'react-i18next';

export interface SearchProps {
  className?: string;
  prefix?: string;
  icon?: ReactNode;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  shape?: 'round' | 'square';
  placeholder?: string;
}
export default function Search(props: SearchProps) {
  const {
    onChange,
    prefix: customizePrefixCls,
    className,
    shape,
    style = {},
    placeholder,
    inputStyle,
    ...others
  } = props;
  const { t } = useTranslation();
  const { getPrefixCls } = React.useContext(ConfigContext);
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  const componentsShape = shape || theme?.componentsShape || 'round';
  const prefixCls = getPrefixCls('search', customizePrefixCls);
  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-${componentsShape}`]: componentsShape,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(e);
  };
  return (
    <div className={classString} style={{ ...style }}>
      <Icon type="SEARCH" className={`${prefixCls}-icon`}></Icon>
      <input
        type="text"
        placeholder={placeholder || (t('search') as string)}
        onChange={handleChange}
        className={`${prefixCls}-input`}
        style={{ ...inputStyle }}
        {...others}
      />
    </div>
  );
}

export { Search };
