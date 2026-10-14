# 通话远端语音转文字实验

本实验使用固定句子“你好，现在开始语音通话测试。”。`fixed-speech.wav` 是该句子的中文语音文件。发送端暂时把麦克风音轨换成文件音轨，通过实际 Agora RTC 通话发送；接收端使用浏览器 AudioWorklet 从已订阅的远端音轨读取 PCM 帧，保存为 WAV，提交给本机的 faster-whisper 服务识别。页面可试听接收到的录音，并显示识别文字与原文的比较结果。

## 准备

需要两位可正常登录 CallKit demo、可接通 RTC 的账号，以及 Python 环境。先安装本机识别依赖：

```bash
python3 -m venv /tmp/callkit-asr-venv
/tmp/callkit-asr-venv/bin/python -m pip install faster-whisper 'av<19'
HF_HOME=/tmp/callkit-hf /tmp/callkit-asr-venv/bin/python demo/callkit/asr-server.py
```

首次启动会下载 `base` 模型。可用 `CALLKIT_ASR_MODEL=small` 选择准确率更高、下载与运行开销也更大的模型。服务只监听 `127.0.0.1:8765`，`http://127.0.0.1:8765/health` 可检查是否就绪。

另开终端运行 `npm run dev:demo`，在两浏览器窗口打开 `http://127.0.0.1:5174/demo/callkit/call-demo.html`，使用两个账号登录并发起语音通话。

## 操作

1. 接收端点击“开始录制远端语音”。
2. 发送端点击“播放固定语音到通话”，等待页面提示播放完毕。
3. 接收端点击“停止并识别”，查看识别文字；也可直接试听页面上的远端录音。

录制和识别均在接收端浏览器及其本机 ASR 服务进行。页面不会把源文件直接发给识别服务。发送结束时会恢复发送端原来的麦克风音轨。建议保持录制时间短于 30 秒。

若页面显示没有远端音频帧，确认双方都已入会、接收端先开始录制，并在发送端播放后等待 1 秒再停止。若识别服务连接失败，检查服务是否正在运行，以及 demo 是否使用上述 `127.0.0.1:5174` 地址。

## Playwright 端到端测试

配置两个 CallKit 测试账号后，运行：

```bash
npm run test:e2e:callkit -- --grep 'callee transcribes speech sent through an RTC audio call'
```

用例会在服务未运行时自动启动 `asr-server.py`，测试后清理自己启动的进程；Playwright 配置会在独立的 5175 端口启动 demo 服务。默认使用 `/tmp/callkit-asr-venv/bin/python`，其他 Python 环境可通过 `CALLKIT_ASR_PYTHON` 指定，但该环境须已安装 `faster-whisper` 和 `av<19`。首次运行可能需要下载 `base` 模型。用例通过真实 RTC 音轨传输固定语音，要求识别结果与原文至少有 7 个按顺序重合的字，并把被叫录音和识别结果分别保存到测试附件 `callee-remote-audio.wav` 与 `rtc-transcription.json`。
