import React, {
	useContext,
	useEffect,
	useRef,
	useState,
	forwardRef,
	useImperativeHandle,
	FC,
} from 'react';
import AC, { AgoraChat } from 'agora-chat';
import classNames from 'classnames';
import { ConfigContext } from '../../../src/config/index';
import { convertToMessage } from './util';
import './style/style.scss';
import Icon from '../../../src/icon';

import { RootContext } from '../../store/rootContext';
export interface TextareaProps {
	prefix?: string;
	className?: string;
	placeholder?: string;
	hasSendButton?: boolean;
}

let Textarea = forwardRef<any, TextareaProps>((props, ref) => {
	let { placeholder, hasSendButton } = props;
	const [isEmpty, setIsEmpty] = useState(false);
	const [textValue, setTextValue] = useState('');

	const { prefix: customizePrefixCls, className } = props;
	const { getPrefixCls } = React.useContext(ConfigContext);
	const prefixCls = getPrefixCls('textarea', customizePrefixCls);

	const { client, messageStore } = useContext(RootContext).rootStore;
	useEffect(() => {
		setIsEmpty(true);
	}, []);
	const classString = classNames(
		prefixCls,
		{
			[`${prefixCls}-empty`]: isEmpty,
			[`${prefixCls}-hasBtn`]: !!hasSendButton,
		},
		className
	);
	const handleInputChange = (e) => {
		const value = e.target.innerHTML;
		if (value.length) {
			setIsEmpty(false);
		} else {
			setIsEmpty(true);
		}
		const str = convertToMessage(value).trim();
		setTextValue(str);
	};
	const divRef = useRef<HTMLDivElement>(null);

	if (!placeholder) {
		placeholder = 'Say something';
	}

	const { currentCVS } = messageStore;

	const sendMessage = () => {
		if (!textValue) {
			console.warn('No text message');
			return;
		}
		if (!currentCVS.conversationId) {
			console.warn('No specified conversation');
			return;
		}
		const message = AC.message.create({
			to: currentCVS.conversationId,
			chatType: currentCVS.chatType,
			type: 'txt',
			msg: textValue,
		});
		messageStore.sendMessage(message);
		divRef.current!.innerHTML = '';
		setTextValue('');
	};

	// 发送按钮
	const btnNode = hasSendButton ? (
		<div className={`${prefixCls}-sendBtn`}>
			<Icon
				type="AIR_PLANE"
				width={20}
				height={20}
				color="#009EFF"
				onClick={sendMessage}
			></Icon>
		</div>
	) : null;

	useEffect(() => {
		window.addEventListener('keydown', onKeyDown); // 添加全局事件
		return () => {
			window.removeEventListener('keydown', onKeyDown); // 销毁
		};
	}, [textValue]);

	// 键盘回车事件
	const onKeyDown = (e) => {
		if (e.keyCode === 13) {
			e.preventDefault();
			sendMessage();
		}
	};

	useImperativeHandle(ref, () => ({
		setTextValue,
		divRef,
	}));
	return (
		<div className={classString}>
			<div
				data-before={placeholder}
				ref={divRef}
				className={`${prefixCls}-input`}
				contentEditable="true"
				onInput={handleInputChange}
			></div>
			{btnNode}
		</div>
	);
});

export { Textarea };
