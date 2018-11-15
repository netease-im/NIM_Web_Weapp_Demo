import { showToast, calculateMeetingPosition } from '../../utils/util.js'
const app = getApp()
let store = app.store
Page({
  data: {
    beCalling: false, // 被叫标志
    loginUser: {}, // {uid,account,cid}
    accountToUidMap: {}, // account到uid映射表 {account:uid}
    enableCamera: true, // 开启摄像头标记
    muted: false, // 静音标记
    infoOfBeCalled: {}, // 被叫信息
    userlist: [], //正在通话列表
    callList: [], // 主叫列表，[{account,nick,avatar}]
    currentGroup: null, // 当前群组信息
  },
  onLoad: function (options = {}) {
    wx.setKeepScreenOn({
      keepScreenOn: true
    })
    let state = store.getState()
    console.log(state)
    let teamName = '多人通话'

    if (options.beCalling) { // 被叫
      teamName = state.groupList[state.netcallGroupCallInfo.content.teamId].name
      let accounts = state.netcallGroupCallInfo.content.members
      accounts = this.adjustAccountPosition(accounts)
      let self = this
      app.globalData.nim.getUsers({
        accounts: accounts,
        done: function(error, users) {
          if (error) {
            console.log(error)
            return
          }
          self.setData({
            userlist: calculateMeetingPosition(users)
          })
        }
      })
      this.setData({
        beCalling: true,
        infoOfBeCalled: state.netcallGroupCallInfo
      })
    } else { // 主叫
      teamName = state.currentGroup.name
      // 计算所有人的位置
      let updateUserList = calculateMeetingPosition([{
          account: state.userInfo.account,
          nick: state.userInfo.nick
        }, ...state.netcallCallList])
      this.setData({
        callList: state.netcallCallList,
        currentGroup: state.currentGroup,
        userlist: updateUserList
      })
      this.startNetcallCall()
    }
    wx.setNavigationBarTitle({
      title: teamName,
    })
    this.listenNetcallEvent()
  },
  onUnload() {
    if (this.data.onTheCall) {
      this.hangupHandler(true)
    }
    app.globalData.emitter.eventReset()
  },
  /**
   * 开始音视频呼叫
   */
  startNetcallCall() {
    let self = this
    let accounts = this.data.callList.map(user => user.account)
    let alluserAccounts = this.data.userlist.map(user => user.account)
    let currentGroup = this.data.currentGroup
    let channelName = `team-${currentGroup.teamId}-${new Date().getTime()}`
    // 发送自定义系统通知
    accounts.map(account => {
      app.globalData.nim.sendCustomSysMsg({
        scene: 'p2p',
        to: account,
        enablePushNick: false,
        isPushable: true,
        sendToOnlineUsersOnly: false,
        apnsText: `${app.globalData.nim.account}正在呼叫您`,
        content: JSON.stringify({
          id: 3,
          members: alluserAccounts,
          teamId: currentGroup.teamId,
          room: channelName,
          type: 2
        }),
        done: function (error, msg) {
          if (error) {
            console.error(error)
            return
          }
          console.log('自定义系统通知发送成功')
          console.log(msg);
        }
      })
    })
    // 呼叫
    app.globalData.netcall.createChannel({
      channelName: channelName
    })
      .then((data) => {
        console.error('创建房间成功', data)
        app.globalData.netcall.joinChannel({
          mode: 0,
          channelName: channelName,
          role: 0
        })
          .then((data) => {
            console.error('加入房间成功', data)
            // 添加uid
            let userlist = Object.assign([], self.data.userlist)
            userlist.map(user => {
              user.uid = data.accountUidMap[user.account]
            })
            // {uid,cid,account,accountUidMap}
            self.setData({
              beCalling: false,
              loginUser: {
                uid: data.uid,
                cid: data.cid,
                account: data.account
              },
              userlist,
              accountToUidMap: data.accountUidMap,
            })
            wx.createLivePusherContext(this).start()
          })
      })
  },
  
  listenNetcallEvent() {
    let self = this
    app.globalData.emitter.on('syncDone', (data) => {
      console.log('syncDone')
      console.log(data)
      let updateUserlist = Object.assign([], this.data.userlist)
      
      data.userlist.map(user => {
        updateUserlist.map(item => {
          if (user.account === item.account || user.uid === item.uid) {
            Object.assign(item, user)
          }
        })
      })
      self.setData({
        onTheCall: true, // 正在通话中标记
        userlist: updateUserlist
      })
    })
    app.globalData.emitter.on('callAccepted', (data) => {
      console.log('对方接听了')
      console.log(data)
    })
    app.globalData.emitter.on('callRejected', (data) => {
      console.log('对方拒绝了')
      console.log(data)
      let { account } = data
      let uid = this.data.accountToUidMap[account]
      let player = this._getPlayerComponent(uid)
      if (player) {
        player.changeStatus('notConnected')
      }
    })
    app.globalData.emitter.on('clientLeave', (data) => {
      console.log('有人离开了，离开前：')
      console.log(self.data.userlist)

      self._personLeave(data)

      console.log('有人离开了，离开后：')
      console.log(self.data.userlist)
    })
    app.globalData.emitter.on('clientJoin', (data) => {
      console.log('有人加入了')
      self._personJoin(data)
      console.log(self.data.userlist)
    })
    app.globalData.emitter.on('hangup', (data) => {
      console.log('有人挂断了')
      console.log(data)
      if (self.data.beCalling) {
        wx.navigateBack(1)
      }
    })
    app.globalData.emitter.on('joinChannel', (data) => {
      let userlist = Object.assign([], this.data.userlist)
      userlist.map(user => {
        if (user.account === data.account) {
          user.uid = data.uid
        }
      })
      self.setData({
        userlist
      })
    })
  },
  _personJoin(data) {
    let updateUserlist = Object.assign([], this.data.userlist)
    updateUserlist.map(user => {
      if (user.uid === data.uid) {
        // 映射关键数据
        user.url = data.url
        user.cid = data.cid
        user.mode = data.mode
      }
    })
    this.setData({
      userlist: updateUserlist
    })
  },
  _personLeave(data) {
    let userlist = Object.assign([], this.data.userlist)
    userlist.map((user, index) => {
      if (user.uid === data.uid) {
        let player = this._getPlayerComponent(data.uid)
        if (player) {
          player.stop()
          player.changeStatus('leave')
        }
        user.url = ''
      }
    })
    this.setData({
      userlist
    })
  },
  /**
   * 返回指定uid组件的拉流操作上下文
   */
  _getPlayerComponent(uid) {
    const yunxinPlayer = this.selectComponent(`#yunxinplayer-${uid}`)
    return yunxinPlayer
  },
  /**
   * 返回推流组件的操作上下文
   */
  _getPusherComponent() {
    const yunxinPusher = this.selectComponent(`#yunxin-pusher`)
    return yunxinPusher
  },
  adjustAccountPosition(accounts) {
    let result = []
    let loginAccount = app.globalData.nim.account
    result.push(loginAccount)
    accounts.map(account => {
      if (account !== loginAccount) {
        result.push(account)
      }
    })
    return result
  },
  /**
   * 挂断通话
   */
  hangupHandler(notBack) {
    app.globalData.netcall && app.globalData.netcall.leaveChannel() // 兼容登录网关502错误离开房间
    this._getPusherComponent() && this._getPusherComponent().stop() // 停止推流
    // 停止拉流
    this.data.userlist.map((user) => {
      if (user.uid !== this.data.loginUser.uid) {
        this._getPlayerComponent(user.uid) && this._getPlayerComponent(user.uid).stop()
      }
    })
    this.setData({
      userlist: [],
      onTheCall: false // 通话中的标记复位
    })
    if (notBack !== true) {
      wx.navigateBack(1)
    }
  },
  /**
   * 切换摄像头回调
   */
  switchCameraHandler() {
    this._getPusherComponent().switchCamera()
  },
  /**
   * 开关摄像头、麦克风回调
   * 0音视频，1纯音频，2纯视频，3静默
   */
  switchMeetingModeHandler(e) {
    let mode = e.currentTarget.dataset.mode
    let enableCamera = this.data.enableCamera
    let muted = this.data.muted
    if (mode == 1) { // 单击了关闭摄像头 => 纯音频
      enableCamera = !enableCamera
      if (enableCamera) { // 摄像头开启 => 关闭摄像头
        if (muted) {
          mode = 2
        } else {
          mode = 0
        }
      } else { // 摄像头关闭 => 开启摄像头
        if (muted) {
          mode = 3
        } else {
          mode = 1
        }
      }
    } else if (mode == 2) { // 单击了关闭麦克风 => 纯视频
      muted = !muted
      if (muted) { // 静音：false => true
        if (enableCamera) {
          mode = 2
        } else {
          mode = 3
        }
      } else { // true => false
        if (enableCamera) {
          mode = 0
        } else {
          mode = 1
        }
      }
    }
    // 切换本地状态
    this.setData({
      enableCamera,
      muted
    })
    app.globalData.netcall.switchMode(mode)
      .then(() => {
        console.log('切换模式至 -> ', mode)
      })
      .catch((err) => {
        console.error(err)
      })
  },
  /**
   * 接听通话
   */
  acceptCallHandler(e) {
    let self = this
    // 显示通信画面
    this.setData({
      beCalling: false
    })
    // 开启音视频逻辑
    app.globalData.netcall.joinChannel({
      mode: 0,
      channelName: this.data.infoOfBeCalled.content.room,
      role: 0
    })
      .then((data) => {
        console.error(data)
        // 添加uid
        let userlist = Object.assign([], self.data.userlist)
        userlist.map(user => {
          user.uid = data.accountUidMap[user.account]
        })
        // {uid,cid,account,accountUidMap}
        self.setData({
          beCalling: false,
          loginUser: {
            uid: data.uid,
            cid: data.cid,
            account: data.account
          },
          userlist,
          accountToUidMap: data.accountUidMap,
        })
        wx.createLivePusherContext(this).start()
      })
  },
  /**
   * 拒绝通话:todo
   */
  rejectCallHandler(e) {
    wx.navigateBack(1)
  },
  onPusherFailed() {
    console.error('推流失败！！')
  }
})