# 跑通示例项目

本文档基于 MainActivity 示例，帮助你快速集成和运行环信 CallKit，实现一对一音视频通话和群组音视频通话功能。

## 推荐环境

- Android SDK: API Level 24 及以上
- Android Studio: 推荐最新版本
- Kotlin: 2.0.21
- JDK: 17
- Gradle：gradle-8.9-bin.zip
- [有效的环信账号](/product/console/account_register.html#注册账号)。

## 操作步骤

### 第一步 获取配置信息

在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

1. [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
2. [开通音视频服务](service_activation.html) // TODO：最终替换
3. [创建多个测试用户](/product/console/operation_user.html#创建用户)。
4. [创建群组](/product/console/operation_group.html#创建群组)，获取群组 ID。
5. 将测试用户加入群组。

### 第二步 项目配置

1. 克隆或下载项目。

```bash
git clone [项目地址]
```

2. 在 Android Studio 中打开项目。

选择 **File** > **New** > **Import Project**，导入下载或克隆的项目 `chatcallkit-android`。

3. 等待 Gradle 同步完成。

### 第三步 修改配置

在 `MainActivity.kt` 中进行如下修改：

```kotlin
private val selfUserID = "your_user_id"        // 你的用户 ID
private val remoteUserID = "target_user_id"    // 对方用户 ID，用于一对一音视频通话
private val groupID = "your_group_id"          // 群组 ID
private val imAppkey = "your_org#your_app"     // 你的 App Key
```

### 第四步 运行应用

1. 连接 Android 设备或启动模拟器。
2. 点击 **Run ‘app’** 运行应用。

### 第五步 测试通话功能

1. 点击 **登录**。
2. 等待连接：观察连接状态指示器变绿。
3. 发起通话：
   - 一对一视频通话：点击 **发起一对一视频通话**。
   - 一对一音频通话：点击 **发起一对一音频通话**。
   - 群组通话：点击 **发起群组音视频通话**。
4. 在弹出的页面中授权必要权限（摄像头、麦克风、悬浮窗等）。
5. 点击 **登出** 退出登录。

quickstart_run.png

## 功能说明 

### CallKit 初始化

```kotlin
private fun initCallKit() {
    // 1. 初始化环信 IM SDK
    val options = ChatOptions().apply {
        appKey = imAppkey  // 使用你的 App Key
        autoLogin = false
    }
    ChatClient.getInstance().init(this, options)
    ChatClient.getInstance().setDebugMode(true)
    
    // 2. 初始化 CallKit
    val config = CallKitConfig().apply {
        // 铃声配置（可选）
        outgoingRingFile = "assets://outgoing_ring.mp3"
        incomingRingFile = "assets://incoming_ring.mp3"
        dingRingFile = "assets://ding.mp3"
    }
    
    CallKitClient.init(this, config)
}
```

### 连接状态监听

```kotlin
private val connectionListener = object : ChatConnectionListener {
    override fun onConnected() {
        // 连接成功 - 绿色指示器
    }
    
    override fun onDisconnected(errorCode: Int) {
        // 连接断开 - 灰色指示器
    }
    
    // ... 其他回调
}
```

### 通话事件监听

```kotlin
private val rtcListener: CallKitListener = object : CallKitListener {
    override fun onReceivedCall(userId: String, callType: CallType, ext: JSONObject?) {
        // 收到通话邀请
    }
    
    override fun onEndCallWithReason(reason: CallEndReason, callInfo: CallInfo?) {
        // 通话结束
    }
    
    override fun onCallError(errorType: CallKitClient.CallErrorType, errorCode: Int, description: String?) {
        // 通话错误
    }
    
    // ... 其他回调
}
```

### 发起音视频通话

```kotlin
// 一对一视频通话
CallKitClient.startSingleCall(CallType.SINGLE_VIDEO_CALL, remoteUserID, null)

// 一对一音频通话  
CallKitClient.startSingleCall(CallType.SINGLE_VOICE_CALL, remoteUserID, null)

// 群组通话
CallKitClient.startInviteMultipleCall(groupID, null)
```

## （可选）铃声配置

例如，将铃声文件放在以下路径：

```
app/src/main/assets/
├── outgoing_ring.mp3  # 呼出铃声
├── incoming_ring.mp3  # 来电铃声
└── ding.mp3          # 结束铃声
```

铃声文件路径的配置代码如下所示：

```kotlin
val config = CallKitConfig().apply {
    // assets 文件夹
    outgoingRingFile = "assets://outgoing_ring.mp3"
    incomingRingFile = "assets://incoming_ring.mp3"
    dingRingFile = "assets://ding.mp3"
    
    // res/raw 文件夹
    // outgoingRingFile = "raw://music.mp3"
    
    // 绝对路径
    // outgoingRingFile = "/path/to/your/ringtone.mp3"
}
```

### （可选）自定义用户信息

```kotlin
// 实现 CallInfoProvider 接口
 CallKitClient.callInfoProvider = object : CallInfoProvider {

            override fun asyncFetchUsers(
                userIds: List<String>,
                onValueSuccess: OnValueSuccess<List<CallKitUserInfo>>
            ) {
                // 模拟从服务器获取用户信息
                val userInfos = userIds.map { userId ->
                    CallKitUserInfo(
                        userId = userId, 
                        nickName = "用户 $userId",
                        avatar = "https://example.com/avatar/$userId.png")
                }
                onValueSuccess.invoke(userInfos)
            }

            override fun asyncFetchGroupInfo(
                groupId: String,
                onValueSuccess: OnValueSuccess<CallKitGroupInfo>
            ) {
                // 模拟从服务器获取群组信息
                val groupInfo = CallKitGroupInfo(
                    groupID = groupId,
                    groupName = "群组 $groupId",
                    groupAvatar = "https://example.com/group_avatar/$groupId.png"
                )
                onValueSuccess.invoke(groupInfo)
            }
        }
```

## 常见问题


| 错误类型           | 描述   |
| :-------------- | :----- |
| 登录失败      |  - **检查 App Key**：App Key 的格式为 `orgname#appname`，需确保格式正确。<br/> - **检查网络**：确保设备可访问网络。 <br/> - **用户不存在**：确保已在环信控制台创建用户。| 
| 通话无法建立  |  - **权限问题**：确保已授权摄像头、麦克风权限。<br/> - **对方离线**：确保接听方在线且已登录。 <br/> - **网络问题**：检查网络连接状况。  | 
| 音视频问题 |  - **无声音**：检查麦克风权限和音频设备。<br/> - **无画面**：检查摄像头权限。 <br/> - **画面卡顿**：检查网络带宽。   | 
| 编译错误      | **依赖冲突**：清理项目后重新构建，详见表格下方代码。| 

清理项目后重新构建的代码如下：

```bash
./gradlew clean
./gradlew build
```
