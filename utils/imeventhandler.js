import MD5 from '../vendors/md5.js'
const SDK = require('../vendors/NIM_Web_SDK_v5.3.0.js')
const NIM = SDK.NIM
import { deepClone, judgeCustomMessageType } from './util.js'

var app = getApp()

export default class IMEventHandler {
  constructor(headers) {

    app.globalData.nim = NIM.getInstance({
      // 初始化SDk
      // debug           : true,
      appKey: app.globalData.config.appkey,
      token: headers.token,
      account: headers.account,
      db: false,
      transports: ['websocket'],
      syncSessionUnread: true, // 是否同步会话未读数，设置之后
      onconnect: this.onConnect,
      onwillreconnect: this.onWillReconnect,
      ondisconnect: this.onDisconnect,
      onerror: this.onError,
      // 同步完成
      onsyncdone: this.onSyncDone,
      // 用户关系
      onblacklist: this.onBlacklist,
      onsyncmarkinblacklist: this.onSyncMarkInBlackList,
      onmutelist: this.onMutelist,
      onsyncmarkinmutelist: this.onMarkInMutelist,
      // 好友关系
      onfriends: this.onFriends,
      onsyncfriendaction: this.onSyncFriendAction,
      // // 用户名片
      onmyinfo: this.onMyInfo,
      onupdatemyinfo: this.onUpdateMyInfo,
      onusers: this.onUsers,
      onupdateuser: this.onUpdateUser,
      // 机器人列表的回调
      onrobots: this.onRobots,
      // 群组
      onteams: this.onTeams,
      onsynccreateteam: this.onCreateTeam,
      onteammembers: this.onTeamMembers,
      // // onsyncteammembersdone: onSyncTeamMembersDone,
      onupdateteammember: this.onUpdateTeamMember,
      // 会话
      onsessions: this.onSessions,
      onupdatesession: this.onUpdateSession,
      // 消息
      onroamingmsgs: this.onRoamingMsgs,
      onofflinemsgs: this.onOfflineMsgs,
      onmsg: this.onMsg,
      // 系统通知
      onofflinesysmsgs: this.onOfflineSysMsgs,
      onsysmsg: this.onSysMsg,
      onupdatesysmsg: this.onUpdateSysMsg,
      onsysmsgunread: this.onSysMsgUnread,
      onupdatesysmsgunread: this.onUpdateSysMsgUnread,
      onofflinecustomsysmsgs: this.onOfflineCustomSysMsgs,
      oncustomsysmsg: this.onCustomSysMsg,
      // 收到广播消息
      onbroadcastmsg: this.onBroadcastMsg,
      onbroadcastmsgs: this.onBroadcastMsgs,
      // 事件订阅
      onpushevents: this.onPushEvents,
    })
    app.globalData.NIM = NIM
    // 网络状态变化
    wx.onNetworkStatusChange(function(res){
      if(res.isConnected === false) {
        wx.showToast({
          title: '请检查网络链接状态',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
  /**
   * 连接成功
   */
  onConnect() {
    // 切换到用户界面
    // wx.switchTab({
    //   url: '../contact/contact',
    // })
    // // 设置登录状态
    // app.globalData.isLogin = false
    // wx.switchTab({
    //   url: '../recentchat/recentchat',
    // })
  }
  /**
   * 个人名片：存储个人信息到全局数据
   */
  onMyInfo(user) {
    /**
     * account:"wujie"
        avatar:""
        birth:"1989-05-13"
        createTime:1441173394044
        email:"w773679148@163.com"
        gender:"male"
        nick:"归海一刀"
        sign:"hello world!！"
        tel:"110"
        updateTime:1466044995429
     */
    app.globalData.loginUser = user
    // 初始化消息列表
    app.globalData.messageList[user.account] = app.globalData.messageList[user.account] || {}
  }
  /**
   * 个人名片更新-其他端修改
   */
  onUpdateMyInfo(user) {
    // console.log('onUpdateMyInfo')
    // console.log(user)
    // 更新名片
    app.globalData.loginUser = user
    // 发送个人状态消息
    app.globalData.subscriber.emit('UPDATE_MY_INFO', user)
  }
  /**
   * 同步好友信息，不含名片
   * [{account: "wangjiabao", createTime: 1455531313469, updateTime: 1455531313469, valid: true}]
   */
  onFriends(friends) {
    // console.log('好友列表', friends)
    app.globalData.friends = [...friends]
    let accounts = friends.map(item => item.account)
    // 获取好友名片信息
    app.globalData.nim.getUsers({
      accounts,
      done: function (err, friendCards) {
        if (err) {
          wx.showToast({
            title: err.message,
            icon: 'none',
            duration: 1500
          })
          // console.log(err)
          return
        }
        friendCards.map(friendCard => {
          let temp = {}
          for (let key in friendCard) {
            temp[key] = friendCard[key]
          }
          //存到全局对象
          app.globalData.friendsWithCard[temp.account] = temp
        })
      }
    })
    app.globalData.nim.subscribeEvent({
      type: 1,// type 1 为登录事件，用于同步多端登录状态
      accounts: accounts,
      subscribeTime: 3600 * 24 * 30,
      // 同步订阅事件，保证每次登录时会收到推送消息
      sync: true,
      done: function onSubscribeEvent(err, res) {
        if (err) {
          console.error('订阅好友事件失败', err)
          // 二次订阅
          app.globalData.nim.subscribeEvent({
            type: 1,// type 1 为登录事件，用于同步多端登录状态
            accounts: accounts,
            subscribeTime: 3600 * 24 * 30,
            // 同步订阅事件，保证每次登录时会收到推送消息
            sync: true,
            done: function onSubscribeEvent(err, res) {
              if (err) {
                console.error('订阅好友事件失败', err)
                wx.showToast({
                  title: '请检查网络后，重试！',
                  duration: 1500,
                  icon: 'none'
                })
              }
            }
          })
        }
      }
    });
  }
  /**
   * 设置订阅后，服务器消息事件回调
   */
  onPushEvents(param) {
    // console.log('收到了订阅事件的回调', param)
    let msgEvents = param.msgEvents
    let updateAccounts = [] // 存储状态变化账户
    if (msgEvents) {
      msgEvents.map((data) => {
        app.globalData.onlineList[data.account] = updateMultiPortStatus(data)
        updateAccounts.push(data.account)
      })
      // 发送好友状态更新消息
      app.globalData.subscriber.emit('FRIEND_STATUS_UPDATE', updateAccounts)
      // console.log(updateAccounts)
    }

    function updateMultiPortStatus(data) {
      if (data.account) {
        let account = data.account
        let multiPortStatus = ''
        function getMultiPortStatus(customType, custom) {
          // 服务器下推多端事件标记的特定序号对应值
          var netState = {
            0: '',
            1: 'Wifi',
            2: 'WWAN',
            3: '2G',
            4: '3G',
            5: '4G'
          }
          var onlineState = {
            0: '在线',
            1: '忙碌',
            2: '离开'
          }

          var custom = custom || {}
          if (customType !== 0) {
            // 有serverConfig.online属性，已被赋值端名称
            custom = custom[customType]
          } else if (custom[4]) {
            custom = custom[4]
            multiPortStatus = '电脑'
          } else if (custom[2]) {
            custom = custom[2]
            multiPortStatus = 'iOS'
          } else if (custom[1]) {
            custom = custom[1]
            multiPortStatus = 'Android'
          } else if (custom[16]) {
            custom = custom[16]
            multiPortStatus = 'Web'
          } else if (custom[64]) {
            custom = custom[64]
            multiPortStatus = 'Mac'
          }
          if (custom) {
            custom = JSON.parse(custom)
            if (typeof custom['net_state'] === 'number') {
              var tempNetState = netState[custom['net_state']]
              if (tempNetState) {
                multiPortStatus += ('[' + tempNetState + ']')
              }
            }
            if (typeof custom['online_state'] === 'number') {
              multiPortStatus += onlineState[custom['online_state']]
            } else {
              multiPortStatus += '在线'
            }
          }
          return multiPortStatus
        }
        // demo自定义多端登录同步事件
        if (+data.type === 1) {
          if (+data.value === 1 || +data.value === 2 || +data.value === 3 || +data.value === 10001) {
            var serverConfig = JSON.parse(data.serverConfig)
            var customType = 0
            multiPortStatus = ''
            // 优先判断serverConfig字段
            if (serverConfig.online) {
              if (serverConfig.online.indexOf(4) >= 0) {
                multiPortStatus = '电脑'
                customType = 4
              } else if (serverConfig.online.indexOf(2) >= 0) {
                multiPortStatus = 'iOS'
                customType = 2
              } else if (serverConfig.online.indexOf(1) >= 0) {
                multiPortStatus = 'Android'
                customType = 1
              } else if (serverConfig.online.indexOf(16) >= 0) {
                multiPortStatus = 'Web'
                customType = 16
              } else if (serverConfig.online.indexOf(64) >= 0) {
                multiPortStatus = 'Mac'
                customType = 64
              }
            }
            if (data.custom && (Object.keys(data.custom).length > 0)) {
              var portStatus = getMultiPortStatus(customType, data.custom)
              // 如果serverConfig里有属性而custom里没有对应属性值
              if ((multiPortStatus !== '') && (portStatus === '')) {
                multiPortStatus += '在线'
              } else {
                multiPortStatus = portStatus
                // multiPortStatus += portStatus
              }
            } else if (customType !== 0) {
              multiPortStatus += '在线'
            } else {
              multiPortStatus = '离线'
            }
            return multiPortStatus
          }
        }
      }
      return '离线'
    }
  }
  /**
   * 收到黑名单列表
   * 是好友被拉黑 [{account,createTime,updateTime}]
   * 不是好友，但是被拉黑 [invalid:[{account,createTime,updateTime}], {{account,createTime,updateTime}}]
   * 非好友状态下拉黑名单可能也出现在正常的名单中，invalid表示静音的意思
   * 黑名单下 invalid表示静音关系，剩下的其他部分就是黑名单，
   * 静音下 invalid表示黑名单关系，剩下的其他部分就是静音列表
   */
  onBlacklist(blacklist) {
    // console.log('整理前的黑名单', blacklist)
    let arr = []
    if (Object.keys(blacklist).indexOf('invalid') === -1) {//不存在静音列表时
      arr = [...blacklist]
    } else { // 存在好友情况下拉黑
      let keys = Object.keys(blacklist)
      keys.splice(keys.indexOf('invalid'), 1)
      keys.map(key => {
        arr.push(blacklist[key])
      })
    }
    // console.log('整理过的黑名单', arr)
    arr.map(item => {
      let temp = {}
      for(let key in item) {
        temp[key] = item[key]
      }
      // 排序使用
      temp['addTime'] = new Date().getTime()
      app.globalData.blackList[item.account] = temp
    })
  }
  /**
   * 收到消息
   * {cc:true,flow:"in",from:"zys2",fromClientType:"Web",fromDeviceId:"9c0d3b3e63bb9c4bda72eafe34a19c6c",fromNick:"zys2",
   * idClient:"c2b6e4076c92e682dcbda13ff63371ae",idServer:"9680840912",isHistoryable:true,isLocal:false,isMuted:false,
   * isOfflinable:true,isPushable:true,isRoamingable:true,isSyncable:true,isUnreadable:true,needPushNick:true,resend:false,
   * scene:"p2p",sessionId:"p2p-zys2",status:"success",target:"zys2",text:"[呕吐]",time:1514883031508,to:"wujie",type:"text",
   * userUpdateTime:1513667188710}
   */
  onMsg(msg) {
    if (msg['scene'] && msg['scene'] !== 'p2p') {
      return
    }
    // console.log('onMsg')
    // console.log(msg)
    let accountMsgList = app.globalData.messageList[app.globalData.loginUser.account]
    // {account: {time: {from,to,type,scene,text,sendOrReceive}}}
    let type = ''
    if (msg.type === 'custom') {
      type = judgeCustomMessageType(msg.type, JSON.parse(msg['content']))
    } else {
      type = msg.type
    }
    // 检测的目的就是防止同一账号多端登录，一端发送消息后另一端还会推送
    let account = ''
    let sendOrReceive = ''
    if(msg.flow === 'out') {
      account = msg.to
      sendOrReceive = 'send'
    } else if (msg.flow === 'in') {
      account = msg.from
      sendOrReceive = 'receive'
    }
    // 存储数据到指定用户名下
    accountMsgList[account] = accountMsgList[account] || {}
    accountMsgList[account][msg.time] = {
      from: msg.from,
      to: msg.to,
      type,
      scene: msg.scene,
      text: msg.text,
      file: Object.assign({}, msg.file || {}),
      geo: Object.assign({}, msg.geo || {}),
      content: msg['content'] || '',
      tip: msg['tip'] || '',
      sendOrReceive
    }
    app.globalData.rawMessageList[account] = app.globalData.rawMessageList[account] || {}
    app.globalData.rawMessageList[account][msg.time] = deepClone(msg)

    // 存储数据到最近会话列表
    app.globalData.recentChatList[account] = app.globalData.recentChatList[account] || {}
    app.globalData.recentChatList[account][msg.time] = {
      from: msg.from,
      to: msg.to,
      type,
      scene: msg.scene,
      text: msg.text,
      file: Object.assign({}, msg.file || {}),
      geo: Object.assign({}, msg.geo || {}),
      content: msg['content'] || '',
      tip: msg['tip'] || '',
      sendOrReceive
    }
    // 发送收到消息更新消息
    app.globalData.subscriber.emit('RECEIVE_P2P_MESSAGE', { account: account, time: msg.time })
    if (app.globalData.currentChatTo === account) { //当前正在与此账户会话，禁止更新最近会话unread
      app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_ON_MSG', { account: account, time: msg.time, text: msg.text, type }, true)
    } else {
      app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_ON_MSG', { account: account, time: msg.time, text: msg.text, type })
    }
    
  }
  /**
   * 丢失连接
   */
  onDisconnect(error) {
    if (error) {
      switch (error.code) {
        // 账号或者密码错误, 请跳转到登录页面并提示错误
        case 302:
          wx.showToast({
            title: '账号或者密码错误',
            icon: 'none',
            duration: 1500
          })
          app.globalData.subscriber.emit('STOP_IS_LOGIN')
          break;
        // 重复登录, 已经在其它端登录了, 请跳转到登录页面并提示错误
        case 417:
          wx.showToast({
            title: '重复登录',
            icon: 'none',
            duration: 1500
          })
          app.globalData.subscriber.emit('STOP_IS_LOGIN')
          break;
        // 被踢, 请提示错误后跳转到登录页面
        case 'kicked':
          wx.showModal({
            title: '用户下线',
            showCancel: false,
            content: '在其他客户端登录，导致被踢',
            confirmText: '重新登录',
            success: (res) => {
              if(res.confirm) { //点击确定
                app.globalData.nim.disconnect()
                app.globalData.NIM.rmAllInstances()
                // 清空本次数据
                app.globalData.isLogin = false
                app.globalData.currentChatTo = ''
                app.globalData.friends = []
                app.globalData.friendsCard = {}
                app.globalData.friendsWithCard = {}
                app.globalData.loginUser = {}
                app.globalData.messageList = {}
                app.globalData.nim = {}
                app.globalData.notificationList = []
                app.globalData.onlineList = []
                app.globalData.blackList = {}
                app.globalData.rawMessageList = {}
                app.globalData.recentChatList = {}
                app.globalData.subscriber.clear()
                wx.clearStorage()
                // wx.closeSocket({})
                wx.reLaunch({
                  url: '/pages/login/login',
                })
              }
            }
          })
          break;
        default:
          break;
      }
    }
  }
  /** 收到系统消息(他人为操作主体)
   *  {category:"friend",from:"andyzou",idServer,read:false,state:"init",status:"success",time,to:"wujie"，type:"deleteFriend"}
   * {category:"friend",friend:{account,alias,createTime,custom,updateTime,valid},from:"andyzou",idServer,ps,read:false,state:"init",status:"success",time,to:"wujie"，type:"addFriend"}
   */
  onSysMsg(sysMsg) {
    // console.log('sysMsg', sysMsg)
    let msgType = sysMsg.type
    // 暂时只支持这几种系统消息类型
    if (msgType != 'addFriend' && msgType != 'deleteFriend' && msgType != 'deleteMsg' && msgType != 'custom') {
      return
    }
    
    let msg = deepClone(sysMsg)
    let account = msg.from
    // 不是操作好友消息时，存储到全局
    if (msg.type !== 'addFriend' && msg.type !== 'deleteFriend') { // 发送更新好友消息时会，存储到全局
      app.globalData.notificationList.push(msg)
    }
    app.globalData.subscriber.emit('RECEIVE_SYSTEM_MESSAGE', msg)
    
    if (msg.type === 'deleteMsg') {
      // 存储到全局 并 存储到最近会话列表中
      let msgTime = msg.msg.time
      let tip = `${account}撤回了一条消息`
      let loginUserAccount = app.globalData['loginUser']['account']
      let loginMessageList = app.globalData.messageList[loginUserAccount]
      loginMessageList[account][msgTime]['type'] = 'tip'
      loginMessageList[account][msgTime]['tip'] = tip
      app.globalData.recentChatList[account][msgTime]['type'] = 'tip'

      if (app.globalData.currentChatTo === account) { //当前正在与此账户会话，禁止更新最近会话unread
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT', { account: account, type: msg.type, time: msg.time, text: '' }, true)
      } else {
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT', { account: account, type: msg.type, time: msg.time, text: '' })
      }
      app.globalData.subscriber.emit('OPPOSITE_RECALL_WHEN_CHATTING', { account: account, time: msgTime, tip })
    } else if (msg.type === 'addFriend'){ //第三方将自己加到好友列表
      app.globalData.nim.getUser({
        account: account,
        done: function (err, user) {
          if(err) {
            // console.log(err)
            return
          }
          // 存储到全局数据
          app.globalData.friends.push(msg.friend)
          app.globalData.friendsWithCard[account] = deepClone(user)
          app.globalData.friendsCard[account] = deepClone(user)
          // 发送通知，更新通讯录
          app.globalData.subscriber.emit('ADD_NEW_FRIEND', user)
        }
      })
    } else if (msg.type === 'deleteFriend') {
      let userCard = deepClone(app.globalData.friendsCard[account])
      // 发送通知，更新通讯录
      app.globalData.subscriber.emit('DELETE_OLD_FRIEND', userCard)

      // 从全局数据中删除
      app.globalData.friends.splice(app.globalData.friends.indexOf(account), 1)
      delete app.globalData.friendsWithCard[account]
      delete app.globalData.friendsCard[account]
    }
  }
  /**
   * 收到sdk发送的自定义系统通知
   * {from,content:"{"id":1}" ,idServer,scene,status,time,to,type}或
   * {from,content:"{content: {"id":1}}" ,idServer,scene,status,time,to,type}
   */
  onCustomSysMsg(sysMsg) {
    // console.log('onCustomSysMsg')
    // console.log(sysMsg)
    let msg = {}
    msg['content'] = sysMsg['content']
    msg['from'] = sysMsg['from']
    msg['time'] = sysMsg['time']
    msg['to'] = sysMsg['to']
    msg['type'] = sysMsg['type']
    app.globalData.notificationList.push(msg)
    app.globalData.subscriber.emit('RECEIVE_SYSTEM_MESSAGE', msg)
  }
  /**收到漫游会话(用户登录时) 只包含一个账户的最后一条会话
   * [{id:"p2p-liuxuanlin",lastMsg:{from,text,to,geo,file,time,type},scene,to,unread}]
   */
  onSessions(sessions) {
    let accountMsgList = app.globalData.messageList[app.globalData.loginUser.account]
    // 漫游消息初始排序
    sessions.sort((a, b) => {
      return a.updateTime > b.updateTime
    })
    // console.log('onSessions', sessions)
    setTimeout(() => {
      for (let i = 0; i < sessions.length; i++) {
        let session = sessions[i]
        if (session['scene'] && session['scene'] !== 'p2p') {
          continue;
        }
        let msg = session.lastMsg
        let sendOrReceive = ''
        let account = ''
        let type = ''
        // 发送收到消息更新消息(延时等待订阅器初始化)
        if (msg.flow === 'in') {
          sendOrReceive = 'receive'
          account = msg.from
        } else if (msg.flow === 'out') {
          sendOrReceive = 'send'
          account = msg.to
        }
        if (msg.type === 'custom') {
          type = judgeCustomMessageType(msg.type, JSON.parse(msg['content']))
        } else {
          type = msg.type
        }
        // 存储数据到指定用户名下
        accountMsgList[account] = accountMsgList[account] || {}
        accountMsgList[account][msg.time] = {
          from: msg.from,
          to: msg.to,
          type,
          scene: msg.scene,
          text: msg.text,
          file: Object.assign({}, msg.file || {}),
          geo: Object.assign({}, msg.geo || {}),
          content: msg['content'] || '',
          tip: msg['tip'] || '',
          sendOrReceive
        }
        app.globalData.rawMessageList[account] = app.globalData.rawMessageList[account] || {}
        app.globalData.rawMessageList[account][msg.time] = deepClone(msg)
        
        // 存储数据到最近会话列表
        app.globalData.recentChatList[account] = app.globalData.recentChatList[account] || {}
        app.globalData.recentChatList[account][msg.time] = {
          from: msg.from,
          to: msg.to,
          type,
          scene: msg.scene,
          text: msg.text,
          file: Object.assign({}, msg.file || {}),
          geo: Object.assign({}, msg.geo || {}),
          content: msg['content'] || '',
          tip: msg['tip'] || '',
          sendOrReceive
        }
        app.globalData.subscriber.emit('RECEIVE_P2P_MESSAGE', { account: account, time: msg.time })
        app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_ON_SESSION', { account: account, time: msg.time, text: msg.text, type, handler: 'onSessions' })
        if (session.unread != 0) {// 更新未读数
          app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_UNREAD_ON_SESSION', { account: session.to, unread: session.unread })
        }
      }
      wx.hideLoading()
    }, 1500)
  }
  /**收到漫游会话(用户登录时) 包含一个账户的多条会话
   * {scene:"p2p",sessionId:"p2p-cs4",timetag,to:"cs4",msgs:[{from:'wujie',text:'222',to:'cs4'}]}
   * {scene:"team",sessionId:"team-3944051",timetag:,to:"3944051",msgs:[{from:'wujie',text:'222',to:'cs4'}]}
   */
  onRoamingMsgs(obj) {
    // console.log('onRoamingMsgs',obj)
    if(obj.scene != 'p2p') {
      return
    }
    let accountMsgList = app.globalData.messageList[app.globalData.loginUser.account]
    let sessions = obj['msgs']
    for (let i = 0; i < sessions.length; i++) {
      let msg = sessions[i]
      if (msg['scene'] && msg['scene'] !== 'p2p') {
        continue;
      }
      
      let sendOrReceive = ''
      let account = ''
      let type = ''
      // 发送收到消息更新消息(延时等待订阅器初始化)
      if (msg.flow === 'in') {
        sendOrReceive = 'receive'
        account = msg.from
      } else if (msg.flow === 'out') {
        sendOrReceive = 'send'
        account = msg.to
      }
      if (msg.type === 'custom') {
        type = judgeCustomMessageType(msg.type, JSON.parse(msg['content']))
      } else {
        type = msg.type
      }
      // 存储数据到指定用户名下
      accountMsgList[account] = accountMsgList[account] || {}
      accountMsgList[account][msg.time] = {
        from: msg.from,
        to: msg.to,
        type,
        scene: msg.scene,
        text: msg.text,
        file: Object.assign({}, msg.file || {}),
        geo: Object.assign({}, msg.geo || {}),
        content: msg['content'] || '',
        tip: msg['tip'] || '',
        sendOrReceive
      }
      app.globalData.rawMessageList[account] = app.globalData.rawMessageList[account] || {}
      app.globalData.rawMessageList[account][msg.time] = deepClone(msg)

      // 存储数据到最近会话列表
      app.globalData.recentChatList[account] = app.globalData.recentChatList[account] || {}
      app.globalData.recentChatList[account][msg.time] = {
        from: msg.from,
        to: msg.to,
        type,
        scene: msg.scene,
        text: msg.text,
        file: Object.assign({}, msg.file || {}),
        geo: Object.assign({}, msg.geo || {}),
        content: msg['content'] || '',
        tip: msg['tip'] || '',
        sendOrReceive
      }

      app.globalData.subscriber.emit('RECEIVE_P2P_MESSAGE', { account: account, time: msg.time })
      app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_ON_SESSION', { account: account, time: msg.time, text: msg.text, type, handler: 'onSessions' })
    }
  }
  /**
   * session更新时触发(例如，其他端已读会话)
   * {id,scene,to,unread,updateTime,lastMsg:{scene,from,to,time,type,text...}}
   */
  onUpdateSession(session) {
    // console.log('onUpdateSession', session)
    if (session.scene != 'p2p') {
      return
    }
    if(session.unread == 0) {// 其他端已已读未读会话
      // 清除未读会话
      app.globalData.subscriber.emit('CLEAR_UNREAD_RECENTCHAT_UPDATESESSION', { account: session.to})
    }
  }
  /**
   * 用户离线时收到消息，再次登录时推送
   * {scene,timetag,to,sessionId:'p2p-zys1',msgs:[{}]}
   */
  onOfflineMsgs(obj) {
    let {to, scene, msgs} = obj
    if (scene != 'p2p') { // 暂时不处理其他类型消息
      return
    }
    let accountMsgList = app.globalData.messageList[app.globalData.loginUser.account]
    // console.log('onOfflineMsgs', obj)
    // 存储到全局
    msgs.map(msg => {
      let sendOrReceive = ''
      let account = ''
      let type = ''
      // 发送收到消息更新消息(延时等待订阅器初始化)
      if (msg.flow === 'in') {
        sendOrReceive = 'receive'
        account = msg.from
      } else if (msg.flow === 'out') {
        sendOrReceive = 'send'
        account = msg.to
      }
      if (msg.type === 'custom' && JSON.parse(msg['content'])['type'] === 1) {
        type = '猜拳'
      } else if (msg.type === 'custom' && JSON.parse(msg['content'])['type'] === 3) {
        type = '贴图表情'
      } else {
        type = msg.type
      }

      app.globalData.subscriber.emit('RECEIVE_P2P_MESSAGE', { account: account, time: msg.time })
      app.globalData.subscriber.emit('UPDATE_RECENT_CHAT_ON_OFFLINE', { account: account, time: msg.time, text: msg.text, type, handler: 'onOfflineMsgs' })

      // 存储数据到指定用户名下
      accountMsgList[account] = accountMsgList[account] || {}
      accountMsgList[account][msg.time] = {
        from: msg.from,
        to: msg.to,
        type,
        scene: msg.scene,
        text: msg.text,
        file: Object.assign({}, msg.file || {}),
        geo: Object.assign({}, msg.geo || {}),
        content: msg['content'] || '',
        tip: msg['tip'] || '',
        sendOrReceive
      }
      app.globalData.rawMessageList[account] = app.globalData.rawMessageList[account] || {}
      app.globalData.rawMessageList[account][msg.time] = deepClone(msg)

      // 存储数据到最近会话列表
      app.globalData.recentChatList[account] = app.globalData.recentChatList[account] || {}
      app.globalData.recentChatList[account][msg.time] = {
        from: msg.from,
        to: msg.to,
        type,
        scene: msg.scene,
        text: msg.text,
        file: Object.assign({}, msg.file || {}),
        geo: Object.assign({}, msg.geo || {}),
        content: msg['content'] || '',
        tip: msg['tip'] || '',
        sendOrReceive
      }
    })
    // 账号未读消息会在onSession中存储，包括离线回话的未读数，所以这里无需更新
    // setTimeout(()=>{
    //   app.globalData.subscriber.emit('UPDATE_UNREAD_RECENT_CHAT_ON_OFFLINE', { account: to, unread: msgs.length })
    // },2000)  
  }
  /**
   * 多端同步黑名单，ios和小程序端登录A，ios上把B拉黑，小程序会收到会收到回调
   * {account,isAdd:true,record:{account,updateTime}}
   */
  onSyncMarkInBlackList(obj) {
    // console.log('onSyncMarkInBlackList')
    // console.log(obj)
    let account = obj.account
    // 拿到好友名片
    let userCard = deepClone(app.globalData.friendsCard[account])
    if (obj.isAdd === true) { // 加入黑名单
      // 发送通知，更新通讯录
      app.globalData.subscriber.emit('DELETE_OLD_FRIEND', userCard)
      app.globalData.blackList[account] = {
        account: obj.record.account,
        updateTime: obj.record.updateTime,
      }
    } else { // 从黑名单移除
      // 发送通知，更新通讯录
      app.globalData.subscriber.emit('ADD_NEW_FRIEND', userCard)
      // 从全局数据中删除
      delete app.globalData.blackList[account]
    }
  }
  /**
 * 连接出错
 */
  onError(error) {
    // console.log(error)
    app.globalData.nim.disconnect()
    app.globalData.nim.connect()
  }
  /**
   * 断开重连
   */
  onWillReconnect() {
    // console.log('断开重连中')
    wx.showToast({
      title: '正在重新连接中',
      icon: 'none',
      mask: true,
      duration: 3000
    })
  }
  /**
   * onConnect成功后会开始同步，进入此表示数据同步完成
   */
  onSyncDone() {
    // console.log('Sync Done')
    // 设置登录状态
    app.globalData.isLogin = false
    wx.hideLoading()
    wx.switchTab({
      url: '../recentchat/recentchat',
    })
  }
  onUsers(friends) {
    /** key可能丢失，使用时检查下
      [
        {account:"ljtest",avatar:"5",createTime:1436780050329,gender:"unknown",nick:"linda",updateTime:1439275047417}
        {account:"ljtest",avatar:"5",birth: 2015-11-12,createTime:149,email:1@1.com,gender:"male",nick:"la",sign:'123',tel:'12',updateTime:1439}
      ]
     */
    // console.log('onUsers')
  }
  onMutelist (mutelist) {
    // []
    // console.log('onMutelist')
    // console.log(mutelist)
  }
  onMarkInMutelist (obj) {
    // console.log('onMarkInMutelist')
    // console.log(obj)
  }
  
  onSyncFriendAction (obj) {
    // console.log('onSyncFriendAction')
    // console.log(obj)
  }
  onUpdateUser (user) {
    // console.log('onUpdateUser')
    // console.log(user)
  }
  onTeams (teams) {
    // console.log('onTeams')
    // console.log(teams)
  }
  onCreateTeam (team) {
    // console.log('onCreateTeam')
    // console.log(team)
  }
  onTeamMembers (teamId, members) {
    // console.log('onTeamMembers')
    // console.log(teamId, members)
  }
  onUpdateTeamMember (teamMember) {
    // console.log('onUpdateTeamMember')
    // console.log(teamMember)
  }
  // 系统通知
  onOfflineSysMsgs () {
    // console.log('onOfflineSysMsgs')
    // console.log()
  }
  onUpdateSysMsg (sysMsg) {
    // console.log('onUpdateSysMsg')
    // console.log(sysMsg)
  }
  onSysMsgUnread (obj) {
    // console.log('onSysMsgUnread')
    // console.log(obj)
  }
  onUpdateSysMsgUnread (obj) {
    // console.log('onUpdateSysMsgUnread')
    // console.log(obj)
  }
  onOfflineCustomSysMsgs (sysMsg) {
    // console.log('onOfflineCustomSysMsgs')
    // console.log(sysMsg)
  }
  // 收到广播消息
  onBroadcastMsg (msg) {
    // console.log('onBroadcastMsg')
    // console.log(msg)
  }
  onBroadcastMsgs (msg) {
    // console.log('onBroadcastMsgs')
    // console.log(msg)
  }
  
}