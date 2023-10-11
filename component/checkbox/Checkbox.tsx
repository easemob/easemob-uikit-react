import React, { ChangeEvent, ReactElement, useState } from 'react';
import classNames from 'classnames';
import { ConfigContext } from '../config/index';
import './style/style.scss';

export interface CheckboxProps {
  prefix?: string;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onChange?(e: ChangeEvent<HTMLInputElement>): void;
  shape?: 'square' | 'ground';
}

const Checkbox = ({
  id,
  checked = false,
  disabled = false,
  children,
  className,
  onChange,
  shape = 'ground',
  prefix,
  style = {},
}: CheckboxProps): ReactElement => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('checkbox', prefix);
  const classes = classNames(
    prefixCls,
    {
      [`${prefixCls}-ground`]: shape == 'ground',
    },
    className,
  );
  const [isChecked, setIsCheck] = useState(checked);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
  };
  return (
    <label className={`${prefixCls}-wrapper`} style={{ ...style }} htmlFor={id}>
      <span className={classes}>
        <input
          disabled={disabled}
          id={id}
          type="checkbox"
          checked={isChecked}
          onClick={() => {
            if (!disabled) setIsCheck(!isChecked);
          }}
          onChange={handleChange}
        />
        <span className={classNames(`${prefixCls}--mark`, disabled ? 'disabled' : '')} />
      </span>
      {children !== undefined && <span>{children}</span>}
    </label>
  );
};

export { Checkbox };
