Compare UIKit 1.2 and 1.1

1. More versatile UI style 1.2: After redesign, the UI style has become more versatile and suitable for more scenarios 1.1: Purple gradient bubbles, random image avatars are not universal enough

2. More components 1.2:

   - Container components: `UIKitProvider`, `ConversationList`.
   - Module components: `BaseMessage`, `AudioMessage`, `FileMessage`， `VideoMessage`, `ImageMessage`, `TextMessage`, `Header`, `Empty`, `MessageList`, `ConversationItem`, `MessageEditor`, `MessageStatus`.
   - Pure UI components: `Avatar`, `Badge`, `Button`, `Checkbox`, `Icon`, `Modal`, `Tooltip`. 1.1: `ChatApp`, `EaseChat`

3. Support for more languages 1.2: By default, it supports Chinese and English, and can be expanded to any language on its own 1.1: Supports Chinese, English, and cannot be extended to other languages

4. More convenient to modify styles 1.2:

   - Each component is styled through class style
   - Modifying themes through variables defined by scss coverage
   - Fixed class, can find element override styles
   - Configure global primary color

     1.1: No ability to modify styles provided, only source code can be modified

5. Support for more custom functions 1.2: Most of the content can be customized through the `renderX` method of different components 1.1: Only supports custom header

6. More detailed documentation 1.2: Multiple documents are provided to explain how to quickly start, customize, and provide a storybook to explain the usage of each component 1.1: Only one document

7. Support Typescript

   - 1.1: javascript
   - 1.2: typescript

8. Provides richer functionality

Added functions such as translation, merging and forwarding, multiple selection and deletion, editing after sending, and referencing

9. More flexible features selection which can globally configure which features are needed

## [Unreleased]

### Added

- Support for custom user info providers in CallKit
- Enhanced error handling and logging for group member fetching
- Improved user information consistency across different call states
- Added comprehensive avatar display test page for 1v1 video calls

### Fixed

- Fixed nickname display inconsistency between pre-connection and post-connection states
- Fixed hardcoded avatar URLs in CallKit components
- Fixed group call member information fetching and display
- Fixed avatar display issues in minimized video windows
- **Fixed 1v1 video call avatar display when camera is turned off**

  - Fixed issue where closing camera in 1v1 video calls showed default avatar instead of real user avatar
  - Added proper user information caching for both caller and callee in CallService
  - Ensured caller sets callee user info when initiating 1v1 calls
  - Ensured callee sets caller user info when receiving invitations
  - Fixed user-unpublished event handling to use cached user information

- **Added preview mode button disable functionality**
  - Disabled microphone, camera, speaker, and screen sharing buttons in preview mode
  - Kept accept and hangup buttons functional in preview mode
  - Added visual feedback for disabled buttons with reduced opacity and disabled cursor
  - Enhanced user experience by focusing on essential actions in preview mode
  - Added comprehensive test page for preview button disable functionality
