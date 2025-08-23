# 实现首次通话

利用环信 CallKit，你可以轻松实现一对一通话和群组通话功能。本文介绍如何快速实现发起音视频通话。

## 推荐环境

- Android SDK: API Level 24 及以上
- Android Studio: 推荐最新版本
- Kotlin: 2.0.21
- JDK: 17
- Gradle version: 8.13

## 快速开始

### 第一步 获取配置信息

在 [环信控制台](https://console.easemob.com/user/login) 进行如下操作：

1. [创建应用](/product/console/app_create.html)，[获取应用的 App Key](/product/console/app_manage.html#获取应用凭证)，格式为 `orgname#appname`。
2. [开通音视频服务](service_activation.html) // TODO：最终替换
3. [创建多个测试用户](/product/console/operation_user.html#创建用户)。
4. [创建群组](/product/console/operation_group.html#创建群组)，获取群组 ID。
5. 将测试用户加入群组。

### 第二步 创建项目

本节介绍将环信 CallKit 引入项目中的必要环境配置。

本示例使用 `Android Studio Narwhal | 2025.1.1`、`gradle version : 8.13` 和 `gradle plugin version:8.11.1`。你也可以直接参考 Android Studio 官网文档 [创建应用](https://developer.android.com/studio/projects/create-project)。

1. 打开 Android Studio，点击左上角菜单 **File > New > New Project**。
2. 在 **New Project** 界面，**Phone and Tablet** 标签下，选择 **Empty Views Activity**，然后点击 **Next**。
3. 在 **Empty Views Activity** 界面，依次填入以下内容：
   - **Name**：你的 Android 项目名称，如 CallKitQuickstart。
   - **Package name**：你的项目包的名称，如 com.hyphenate.callkit.quickstart。
   - **Save location**：项目的存储路径。
   - **Language**：项目的编程语言，如 Kotlin。
   - **Minimum SDK**：项目的最低 API 等级，如 API 21。
   - **Build configuration language**：工程构建语言，如 Groovy DSL(build.gradle)。
4. 点击 **Finish**。根据屏幕提示，安装所需插件。

### 第三步 引入 CallKit

#### 添加依赖

**远程依赖**

- 在 Project 工程根目录下的 `settings.gradle.kts` 文件内，添加 `mavenCentral()` 仓库：

```kotlin
pluginManagement {
   repositories {
      ...
      mavenCentral()
   }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        ...
        mavenCentral()
    }
}
```

- 在 app(module) 目录的 `build.gradle.kts` 文件中添加以下依赖：

```kotlin
dependencies {
    ...
    implementation("io.hyphenate:call-kit:4.16.0")
}
```

**本地依赖**

从 GitHub 获取音视频 [CallKit 源码](https://www.xxxxx.com)，克隆到本地。按照下面的方式集成： // TODO：添加 CallKit 源码链接。

- 在 Project 工程根目录下的 `settings.gradle.kts` 文件中添加如下代码：

```kotlin
include(":ease-call-kit")
// "../chatcallkit-android"要替换成你clone下来的实际工程路径，后边要拼接"/ease-call-kit"
project(":ease-call-kit").projectDir = File("../chatcallkit-android/ease-call-kit")
```

- 在 app(module) 目录的 `build.gradle.kts` 文件中添加如下代码：

```kotlin
dependencies {
    ...
    implementation(project(":ease-call-kit"))
}
```

#### 配置 ViewBinding

在 app 项目的 `build.gradle.kts` 文件中添加如下代码：

```kotlin
android {
    ...
    buildFeatures{
        viewBinding = true
    }
}
```

### 第四步 Android Support 库向 AndroidX 转换配置

在 `Project` 工程根目录下的 `gradle.properties` 文件中额外添加如下配置：

```
android.enableJetifier=true
```

### 第五步 防止代码混淆

在 app 的 `proguard-rules.pro` 文件中添加如下代码：

```
-keep class com.hyphenate.** {*;}
-dontwarn  com.hyphenate.**
-keep class io.agora.** {*;}
-dontwarn  io.agora.**
```

### 第六步 创建快速开始页面

1. 打开 `app/src/main/res/values/strings.xml` 文件，替换为如下内容。

你需要将 **app_key** 替换为你申请的环信 App Key。

```xml
<resources>
    <string name="app_name">CallKitQuickstart</string>
    <string name="app_key">app_key</string>
</resources>
```

2. 打开 `app/src/main/res/layout/activity_main.xml` 文件，替换为如下内容：

```xml
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/main"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:padding="16dp"
    tools:context=".MainActivity">

    <View
        android:id="@+id/statusIndicator"
        android:layout_width="0dp"
        android:layout_height="8dp"
        android:layout_marginTop="16dp"
        android:background="#808080"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    <TextView
        android:id="@+id/tvConnectionStatus"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="连接状态: 未连接"
        android:textSize="14sp"
        android:textColor="#666666"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/statusIndicator" />

    <EditText
        android:id="@+id/etUserId"
        android:layout_width="0dp"
        android:layout_height="50dp"
        android:layout_marginTop="24dp"
        android:hint="用户ID"
        android:singleLine="true"
        android:maxLines="1"
        android:imeOptions="actionNext"
        android:inputType="text"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/tvConnectionStatus" />

    <EditText
        android:id="@+id/etPassword"
        android:layout_width="0dp"
        android:layout_height="50dp"
        android:layout_marginTop="16dp"
        android:hint="密码"
        android:singleLine="true"
        android:maxLines="1"
        android:imeOptions="actionDone"
        android:inputType="textPassword"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/etUserId" />

    <Button
        android:id="@+id/btnLogin"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="登录"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/etPassword" />

    <Button
        android:id="@+id/btnLogout"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="登出"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/btnLogin" />

    <EditText
        android:id="@+id/etPeerId"
        android:layout_width="0dp"
        android:layout_height="50dp"
        android:layout_marginTop="24dp"
        android:hint="对方用户ID"
        android:singleLine="true"
        android:maxLines="1"
        android:imeOptions="actionDone"
        android:inputType="text"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/btnLogout" />

    <Button
        android:id="@+id/btnSingleVideo"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="16dp"
        android:text="发起单人视频通话"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/etPeerId" />

    <Button
        android:id="@+id/btnSingleAudio"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="发起单人音频通话"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/btnSingleVideo" />

    <EditText
        android:id="@+id/etGroupId"
        android:layout_width="0dp"
        android:layout_height="50dp"
        android:layout_marginTop="16dp"
        android:hint="群组ID"
        android:singleLine="true"
        android:maxLines="1"
        android:imeOptions="actionDone"
        android:inputType="text"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/btnSingleAudio" />

    <Button
        android:id="@+id/btnMultipleVideo"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:text="发起多人音视频通话"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/etGroupId" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 第七步 实现代码逻辑

1. 初始化 CallKit。
2. 实现登录和退出逻辑。
3. 实现通话功能。

打开 `MainActivity` 文件，替换为如下代码：

```kotlin
package com.hyphenate.callkit.quickstart

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.hyphenate.callkit.CallKitClient
import com.hyphenate.callkit.CallKitConfig
import com.hyphenate.callkit.bean.CallType
import com.hyphenate.callkit.bean.CallEndReason
import com.hyphenate.callkit.bean.CallInfo
import com.hyphenate.callkit.interfaces.CallKitListener
import com.hyphenate.callkit.utils.ChatClient
import com.hyphenate.callkit.utils.ChatCallback
import com.hyphenate.callkit.utils.ChatOptions
import com.hyphenate.callkit.utils.ChatConnectionListener
import com.hyphenate.callkit.quickstart.databinding.ActivityMainBinding
import com.hyphenate.callkit.utils.ChatLog
import io.agora.rtc2.RtcEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject
import android.view.KeyEvent
import android.view.inputmethod.InputMethodManager
import android.view.inputmethod.EditorInfo
import android.content.Context

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private var isLoggedIn = false
    private val TAG = this::class.simpleName

    // CallKit 监听器
    private val rtcListener: CallKitListener = object : CallKitListener {

        override fun onEndCallWithReason(reason: CallEndReason, callInfo: CallInfo?) {
            runOnUiThread {
                val msg = "通话结束: $reason ,callInfo: $callInfo"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        override fun onCallError(
            errorType: CallKitClient.CallErrorType,
            errorCode: Int,
            description: String?
        ) {
            runOnUiThread {
                val msg = "通话错误: $errorType ,errorCode: $errorCode ,description: $description"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        override fun onReceivedCall(userId: String, callType: CallType, ext: JSONObject?) {
            runOnUiThread {
                val msg = "收到通话邀请: $userId ,callType: $callType ,ext: $ext"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        override fun onRemoteUserJoined(userId: String, callType: CallType, channelName: String) {
            runOnUiThread {
                val msg = "远端用户加入: $userId ,callType: $callType ,channelName: $channelName"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        override fun onRemoteUserLeft(userId: String, callType: CallType, channelName: String) {
            runOnUiThread {
                val msg = "远端用户离开: $userId ,callType: $callType ,channelName: $channelName"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

        override fun onRtcEngineCreated(engine: RtcEngine) {
            runOnUiThread {
                val msg = "RTC引擎创建: $engine"
                ChatLog.d(TAG, msg)
                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
            }
        }

    }

    // 连接状态监听器
    private val connectionListener = object : ChatConnectionListener {
        override fun onConnected() {
            runOnUiThread {
                updateConnectionStatus(true, "连接状态: 已连接")
            }
        }

        override fun onDisconnected(errorCode: Int) {
            runOnUiThread {
                updateConnectionStatus(false, "连接状态: 已断开")
            }
        }

        override fun onLogout(errorCode: Int) {
            runOnUiThread {
                updateConnectionStatus(false, "连接状态: 已登出")
                isLoggedIn = false
                updateButtonStates()
            }
        }

        override fun onTokenExpired() {
            runOnUiThread {
                updateConnectionStatus(false, "连接状态: Token已过期")
                showToast("Token已过期，请重新登录")
            }
        }

        override fun onTokenWillExpire() {
            runOnUiThread {
                showToast("Token即将过期")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        initCallKit()
        setupClickListeners()
        updateButtonStates()
        setupConnectionListener()
    }

    private fun initCallKit() {
        val appkey = getString(R.string.app_key)
        if (appkey.isEmpty()) {
            showToast("请先设置您的AppKey!")
            return
        }

        // 初始化环信 IM SDK
        val options = ChatOptions().apply {
            this.appKey = appkey
            autoLogin = false
        }
        ChatClient.getInstance().init(this, options)
        ChatClient.getInstance().setDebugMode(true)

        // 初始化 CallKit
        val config = CallKitConfig()

        CallKitClient.init(this, config)
        CallKitClient.callKitListener = rtcListener
    }

    private fun setupConnectionListener() {
        ChatClient.getInstance().addConnectionListener(connectionListener)
        updateConnectionStatus(false, "连接状态: 未连接")
    }

    private fun updateConnectionStatus(isConnected: Boolean, statusText: String) {
        binding.tvConnectionStatus.text = statusText
        if (isConnected) {
            binding.statusIndicator.setBackgroundColor(0xFF4CAF50.toInt()) // 绿色
            binding.tvConnectionStatus.setTextColor(0xFF4CAF50.toInt())
        } else {
            binding.statusIndicator.setBackgroundColor(0xFF808080.toInt()) // 灰色
            binding.tvConnectionStatus.setTextColor(0xFF808080.toInt())
        }
    }

    private fun setupClickListeners() {
        // 设置键盘监听
        setupKeyboardListeners()

        binding.btnLogin.setOnClickListener {
            val username = binding.etUserId.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            if (username.isEmpty() || password.isEmpty()) {
                showToast("用户名或密码不能为空!")
                return@setOnClickListener
            }
            login(username, password)
        }

        binding.btnLogout.setOnClickListener { logout() }
        binding.btnSingleVideo.setOnClickListener { startSingleVideoCall() }
        binding.btnSingleAudio.setOnClickListener { startSingleAudioCall() }
        binding.btnMultipleVideo.setOnClickListener { startMultipleVideoCall() }
    }

    private fun setupKeyboardListeners() {
        // 为用户 ID 输入框添加键盘监听
        binding.etUserId.setOnEditorActionListener { _, actionId, event ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_DONE ||
                actionId == android.view.inputmethod.EditorInfo.IME_ACTION_NEXT ||
                (event?.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)) {
                hideKeyboard()
                true
            } else {
                false
            }
        }

        // 为密码输入框添加键盘监听
        binding.etPassword.setOnEditorActionListener { _, actionId, event ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_DONE ||
                actionId == android.view.inputmethod.EditorInfo.IME_ACTION_NEXT ||
                (event?.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)) {
                hideKeyboard()
                true
            } else {
                false
            }
        }

        // 为对方用户 ID 输入框添加键盘监听
        binding.etPeerId.setOnEditorActionListener { _, actionId, event ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_DONE ||
                actionId == android.view.inputmethod.EditorInfo.IME_ACTION_NEXT ||
                (event?.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)) {
                hideKeyboard()
                true
            } else {
                false
            }
        }

        // 为群组 ID 输入框添加键盘监听
        binding.etGroupId.setOnEditorActionListener { _, actionId, event ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_DONE ||
                actionId == android.view.inputmethod.EditorInfo.IME_ACTION_NEXT ||
                (event?.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)) {
                hideKeyboard()
                true
            } else {
                false
            }
        }
    }

    private fun hideKeyboard() {
        val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        currentFocus?.let { view ->
            inputMethodManager.hideSoftInputFromWindow(view.windowToken, 0)
            view.clearFocus()
        }
    }

    private fun login(username: String, password: String) {
        if (isLoggedIn) {
            showToast("已经登录")
            return
        }

        ChatClient.getInstance().login(username, password, object : ChatCallback {
            override fun onSuccess() {
                runOnUiThread {
                    isLoggedIn = true
                    updateButtonStates()
                    showToast("登录成功")
                }
            }

            override fun onError(code: Int, error: String?) {
                runOnUiThread {
                    showToast("登录失败: $error")
                }
            }
        })
    }

    private fun logout() {
        if (!isLoggedIn) {
            showToast("尚未登录")
            return
        }

        ChatClient.getInstance().logout(true, object : ChatCallback {
            override fun onSuccess() {
                runOnUiThread {
                    updateConnectionStatus(false, "连接状态: 已登出")
                    isLoggedIn = false
                    updateButtonStates()
                    CallKitClient.exitCall()
                    showToast("登出成功")
                }
            }

            override fun onError(code: Int, error: String?) {
                runOnUiThread {
                    showToast("登出失败: $error")
                }
            }
        })
    }

    private fun startSingleVideoCall() {
        if (!isLoggedIn) {
            showToast("请先登录")
            return
        }

        val remoteUserID = binding.etPeerId.text.toString().trim()
        if (remoteUserID.isEmpty()) {
            showToast("对方用户ID不能为空")
            return
        }

        CallKitClient.startSingleCall(CallType.SINGLE_VIDEO_CALL, remoteUserID, null)
    }

    private fun startSingleAudioCall() {
        if (!isLoggedIn) {
            showToast("请先登录")
            return
        }

        val remoteUserID = binding.etPeerId.text.toString().trim()
        if (remoteUserID.isEmpty()) {
            showToast("对方用户ID不能为空")
            return
        }

        CallKitClient.startSingleCall(CallType.SINGLE_VOICE_CALL, remoteUserID, null)
    }

    private fun startMultipleVideoCall() {
        if (!isLoggedIn) {
            showToast("请先登录")
            return
        }

        val groupID = binding.etGroupId.text.toString().trim()
        if (groupID.isEmpty()) {
            showToast("群组ID不能为空")
            return
        }

        CallKitClient.startInviteMultipleCall(groupID, null)
    }

    private fun updateButtonStates() {
        binding.btnLogin.isEnabled = !isLoggedIn
        binding.btnLogout.isEnabled = isLoggedIn
        binding.btnSingleVideo.isEnabled = isLoggedIn
        binding.btnSingleAudio.isEnabled = isLoggedIn
        binding.btnMultipleVideo.isEnabled = isLoggedIn
    }

    override fun onDestroy() {
        super.onDestroy()
        ChatClient.getInstance().removeConnectionListener(connectionListener)
    }

    private fun showToast(msg: String) {
        CoroutineScope(Dispatchers.Main).launch {
            Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
        }
    }
}
```

点击 Android Studio 菜单栏中的 `Sync Project with Gradle Files` 同步工程。现在可以测试你的应用。

### 第八步 发起首次通话

1. 输入用户 ID 和密码，点击 **登录**。
2. 等待连接状态指示器变绿，显示 **已连接**。
3. 发起通话：
   - 一对一视频通话：输入对方用户 ID，点击 **发起一对一视频通话**。
   - 一对一音频通话：输入对方用户 ID，点击 **发起一对一音频通话**。
   - 群组通话：输入群组 ID，点击 **发起群组音视频通话**。

quickstart_run.png

## 测试应用

测试前，你需要了解以下几方面：

- 首次使用时需要授权摄像头、麦克风、悬浮窗等权限。
- 确保设备网络连接正常。
- 测试多人通话时，需要先创建群组并获取群组 ID。
- 建议在真机上测试音视频功能以获得最佳体验。

按照以下步骤进行测试：

1. 在 Android Studio 中，点击 **Run 'app'**，将应用运行到你的设备或者模拟器上。
2. 输入用户 ID 和密码，点击 **登录** 进行登录，登录成功或者失败有 `Toast` 提示。
3. 在另一台设备或者模拟器上登录另一个账号。
4. 两台设备分别输入对方的账号，点击对应的通话按钮，即可发起音视频通话。

测试过程中的常见问题排查如下：

- 连接失败：检查 App Key 是否正确配置。
- 通话无声音：检查麦克风权限是否已授权。
- 视频无画面：检查摄像头权限是否已授权。
- 群组通话失败：确认群组 ID 是否正确且用户已加入该群组。
