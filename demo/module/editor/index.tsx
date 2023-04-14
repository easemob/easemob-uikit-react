import React from 'react';
import ReactDOM from 'react-dom/client';
import Emoji from '../../../module/messageEditor/emoji';
import Recorder from '../../../module/messageEditor/recorder';
import { Tooltip } from '../../../src/tooltip/Tooltip';
import Textarea from '../../../module/messageEditor/textarea';
import MessageEditor from '../../../module/messageEditor';

import './style.scss';
const root = document.getElementById('editorRoot') as Element;

ReactDOM.createRoot(root).render(
	<div>
		<Tooltip
			title={<div>12</div>}
			color="yellow"
			trigger="click"
			autoAdjustOverflow={true}
			placement="topLeft"
		>
			<div className={`popover-inner-content`}>{'hahah'}</div>
		</Tooltip>
		<Emoji></Emoji>
		<hr></hr>
		<Recorder></Recorder>
		<hr></hr>
		<Textarea></Textarea>
		<hr />
		<MessageEditor></MessageEditor>
	</div>
);
