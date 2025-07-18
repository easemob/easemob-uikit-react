import React from 'react';

const BusyTestSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>忙线处理测试</h2>
      <p>测试场景：当正在通话中收到邀请时，正确处理忙线情况</p>

      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '20px' }}>
        <h3>测试步骤:</h3>
        <ol>
          <li>开始一个通话（可以是1v1或群组通话）</li>
          <li>在通话进行中，让另一个用户发起邀请</li>
          <li>
            观察控制台日志，确认：
            <ul>
              <li>收到邀请时发送了 'busy' 消息</li>
              <li>收到 'cancelCall' 消息时，没有挂断当前通话</li>
              <li>当前通话继续进行</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ border: '1px solid #green', padding: '10px', backgroundColor: '#f0f8f0' }}>
        <h3>修复内容:</h3>
        <ul>
          <li>
            在 <code>handleCancelCallMessage</code> 方法中添加了检查
          </li>
          <li>
            在 <code>handleConfirmCalleeMessage</code> 方法中添加了检查
          </li>
          <li>
            在 <code>handleAnswerCallMessage</code> 方法中添加了检查
          </li>
          <li>
            如果当前正在通话中（<code>callStatus === CALL_STATUS.IN_CALL</code>），忽略相关消息
          </li>
          <li>避免因为收到其他消息而意外挂断当前通话</li>
        </ul>
      </div>

      <div style={{ border: '1px solid #blue', padding: '10px', backgroundColor: '#f0f0ff' }}>
        <h3>预期行为:</h3>
        <ul>
          <li>正在通话中收到邀请 → 发送 'busy' 消息</li>
          <li>对方收到 'busy' 消息 → 发送 'cancelCall' 消息</li>
          <li>收到 'cancelCall' 消息 → 检查当前状态，如果在通话中则忽略</li>
          <li>当前通话继续进行，不受影响</li>
        </ul>
      </div>
    </div>
  );
};

export default BusyTestSimple;
