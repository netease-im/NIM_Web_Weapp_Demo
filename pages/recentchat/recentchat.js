import { calcTimeHeader, clickLogoJumpToCard } from '../../utils/util.js'
import { iconNoMessage } from '../../utils/imageBase64.js'
var app = getApp()
let startX = 0
Page({
  /**
   * 页面的初始数据
   */
  data: {
    iconNoMessage: '',
    loginUserAccount: '',
    translateX: 0,
    defaultUserLogo: '/images/default-icon.png',
    accountUnreadMap: {}, // {'zys1': 1}
    chatList: [], // [{account,nick,lastestMsg,type,timestamp,displayTime,message,unread,status}]
    chatAccount: {} // {accountName: accountName} 备注:消息通知key为notification
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 条目题目展示我的电脑
    this.setData({
      loginUserAccount: app.globalData.loginUser.account,
      iconNoMessage
    })
    wx.showLoading({
      title: '加载中',
      mask: true
    })

    let self = this
    wx.setNavigationBarTitle({
      title: '云信',
    })
    // 防止排序失败，再次排序
    for(let i=0; i<5; i++) {
      setTimeout(() => {
        self.sortChatList()
      }, i*1000)
    }
    setTimeout(() => {
      // self.checkRenderChatList()
      self.sortChatList()
      wx.hideLoading()
    }, 6*1000)
    if (Object.keys(app.globalData.recentChatList).length === 0) {
      this.setData({
        chatList: [],
        chatAccount: {}
      })
    } 
    // 监听好友状态列表
    app.globalData.subscriber.on('FRIEND_STATUS_UPDATE', function (updateAccounts) {
      setTimeout(() => {
        let chatList = [...self.data.chatList]
        for (let onlineAccount in app.globalData.onlineList) {
          chatList.map(msg => {
            if (msg.account === onlineAccount) {
              msg['status'] = app.globalData.onlineList[onlineAccount]
            }
          })
        }
        self.setData({
          chatList
        })
      }, 2000)
    })
    // 删除指定条目
    app.globalData.subscriber.on('DELETE_RECENT_CHAT_ITEM', function (data) {
      // console.log(data)
      let chatList = [...self.data.chatList]
      let chatAccount = Object.assign({}, self.data.chatAccount)
      let deleteIndex = null
      chatList.map((item, index) => {
        if(item.account === data.account) {
          deleteIndex = index
          return
        }
      })
      if (deleteIndex || deleteIndex === 0) {
        chatList.splice(deleteIndex, 1)
        delete chatAccount[data.account]
        self.setData({
          chatAccount,
          chatList
        })
      }
    })
    // 监听添加好友信号（自己操作）
    app.globalData.subscriber.on('ADD_NEW_FRIEND', function (data) {
      let msg = { type: 'addFriend', from: data.account || data.from, time: new Date().getTime() }
      self.addNotificationToChatList(msg)
      app.globalData.notificationList.push(msg)
    })
    // 监听删除好友信号（自己操作）
    app.globalData.subscriber.on('DELETE_OLD_FRIEND', function (data) {
      let msg = { type: 'deleteFriend', from: data.account || data.from, time: new Date().getTime() }
      self.addNotificationToChatList(msg)
      app.globalData.notificationList.push(msg)
    })
    // 监听删除单条通知消息（自己操作）
    // app.globalData.subscriber.on('DELETE_SINGLE_NOTIFICATION', function (data) {
    //   console.log(data)
    // })
    // 监听删除所有通知消息（自己操作）
    app.globalData.subscriber.on('DELETE_All_NOTIFICATION', function () {
      let deleteIndex = 0
      if (self.data.chatAccount['notification']) {
        let temp = self.data.chatList
        delete self.data.chatAccount['notification']
        temp.map((item, index) => {
          if(item.account === '消息通知') {
            deleteIndex = index
            return
          }
        })
        temp.splice(deleteIndex, 1)
        self.setData({
          chatList: temp
        })
      }
    })
    //  监听系统消息（他人操作）
    app.globalData.subscriber.on('RECEIVE_SYSTEM_MESSAGE', function (msg) {
      // console.log(msg)
      self.addNotificationToChatList(msg)
    })
    // 监听消息未读数
    // app.globalData.subscriber.on('UPDATE_UNREAD_RECENT_CHAT_ON_OFFLINE', function({account, unread}) {
    //   console.log(account, unread)
    //   let chatList = [...self.data.chatList]
    //   chatList.map(item => {
    //     if(item.account === account) {
    //       if(item['unread']) {
    //         item.unread = parseInt(item.unread) + parseInt(unread)
    //       } else {
    //         item.unread = unread
    //       }
    //     }
    //   })
    //   self.setData({
    //     chatList
    //   })
    // })
    // 其他端已读消息，本端清空未读数
    app.globalData.subscriber.on('CLEAR_UNREAD_RECENTCHAT_UPDATESESSION', function ({ account }) {
      // console.log(account)
      let chatList = [...self.data.chatList]
      chatList.map(item => {
        if (item.account === account) {
          item.unread = 0
        }
      })
      self.setData({
        chatList
      })
    })
    
    // 初始化时跟新未读数
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT_UNREAD_ON_SESSION', function ({ account, unread }) {
      // console.log('UPDATE_RECENT_CHAT_UNREAD_ON_SESSION', account, unread)
      let accountUnreadMap = Object.assign(self.data.accountUnreadMap)
      accountUnreadMap[account] = unread
      self.setData({
        accountUnreadMap
      })
    })
    // 收到消息，刷新最近会话列表
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT', self.updateRecentChat)
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT_ON_MSG', self.updateRecentChat)
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT_ON_SESSION', self.updateRecentChat)
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT_ON_OFFLINE', self.updateRecentChat)
    // 转发消息，刷新最近会话列表
    app.globalData.subscriber.on('UPDATE_RECENT_CHAT_FORWARDCONTACT', self.updateRecentChat)    
  },
  /**
   * 显示时排序
   */
  onShow() {
    this.sortChatList()
  },
  /**
   * 排序chatlist
   */
  sortChatList() {
    if (this.data.chatList.length !== 0) {
      let chatList = [...this.data.chatList]
      chatList.sort((a, b) => {
        return parseInt(b.timestamp) - parseInt(a.timestamp)
      })
      this.setData({
        chatList
      })
    }
  },
  checkRenderChatList() {
    // console.log('checkRenderChatList', this.data.chatList)
    let self = this
    if (this.data.chatList.length == 0 && Object.keys(app.globalData.recentChatList).length != 0) {//有数据但是没渲染
      // app.globalData.recentChatList.map((msg) => {
      //   self.updateRecentChat({
      //     account: 
      //   })
      // })
    }
  },
  /**
   * 更新最近会话列表
   * account, time, text, type, handler：标记已阅读离线消息，无需更新未读数
   * noUpdateUnreadFlag：不更新未读标志，用于己方发送消息
   */
  updateRecentChat({ account, time, text, type, handler }, noUpdateUnreadFlag) {
    // console.log('updateRecentChat', this.data.chatList)
    let self = this
    let status = ''
    // 查找并更新在线状态
    for (let key in app.globalData.onlineList) {
      if (key === account) {
        status = app.globalData.onlineList[key]
      }
    }
    if (!self.data.chatAccount[account]) { // 最近会话列表中没有此人
      // 获取头像
      app.globalData.nim.getUser({
        account,
        done: (err, user) => {
          let avatar = user['avatar'] || self.data.defaultUserLogo
          let temp = {}
          let msg = text
          let unread = 1
          // 已阅读离线消息不更新
          switch (handler) {
            case 'onOfflineMsgs':
              unread = 0
              break
            case 'onSessions':
              unread = self.data.accountUnreadMap[account]
              break
            default:
              break
          }
          if (noUpdateUnreadFlag) { //己方发送消息，不更新未读数
            unread = 0
          }
          msg = self.judgeMessageType(type)
          temp[account] = account
          self.setData({
            chatList: [{
              account,
              status,
              nick: user['nick'],
              timestamp: time,
              displayTime: calcTimeHeader(time),
              lastestMsg: msg || text,
              type,
              unread,
              avatar
            }, ...self.data.chatList],
            chatAccount: Object.assign({}, self.data.chatAccount, temp)
          })
        }
      })
    } else { // 最近会话列表中有此人，更新会话
      let temp = [...self.data.chatList]
      temp.map((message, index) => {
        if (message.account === account) {
          let lastestMsg = ''
          let tempType = ''
          tempType = lastestMsg = self.judgeMessageType(type)
          
          temp[index].lastestMsg = lastestMsg || text
          temp[index].type = tempType || type
          temp[index].timestamp = time
          temp[index].displayTime = calcTimeHeader(time)
          temp[index].status = status
          if (noUpdateUnreadFlag) { //己方发送消息，不更新未读数
            temp[index].unread = 0
          } else if (handler == 'onSessions') { //sessions过来的会话
          } else {
            if (temp[index].unread) {
              temp[index].unread += 1
            } else {
              temp[index].unread = 1
            }
          }
          return
        }
      })
      this.setData({
        chatList: temp
      })
    }

    // 排序
    this.sortChatList()

    // 去除重复数据
    // let rawAccounts = Object.keys(this.data.chatAccount)
    // let noRepeatAccounts = [...new Set(rawAccounts)]
    // let noRepeatChatList = [...this.data.chatList]
    // let tempMap = {}
    // let deleteIndexArr = []
    // noRepeatChatList.map((chat, index) => {
    //   if(!tempMap[chat.account]) {
    //     tempMap[chat.account] = chat.account
    //   } else {
    //     deleteIndexArr.push(index)
    //   }
    // })
    // deleteIndexArr.map((index) => {
    //   noRepeatChatList.splice(index, 1)
    // })
    // this.setData({
    //   chatAccount: noRepeatAccounts,
    //   chatList: noRepeatChatList
    // })
    // console.log('updateRecentChat', this.data.chatAccount)
    // console.log('updateRecentChat', this.data.chatList)
  },
  /**
   * 传递消息进来，添加至最近会话列表
   * 必须字段 {type, time, from,to}
   */
  addNotificationToChatList(msg) {
    let desc = ''
    let self = this
    switch (msg.type) {
      case 'addFriend': {
        desc = `添加好友-${msg.from}`
        break
      }
      case 'deleteFriend': {
        desc = `删除好友-${msg.from}`
        break
      }
      case 'deleteMsg':
        desc = `${msg.from}撤回了一条消息`
        break
      case 'custom':
        let data = JSON.parse(msg.content)
        let seen = []
        let str = data['content'] || JSON.stringify(data, function (key, val) {
          if (typeof val == "object") {
            if (seen.indexOf(val) >= 0)
              return
            seen.push(val)
          }
          return val
        }) // 可能没有content属性
        desc = `自定义系统通知-${str}`
        break
      default: 
        desc = msg.type
        break
    }
    if (!self.data.chatAccount['notification']) { // 没有系统通知
      self.setData({
        chatList: [{
          account: '消息通知',
          timestamp: msg.time,
          displayTime: calcTimeHeader(msg.time),
          lastestMsg: desc,
        }, ...self.data.chatList],
        chatAccount: Object.assign({}, self.data.chatAccount, { notification: 'notification' })
      })
    } else {
      let temp = [...self.data.chatList]
      temp.map((message, index) => {
        if (message.account === '消息通知') {
          temp[index].lastestMsg = desc
          temp[index].timestamp = msg.time
          temp[index].displayTime = calcTimeHeader(msg.time)
          return
        }
      })
      temp.sort((a, b) => {
        return a.timestamp < b.timestamp
      })
      self.setData({
        chatList: temp
      })
    }
  },
  /**
   * 捕获从滑动删除传递来的事件
   */
  catchDeleteTap (e) {
    let account = e.currentTarget.dataset.data
    let chatAccount = Object.assign({}, this.data.chatAccount)
    delete chatAccount[account]
    let chatList = [...this.data.chatList]
    let deleteIndex = 0
    chatList.map((item, index) => {
      if(item.account === account) {
        deleteIndex = index
        return
      }
    })
    chatList.splice(deleteIndex, 1)
    this.setData({
      chatList,
      chatAccount
    })
  },
  /**
     * 单击消息通知 
     */
  switchToMessageNotification() {
    wx.navigateTo({
      url: '../../partials/messagenotification/messagenotification',
    })
  },
  /**
   * 单击进入聊天页面
   */
  switchToChating(e) {
    let account = e.currentTarget.dataset.data
    let flag = false
    let chatList = [...this.data.chatList]

    // 告知服务器，标记会话已读
    app.globalData.nim.resetSessionUnread(`p2p-${account}`)

    chatList.map(item => {
      if(item.account === account) {
        if(item.unread) {
          item.unread = 0
          flag = true
        }
      }
    })
    if(flag) {
      this.setData({
        chatList
      })
    }
    
    wx.navigateTo({
      url: `../../partials/chating/chating?chatTo=${account}`,
    })
  },
  /**
   * 单击进入个人区域
   */
  switchToPersonCard(e) {
    let account = e.currentTarget.dataset.data
    // 压栈进入account介绍页
    clickLogoJumpToCard(account, true)
  },
  /**
   * 判断消息类型，返回提示
   */
  judgeMessageType(type) {
    let msg = ''
    if (type === 'image') {
      msg = '[图片]'
    } else if (type === 'geo') {
      msg = '[位置]'
    } else if (type === 'audio') {
      msg = '[语音]'
    } else if (type === 'video') {
      msg = '[视频]'
    } else if (type === '猜拳') {
      msg = '[猜拳]'
    } else if (type === '贴图表情') {
      msg = '[贴图表情]'
    } else if (type === 'tip') {
      msg = '[提醒消息]'
    } else if (type === 'deleteMsg') {//可能是他人撤回消息
      msg = '[提醒消息]'
    } else if (type === 'file') {
      msg = '[文件消息]'
    } else if (type === '白板消息') {
      msg = '[白板消息]'
    } else if (type === '阅后即焚') {
      msg = '[阅后即焚]'
    } else if (type === 'robot') {
      msg = '[机器人消息]'
    }
    return msg
  },
})