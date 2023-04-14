import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import TextMessage from '../../../module/textMessage';
import BaseMessage from '../../../module/baseMessage';
import FileMessage from '../../../module/fileMessage';
import AudioMessage from '../../../module/audioMessage';
import NoticeMessage from '../../../module/noticeMessage';
import ImageMessage from '../../../module/imageMessage';
import VideoMessage from '../../../module/videoMessage';
import List from '../../../src/list';

class Test extends React.Component {
	state: { num: { a: number } };
	constructor(props) {
		super(props);
		this.state = {
			num: { a: 1 },
		};
	}
	handleClick() {
		let num2 = this.state.num;
		num2.a++;
		this.setState({
			num: num2,
		});
	}

	render() {
		return (
			<div>
				<span>{this.state.num.a}</span>
				<button onClick={this.handleClick.bind(this)}></button>
			</div>
		);
	}
}

ReactDOM.createRoot(document.getElementById('msgListRoot') as Element).render(
	<div className="container">
		<TextMessage textMessage={{}}>
			asda ad adasddq ad das daq asd sdfdsf23f fw f
		</TextMessage>
		<Test></Test>
		<List height={150} itemCount={100} itemSize={30}>
			{List.Row}
		</List>
	</div>
);
