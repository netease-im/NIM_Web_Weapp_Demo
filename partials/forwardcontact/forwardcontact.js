import { getPinyin } from '../../utils/pinyin.js'
import { deepClone } from '../../utils/util.js'

var app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    chatTo: '',
    nick: '',
    paramString: '',// 传递过来的参数
    defaultUserLogo: '/images/default-icon.png',
    friendCata: {},//按照类别排好序的数据 {'a': [{'account':'','nick':'',avatar:'',nickPinyin:'',accountAndNick:''}]}（如有#则在最前）
    cataHeader: [], //首字母列表(如有#则在最后)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '选择联系人',
    })
    let paramString = decodeURIComponent(options.data)
    this.setData({
      paramString
    })
    // console.log(paramString)
    let accounts = app.globalData.friends.map(item => item.account)
    // console.log(accounts)
    // console.log(app.globalData.friendsWithCard)
    this.calcForwardFriendList(app.globalData.friendsWithCard)
    // console.log(app.globalData.rawMessageList)
  },
  /**
   * 单击进行转发
   */
  radioChange(e) {
    let self = this
    let accountAndNick = e.detail.value
    let chatTo = accountAndNick.split('!@!')[0]
    let nick = accountAndNick.split('!@!')[1]
    self.setData({
      chatTo,
      nick
    })
    wx.showModal({
      title: '确认转发？',
      content: `确认转发给${nick}`,
      success: function(res) {
        if(res.confirm) {
          self.sendMsg()
        } else {
          // console.log('取消')
        }
      }
    })
  },
  /**
   * 发送消息
   */
  sendMsg() {
    // 参数是用来取消息的
    let paramObj = JSON.parse(this.data.paramString)
    let chatTo = paramObj.chatTo
    let unixTime = paramObj.time
    let message = app.globalData.rawMessageList[chatTo][unixTime]
    // console.log(message)
    this.forwardMessage(this.data.chatTo, message)
    
  },
  forwardMessage(account, msg) {
    let self = this
    app.globalData.nim.forwardMsg({
      msg: msg,
      scene: 'p2p',
      to: account,
      done: function(err, msg) {
        if(err) {
          console.log(err)
          return
        }
        wx.showToast({
          title: '转发成功',
          icon: 'none',
          duration: 1500
        })
        // 存储到全局 并 存储到最近会话列表中
        let type = ''
        if (msg.type === 'custom' && JSON.parse(msg['content'])['type'] === 1) {
          type = '猜拳'
        } else if (msg.type === 'custom' && JSON.parse(msg['content'])['type'] === 3) {
          type = '贴图表情'
        } else {
          type = msg.type
        }
        self.saveMsgToGlobalAndRecent(msg, {
          from: msg.from,
          to: msg.to,
          type: type,
          scene: msg.scene,
          text: msg.text,
          sendOrReceive: 'send',
          displayTimeHeader: '', 
          tip: msg.tip,
          content: msg.content,
          file: msg.file || {},
          video: msg.file || {},
          audio: msg.file || {},
          geo: msg.geo || {}
        })
        // console.log('转发', app.globalData.rawMessageList)
        app.globalData.rawMessageList[account] = app.globalData.rawMessageList[account] || {}
        app.globalData.rawMessageList[account][msg.time] = deepClone(msg)
        // 更新列表
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_FORWARDCONTACT', { account: msg.to, time: msg.time, text: msg.text, type: msg.type })
        wx.redirectTo({
          url: `../chating/chating?chatTo=${account}&nick=${self.data.nick}`,
        })
      }
    })
  },
  /**
   * 计算好友转发列表
   */
  calcForwardFriendList() {
    let self = this
    let friendCata = {}
    let cataHeader = []
    for (let account in app.globalData.friendsWithCard) {
      let friendCard = app.globalData.friendsWithCard[account]
      let nickPinyin = getPinyin(friendCard.nick, '').toUpperCase()
      if (self.testNum(nickPinyin[0])) { // 数字
        if (!friendCata['#']) {
          friendCata['#'] = []
        }
        friendCata['#'].push({
          accountAndNick: `${account}!@!${friendCard.nick}`,
          account,
          nick: friendCard.nick,
          avatar: friendCard['avatar'] || self.data.defaultUserLogo,
          nickPinyin
        })
        if (friendCata['#'].length >= 2) {
          friendCata['#'].sort((a,b) => {
            return a.nickPinyin > b.nickPinyin
          })
        }
      } else { // 非数字，即字母
        if (!friendCata[nickPinyin[0]]) {// 已存在此条目,第一个为字母
          friendCata[nickPinyin[0]] = []
        }
        friendCata[nickPinyin[0]].push({
          accountAndNick: `${account}!@!${friendCard.nick}`,
          account,
          nick: friendCard.nick,
          avatar: friendCard['avatar'] || self.data.defaultUserLogo,
          nickPinyin
        })
        if (friendCata[nickPinyin[0]].length >= 2) {
          self.sortPinyin(friendCata[nickPinyin[0]])
        }
      }
    }
    cataHeader = [...Object.keys(friendCata)]
    cataHeader.sort()
    if (cataHeader[0] === '#') {// #排到最后
      cataHeader.push(cataHeader.shift(0, 1))
    }
    self.setData({
      friendCata,
      cataHeader
    })
  },
  /**
   * 排序
   */
  sortPinyin(arr) {
    arr.sort((a,b) => {
      return a.nickPinyin.localeCompare(b.nickPinyin)
    })
  },
  /**
   * 检测数字
   */
  testNum(char) {
    return /^[0-9]*$/.test(char)
  },
  /**
   * 存储消息到全局 以及 最近会话列表
   */
  saveMsgToGlobalAndRecent(msg, data) {
    let self = this
    // 存储到全局 并 存储到最近会话列表中
    let loginUserAccount = app.globalData['loginUser']['account']
    let loginMessageList = app.globalData.messageList[loginUserAccount]
    if (!loginMessageList[self.data.chatTo]) {
      loginMessageList[self.data.chatTo] = {} //开始未收到任何消息
      app.globalData.recentChatList[self.data.chatTo] = {}
    }
    loginMessageList[self.data.chatTo][msg.time] = data
    app.globalData.recentChatList[self.data.chatTo][msg.time] = data
  },
})