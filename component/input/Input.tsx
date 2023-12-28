// Input 组件， 用于输入框的封装, 通过继承 InputHTMLAttributes<HTMLInputElement> 来继承 input 的属性， 通过 Omit 来排除 input 的属性， 从而达到继承 input 的属性， 但是不包含 input 的属性，有required参数来控制必填，如果没有输入内容输入框显示红色边框，右侧有close按钮可以清空内容，样式和Search组件一致
import React, {
  FC,
  useState,
  useContext,
  useEffect,
  ReactEventHandler,
  ReactNode,
  useRef,
} from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';
import Icon from '../icon';
import { RootContext } from '../../module/store/rootContext';
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: 'large' | 'middle' | 'small';
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  shape?: 'ground' | 'square';
  close?: boolean;
  disabled?: boolean;
  maxLength?: number;
  suffix?: ReactNode;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
}

const Input: FC<InputProps> = props => {
  const {
    className,
    size,
    required,
    value = '',
    onChange,
    prefix,
    onClear,
    placeholder,
    shape,
    close,
    suffixIcon,
    style = {},
  } = props;
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('input', prefix);
  const ref = useRef(null);
  const [inputValue, setInputValue] = useState(value);
  const [isFocus, setIsFocus] = useState(false);
  const [isClear, setIsClear] = useState(false);
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  const componentsShape = shape || theme?.componentsShape || 'ground';
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-${size}`]: size,
      [`${prefixCls}-required`]: required,
      [`${prefixCls}-disabled`]: props.disabled,
      [`${prefixCls}-${componentsShape}`]: componentsShape,
      [`${prefixCls}-error`]: required && !inputValue,
      [`${prefixCls}-suffixIcon`]: suffixIcon,
      [`${prefixCls}-${themeMode}`]: !!themeMode,
    },
    className,
  );

  useEffect(() => {
    setInputValue(value);
    if (close && value.length > 0) setIsClear(true);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange?.(e);

    if (e.target.value.length > 0 && close) {
      setIsClear(true);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onClear?.();
    // onChange?.()
    setIsClear(false);
  };

  const handleFocus = () => {
    setIsFocus(true);
  };

  const handleBlur = () => {
    setIsFocus(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsClear(e.target.value.length > 0);
  };

  const renderPrefixIcon = () => {
    const { prefixIcon } = props;
    if (prefixIcon) {
      return <span className={`${prefixCls}-prefixIcon`}>{prefixIcon}</span>;
    }
    return null;
  };

  const renderSuffixIcon = () => {
    const { suffix } = props;
    if (suffix) {
      return <span className={`${prefixCls}-suffixIcon`}>{suffix}</span>;
    }
    if (isClear) {
      return (
        <span className={`${prefixCls}-suffixIcon`}>
          <Icon type="CLOSE" className={`${prefixCls}-clear`} onClick={handleClear} />
        </span>
      );
    }
    return null;
  };

  const renderRequired = () => {
    if (required) {
      return <span className={`${prefixCls}-required`}>*</span>;
    }
    return null;
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return <span className={`${prefixCls}-placeholder`}>{placeholder}</span>;
    }
    return null;
  };

  return (
    <div className={classes} style={{ ...style }}>
      <input
        ref={ref}
        disabled={props.disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
        className={`${prefixCls}-input`}
        type="text"
      />
      {renderSuffixIcon()}
    </div>
  );
};

export default Input;
