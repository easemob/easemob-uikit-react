import classNames from 'classnames';
import Dialog from './Dialog';
import * as React from 'react';
import Button from '../button';
import type { ButtonProps, ButtonType } from '../button/Button';
import { ConfigContext } from '../config/index';
import { canUseDocElement } from '../_utils/styleChecker';
import { getTransitionName } from '../_utils/motion';
import { useTranslation } from 'react-i18next';
import Icon from '../icon';
let mousePosition: { x: number; y: number } | null;

const getClickPosition = (e: MouseEvent) => {
  mousePosition = {
    x: e.pageX,
    y: e.pageY,
  };
  // 100ms 内发生过点击事件，则从点击位置动画展示
  // 否则直接 zoom 展示
  // 这样可以兼容非点击方式展开
  setTimeout(() => {
    mousePosition = null;
  }, 100);
};

// 只有点击事件支持从鼠标位置动画展开
if (canUseDocElement()) {
  document.documentElement.addEventListener('click', getClickPosition, true);
}

export interface ModalProps {
  /** 对话框是否可见 */
  open?: boolean;
  /** 确定按钮 loading */
  confirmLoading?: boolean;
  /** 标题 */
  title?: React.ReactNode;
  /** 是否显示右上角的关闭按钮 */
  closable?: boolean;
  /** 点击确定回调 */
  onOk?: (e: React.MouseEvent<HTMLElement>) => void;
  /** 点击模态框右上角叉、取消按钮、Props.maskClosable 值为 true 时的遮罩层或键盘按下 Esc 时的回调 */
  onCancel?: (e: React.SyntheticEvent) => void;
  afterClose?: () => void;
  /** 垂直居中 */
  centered?: boolean;
  /** 宽度 */
  width?: string | number;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 确认按钮文字 */
  okText?: React.ReactNode;
  /** 确认按钮类型 */
  okType?: ButtonType;
  /** 取消按钮文字 */
  cancelText?: React.ReactNode;
  cancelType?: ButtonType;
  /** 点击蒙层是否允许关闭 */
  maskClosable?: boolean;
  /** 强制渲染 Modal */
  forceRender?: boolean;
  okButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  destroyOnClose?: boolean;
  style?: React.CSSProperties;
  wrapClassName?: string;
  maskTransitionName?: string;
  transitionName?: string;
  className?: string;
  getContainer?: string | HTMLElement | getContainerFunc | false;
  zIndex?: number;
  bodyStyle?: React.CSSProperties;
  maskStyle?: React.CSSProperties;
  mask?: boolean;
  keyboard?: boolean;
  wrapProps?: any;
  prefixCls?: string;
  closeIcon?: React.ReactNode;
  modalRender?: (node: React.ReactNode) => React.ReactNode;
  focusTriggerAfterClose?: boolean;
  children?: React.ReactNode;
}
type getContainerFunc = () => HTMLElement;

const Modal: React.FC<ModalProps> = props => {
  const { getPrefixCls } = React.useContext(ConfigContext);

  const handleCancel = (e: React.SyntheticEvent) => {
    const { onCancel } = props;
    onCancel?.(e);
  };

  const handleOk = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { onOk } = props;
    onOk?.(e);
  };

  const {
    prefixCls: customizePrefixCls,
    footer,
    open = false,
    wrapClassName,
    centered,
    getContainer,
    closeIcon,
    focusTriggerAfterClose = true,
    width = 520,
    okText,
    okType = 'primary',
    cancelType = 'default',
    cancelText,
    confirmLoading = false,
    forceRender = false,
    ...restProps
  } = props;

  const prefixCls = getPrefixCls('modal', customizePrefixCls);
  const rootPrefixCls = getPrefixCls();
  const { t } = useTranslation();
  const defaultFooter = (
    <>
      <Button type={okType} onClick={handleOk} {...props.okButtonProps}>
        {okText ?? t('confirmBtn')}
      </Button>
      <Button onClick={handleCancel} type={cancelType} {...props.cancelButtonProps}>
        {cancelText || t('cancelBtn')}
      </Button>
    </>
  );

  const closeIconToRender = (
    <span className={`${prefixCls}-close-x`}>
      {
        closeIcon || <Icon type="CLOSE_THIN" width={24} height={24}></Icon>
        // TODO 替换 ICON
        // <CloseOutlined className={`${prefixCls}-close-icon`} />
      }
    </span>
  );

  const wrapClassNameExtended = classNames(wrapClassName, {
    [`${prefixCls}-centered`]: !!centered,
  });
  return (
    <Dialog
      forceRender={forceRender}
      width={width}
      {...restProps}
      prefixCls={prefixCls}
      wrapClassName={wrapClassNameExtended}
      footer={footer === undefined ? defaultFooter : footer}
      visible={open}
      mousePosition={mousePosition}
      onClose={handleCancel}
      closeIcon={closeIconToRender}
      focusTriggerAfterClose={focusTriggerAfterClose}
      transitionName={getTransitionName(rootPrefixCls, 'zoom', props.transitionName)}
      maskTransitionName={getTransitionName(rootPrefixCls, 'fade', props.maskTransitionName)}
    />
  );
};

export default Modal;
