import React, { ChangeEvent, ReactElement, useState, forwardRef } from 'react';
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
  shape?: 'square' | 'round';
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id,
      checked,
      defaultChecked = false,
      disabled = false,
      children,
      className,
      onChange,
      shape = 'round',
      prefix,
      style = {},
    }: CheckboxProps,
    ref,
  ): ReactElement => {
    const { getPrefixCls } = React.useContext(ConfigContext);
    const prefixCls = getPrefixCls('checkbox', prefix);
    const classes = classNames(
      prefixCls,
      {
        [`${prefixCls}-round`]: shape == 'round',
      },
      className,
    );
    const [isChecked, setIsCheck] = useState(checked || false);
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
            ref={ref}
            disabled={disabled}
            id={id}
            type="checkbox"
            checked={checkedInner}
            onClick={() => {
              if (typeof checked != 'undefined') {
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
  },
);
Checkbox.displayName = 'Checkbox';
export { Checkbox };
