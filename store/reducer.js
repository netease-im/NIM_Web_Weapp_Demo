import {INITIAL_STATE} from './store.js'
let app = getApp()

let indexReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    // IM：收到个人信息
    case 'IM_OnMyInfo':{
      return Object.assign({}, state, {
        userInfo: action.payload
      })
    }
    // Login：开始登陆，转菊花
    case 'Login_StartLogin':{
      return Object.assign({}, state, {
        isLogin: true
      })
    }
    // Login：登陆成功，停止转菊花
    case 'Login_LoginSuccess':{
      return Object.assign({}, state, {
        isLogin: false
      })
    }
    // Register：开始注册，转菊花
    case 'Register_StartRegister': {
      return Object.assign({}, state, {
        isRegister: true
      })
    }
    // Register：注册成功，停止转菊花
    case 'Register_RegisterSuccess': {
      return Object.assign({}, state, {
        isRegister: false
      })
    }
    // UserInfo：个人更新头像
    case 'UserInfo_Update_Avatar': {
      let temp = Object.assign({}, state)
      temp.userInfo['avatar'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新昵称
    case 'UserInfo_Update_Nick': {
      let temp = Object.assign({}, state)
      temp.userInfo['nick'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新性别
    case 'UserInfo_Update_Gender': {
      let temp = Object.assign({}, state)
      temp.userInfo['gender'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新生日
    case 'UserInfo_Update_Birthday': {
      let temp = Object.assign({}, state)
      temp.userInfo['birth'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新电话
    case 'UserInfo_Update_Tel': {
      let temp = Object.assign({}, state)
      temp.userInfo['tel'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新邮箱
    case 'UserInfo_Update_Email': {
      let temp = Object.assign({}, state)
      temp.userInfo['email'] = action.payload
      return Object.assign({}, state, temp)
    }
    // UserInfo：个人更新签名
    case 'UserInfo_Update_Sign': {
      let temp = Object.assign({}, state)
      temp.userInfo['sign'] = action.payload
      return Object.assign({}, state, temp)
    }
    // CurrentChatTo：登录用户的聊天对象改变
    case 'CurrentChatTo_Change': {
      let temp = Object.assign({}, state)
      temp['currentChatTo'] = action.payload
      return Object.assign({}, state, temp)
    }
    // FriendCard：登录初始化获取后更新
    case 'FriendCard_Update_Initial': { // 初始化好友卡片
      let friends = action.payload
      let temp = Object.assign({}, state)
      friends.map(friend => {
        // 设置默认好友登录状态
        if (!temp.friendCard[friend.account]) {
          friend.status = '离线'
        } else if (!temp.friendCard[friend.account].status) {
          friend.status = '离线'
        }
        friend.isFriend = true // 好友标记位
        // blackList数据在friend之前，需要合并之前的数据
        temp.friendCard[friend.account] = Object.assign({}, friend, temp.friendCard[friend.account])
      })
      return Object.assign({}, state, temp)
    }
    // FriendCard：更新指定好友名片信息，携带名片数据
    case 'FriendCard_Update_InfoCard': {
      let tempState = Object.assign({}, state)
      let card = action.payload
      // 触发状态更新时friendCard可能为空
      if (!tempState.friendCard[card.account]) {
        tempState.friendCard[card.account] = {}
      }
      tempState.friendCard[card.account] = Object.assign({}, tempState.friendCard[card.account], card)
      return Object.assign({}, state, tempState)
    }
    // FriendCard：更新非好友名片信息(搜索时存进来)，携带名片数据
    case 'FriendCard_Update_NonFriendInfoCard': {
      let tempState = Object.assign({}, state)
      let card = action.payload
      // 触发状态更新时friendCard可能为空
      if (!tempState.friendCard[card.account]) {
        tempState.friendCard[card.account] = {}
      }
      card.isFriend = false
      tempState.friendCard[card.account] = Object.assign({}, tempState.friendCard[card.account], card)
      return Object.assign({}, state, tempState) 
    }
    // FriendCard：更新指定好友在线状态
    case 'FriendCard_Update_Online_Status': {
      let tempState = Object.assign({}, state)
      let statusArr = action.payload
      statusArr.map(item => {
        // 触发状态更新时friendCard可能为空
        if (!tempState.friendCard[item.account]) {
          tempState.friendCard[item.account] = {}
        }
        tempState.friendCard[item.account].status = item.status
        tempState.onlineList[item.account] = item.status
      })
      return Object.assign({}, state, tempState)
    }
    // FriendCard：删除好友，依据account
    case 'FriendCard_Delete_By_Account': {
      let tempState = Object.assign({}, state)
      let account = action.payload
      delete tempState.friendCard[account]
      return Object.assign({}, state, tempState)
    }
    // FriendCard：添加好友
    case 'FriendCard_Add_Friend': {
      let tempState = Object.assign({}, state)
      let card = action.payload
      card.isFriend = true // 标记好友
      card.status = '离线' // 默认状态是离线
      tempState.friendCard[card.account] = card
      return Object.assign({}, state, tempState)
    }
    // Blacklist：登录成功后获取的初始化黑名单
    case 'Blacklist_Update_Initial': {
      // 发送来了黑名单就在好友名片信息中添加标志位
      let tempState = Object.assign({}, state)
      let blacklist = action.payload // [{account}, invalid: []]
      blacklist.map(item => {
        // 触发黑名单时friendCard为空
        if (item.account) {
          if (!tempState.friendCard[item.account]) {
            tempState.friendCard[item.account] = {}
            tempState.friendCard[item.account].isFriend = false //没有任何用户信息，非好友状态下拉黑
          }
          tempState.friendCard[item.account].isBlack = true
        }
      })
      return Object.assign({}, state, tempState)
    }
    // Blacklist：拉黑或取消拉黑
    case 'Blacklist_Update_MarkInBlacklist': {
      let tempState = Object.assign({}, state)
      let blackUser = action.payload // {account, isBlack, addTime}
      if (!tempState.friendCard[blackUser.account]) {
        tempState.friendCard[blackUser.account] = {}
      }
      tempState.friendCard[blackUser.account].isBlack = blackUser.isBlack
      tempState.friendCard[blackUser.account].addTime = blackUser.addTime
      return Object.assign({}, state, tempState)
    }
    // RawMessageList：存储原始消息
    case 'RawMessageList_Add_Msg': {
      let tempState = Object.assign({}, state)
      let msg = action.payload
      let account = ''
      if (msg.flow == 'out') {
        account = msg.to
      } else {
        account = msg.from
      }
      if (!tempState.rawMessageList[account]) {
        tempState.rawMessageList[account] = {}
      }
      tempState.rawMessageList[account][msg.time] = Object.assign({}, msg)
      return Object.assign({}, state, tempState)
    }
    // RawMessageList：存储漫游消息
    case 'RawMessageList_Add_RoamingMsgList': {
      let tempState = Object.assign({}, state)
      let msgList = action.payload.msgs
      let account = action.payload.to
      msgList.map(msg => {
        if (!tempState.rawMessageList[account]) {
          tempState.rawMessageList[account] = {}
        }
        tempState.rawMessageList[account][msg.time] = Object.assign({}, msg)
      })
      return Object.assign({}, state, tempState)
    }
    // RawMessageList：替换其中的指定消息
    case 'RawMessageList_Replace_Message': {
      let tempState = Object.assign({}, state)
      let msg = action.payload
      let account = ''
      if (msg.flow == 'out') {
        account = msg.to
      } else {
        account = msg.from
      }
      tempState.rawMessageList[account][msg.time] = Object.assign({}, msg)
      return Object.assign({}, state, tempState)
    }
    // RawMessageList：自己撤回消息
    case 'RawMessageList_Recall_Msg': {
      let tempState = Object.assign({}, state)
      let msg = action.payload
      let account = msg.to
      // 替换原始文件消息，使得页面展示撤回消息提示
      tempState.rawMessageList[account][msg.time] = Object.assign({}, msg, {
        tip: '你撤回了一条消息',
        type: 'tip'
      })
      return Object.assign({}, state, tempState)
    }
    // RawMessageList：对端撤回消息
    case 'RawMessageList_OppositeRecall_Msg': {
      let tempState = Object.assign({}, state)
      let deleteInfo = action.payload
      let account = deleteInfo.msg.from
      let msgSendTime = deleteInfo.deletedMsgTime // 撤回的消息的发送时间
      let deletedMsg = tempState.rawMessageList[account][msgSendTime] // 之前发送的老消息
      tempState.rawMessageList[account][deleteInfo.time] = Object.assign({}, deletedMsg, {
        type: 'tip',
        tip: `${deleteInfo.deletedMsgFromNick}撤回了一条消息`,
        time: deleteInfo.time
      }) // 修改删除的消息主体内容后存储到全局
      delete tempState.rawMessageList[account][deleteInfo.deletedMsgTime] // 删除老的消息
      return Object.assign({}, state, tempState)
    }
    // Notification：对端将你添加为好友
    case 'Notification_Opposite_AddFriend': {
      let tempState = Object.assign({}, state)
      let payload = action.payload
      tempState.notificationList.system.push(payload)
      return Object.assign({}, state, tempState)
    }
    // Notification：对端将你从好友列表中删除
    case 'Notification_Opposite_DeleteFriend': {
      let tempState = Object.assign({}, state)
      let payload = action.payload
      tempState.notificationList.system.push(payload)
      return Object.assign({}, state, tempState)
    }
    // Notification：清除指定条目的系统消息通知
    case 'Notification_Delete_Specified_System_By_Index': {
      let tempState = Object.assign({}, state)
      let index = action.payload
      tempState.notificationList.system.splice(index, 1)
      return Object.assign({}, state, tempState)
    }
    // Notification：清除指定条目的系统消息通知
    case 'Notification_Delete_Specified_Custom_By_Index': {
      let tempState = Object.assign({}, state)
      let index = action.payload
      tempState.notificationList.custom.splice(index, 1)
      return Object.assign({}, state, tempState)
    }
    // Notification：清除系统消息通知
    case 'Notification_Clear_System': {
      let tempState = Object.assign({}, state)
      tempState.notificationList.system = []
      return Object.assign({}, state, tempState)
    }
    // Notification：清除自定义消息通知
    case 'Notification_Clear_Custom': {
      let tempState = Object.assign({}, state)
      tempState.notificationList.custom = []
      return Object.assign({}, state, tempState)
    }
    // UnreadInfo：更新未读数
    case 'UnreadInfo_update': {
      let tempState = Object.assign({}, state)
      let updateSession = action.payload
      tempState.unreadInfo[updateSession.to] = updateSession.unread
      return Object.assign({}, state, tempState)
    }
    // Delete：清除与指定人的所有聊天记录
    case 'Delete_All_MessageByAccount': {
      let tempState = Object.assign({}, state)
      let account = action.payload
      if (tempState.rawMessageList[account]) {
        tempState.rawMessageList[account] = {}
      }
      return Object.assign({}, state, tempState)
    }
    // Delete：删除指定人的指定时间的聊天记录
    case 'Delete_Single_MessageByAccount': {
      let tempState = Object.assign({}, state)
      let accountAndTime = action.payload
      if (tempState.rawMessageList[accountAndTime.account]) {
        delete tempState.rawMessageList[accountAndTime.account][accountAndTime.time]
      }
      return Object.assign({}, state, tempState)
    }
    // Reset：恢复出厂设置
    case 'Reset_All_State': {
      return INITIAL_STATE
    }
    default:
      return state
  }
}

export default indexReducer