import React from 'react';

const BusyMessageTest: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>忙线消息发送测试</h2>
      <p>测试场景：当正在通话中收到新邀请时，busy消息应该发送给新的邀请人</p>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>问题描述:</h3>
        <p>
          之前的问题：当正在通话中收到新邀请时，busy消息会发送给当前通话的人，而不是新的邀请人。
        </p>
        <p>修复后：busy消息会正确发送给新的邀请人。</p>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>修复内容:</h3>
        <ul>
          <li>
            修改了 <code>sendAnswerCallMessage</code> 方法，支持指定目标信息
          </li>
          <li>
            在 <code>handleInvitationMessage</code> 中，发送busy消息时使用新邀请的信息
          </li>
          <li>确保busy消息发送给正确的邀请人</li>
        </ul>
      </div>

      <div style={{ border: '1px solid #blue', padding: '10px', backgroundColor: '#f0f0ff' }}>
        <h3>测试步骤:</h3>
        <ol>
          <li>开始一个通话（用户A和用户B）</li>
          <li>在通话进行中，让用户C发起邀请给用户B</li>
          <li>
            观察控制台日志，确认：
            <ul>
              <li>收到用户C的邀请消息</li>
              <li>发送busy消息给用户C（而不是用户A）</li>
              <li>用户C收到busy消息后发送cancelCall</li>
              <li>用户B忽略cancelCall，继续与用户A的通话</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ border: '1px solid #orange', padding: '10px', backgroundColor: '#fff8f0' }}>
        <h3>关键修复代码:</h3>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {`// 在 handleInvitationMessage 中
if (this.callStatus > CALL_STATUS.IDLE) {
  const newInvitationInfo = {
    callerIMName: ext.callerIMName,
    callerDevId: ext.callerDevId,
    callId: ext.callId,
  };
  this.sendAnswerCallMessage('busy', newInvitationInfo);
  return;
}

// sendAnswerCallMessage 方法支持指定目标
private sendAnswerCallMessage(
  result: 'accept' | 'refuse' | 'busy',
  targetCallInfo?: {
    callerIMName: string;
    callerDevId: string;
    callId: string;
  }
) {
  const callInfo = targetCallInfo || this.currentCallInfo;
  // 使用 callInfo 发送消息
}`}
        </pre>
      </div>
    </div>
  );
};

export default BusyMessageTest;
