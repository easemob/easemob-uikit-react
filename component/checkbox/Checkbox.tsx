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
  defaultChecked?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  onChange?(e: ChangeEvent<HTMLInputElement>): void;
  shape?: 'square' | 'ground';
}

const Checkbox = ({
  id,
  checked,
  defaultChecked,
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
  let checkedInner = defaultChecked || isChecked;
  if (checked != undefined) {
    checkedInner = checked;
  }

  return (
    <label className={`${prefixCls}-wrapper`} style={{ ...style }} htmlFor={id}>
      <span className={classes}>
        <input
          disabled={disabled}
          id={id}
          type="checkbox"
          checked={checkedInner}
          onClick={() => {
            if (typeof checked != undefined) {
              return;
            }
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
