import { showToast, calculateP2PPosition, formatNumber } from '../../utils/util.js'

const app = getApp()
Page({
  data: {
    onTheCall: false, //正在通话中标记
    isCalling: false,// 主叫中
    beCalling: false, // 被叫中
    callingPosition: {}, // 呼叫中的位置
    enableCamera: true, // 开启摄像头标记
    muted: false, // 静音标记
    userlist: [], // 所有用户列表
    loginUser: {}, // {uid,account,cid}
    infoOfBeCalled: {}, // 被叫时传递过来的：主叫信息
    netcallTime: 0, // 通话时长
    duration: '', // 格式化后的时间
  },
  onLoad: function (options) {
    console.log(options)
    wx.setKeepScreenOn({
      keepScreenOn: true
    })

    let pageTitle = ''
    if (options.beCalling) { // 被叫
      pageTitle = options.caller
      this.setData({
        pageTitle: pageTitle,
        beCalling: true,
        infoOfBeCalled: {
          caller: options.caller,
          cid: options.cid,
          type: options.type
        }
      })
    } else { // 主叫
      this.setData({
        isCalling: true,
        pageTitle: pageTitle,
        callingPosition: {
          x: 0,
          y: 0,
          width: app.globalData.videoContainerSize.width,
          height: app.globalData.videoContainerSize.height
        }
      })
      app.globalData.netcall.call({
        type: 2, // 通话类型：1音频，2视频
        callee: options.callee, // 被叫
        forceKeepCalling: true, // 持续呼叫
      })
      .catch((error) => {
        showToast('text', '呼叫失败，请重试', { duration: 2000 })
        setTimeout(() => {
          wx.navigateBack(1)
        }, 2000)
      })
      pageTitle = options.callee
      this.callTimerId = setTimeout(() => {
        showToast('text', '无人接听', {duration: 2000})
        setTimeout(() => {
          this.hangupHandler()
        }, 2000)
      }, 30 * 1000)
    }
    wx.setNavigationBarTitle({
      title: pageTitle,
    })
    this.listenNetcallEvent()
  },
  onUnload() {
    if (this.data.onTheCall || this.data.isCalling) {
      this.hangupHandler(true)
    }
    app.globalData.emitter.eventReset()
  },
  _unBindNetcallEvent() {
    app.globalData.emitter.eventReset()
  },
  listenNetcallEvent() {
    let self = this
    app.globalData.emitter.on('syncDone', (data) => {
      console.log('同步完成')
      console.log(data)
      self.setData({
        onTheCall: true, // 正在通话中标记
        userlist: calculateP2PPosition(data.userlist, [...this.data.userlist])
      })
      self._clearCallTimer()
      self._getPusherComponent().start()
      // 设置通话定时计时器
      if (!self.netcallTimeTimer) {
        self.netcallTimeTimer = setInterval(() => {
          let { hour, minute, second } = self._formateDuration(self.data.netcallTime + 1)
          self.setData({
            netcallTime: self.data.netcallTime + 1,
            duration: `${hour}:${minute}:${second}`
          })
        }, 1000)
      }
    })
    app.globalData.emitter.on('callAccepted', (data) => {
      console.log('对方接听了')
      // 开启音视频逻辑
      app.globalData.netcall.startRtc({ mode: 0 })
        .then((data) => {
          console.log(`开启音视频成功`)
          console.log(data)
          self.setData({
            loginUser: data,
            isCalling: false
          })
        })
    })
    app.globalData.emitter.on('callRejected', (data) => {
      console.log('对方拒绝了')
      console.log(data)
      this.setData({
        onTheCall: false
      })
      showToast('text', '对方拒绝', { duration: 2000 })
      this._clearCallTimer()
      setTimeout(() => {
        wx.navigateBack(1)
      }, 2000)
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
    app.globalData.emitter.on('beCalling', (data) => {
      console.log('被叫了')
      console.log(data)
      if (this.data.onTheCall || this.data.isCalling || this.data.infoOfBeCalled.cid != data.cid) {
        app.globalData.netcall.response({
          accepted: false,
          caller: data.caller,
          type: data.type,
          cid: data.cid
        })
        return
      }
      this.setData({
        infoOfBeCalled: data
      })
    })
    app.globalData.emitter.on('hangup', (data) => {
      console.log('对端挂断了')
      console.log(data)
      console.log(this.data.loginUser)
      // 接通过程
      if (data.cid != this.data.loginUser.cid && this.data.onTheCall) {
        console.warn('接通过程,非本通通话，抛弃')
        return
      }
      // 被叫过程
      if (this.data.beCalling && this.data.infoOfBeCalled.cid != data.cid) {
        console.warn('被叫过程,非本通通话，抛弃')
        return
      }
      // 主叫过程
      if (this.data.isCalling && data.account != this.data.pageTitle) {
        console.warn('主叫过程,非本通通话，抛弃')
        return
      }
      // 清除本地画面
      this.setData({
        onTheCall: false,
      })
      showToast('text', '对方已经挂断', {duration: 2000})
      setTimeout(() => {
        wx.navigateBack(1)
      }, 2000)
    })
  },
  _personJoin(data) {
    let uids = this.data.userlist.map(user => user.uid) || []
    if (uids.includes(data.uid) === false) {
      let userlist = calculateP2PPosition([data], this.data.userlist, {
        uid: this.data.loginUser.uid
      })
      this.setData({
        userlist: userlist
      })
    }
  },
  _personLeave(data) {
    var userlist = Object.assign([], this.data.userlist)
    userlist.map((user, index) => {
      if (user.uid === data.uid) {
        userlist.splice(index, 1)
      }
    })
    userlist = calculateP2PPosition([], userlist, {})
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

      if (enableCamera) {
        showToast('text', '摄像头已打开')
      } else {
        showToast('text', '摄像头已关闭')
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
      if (muted) {
        showToast('text', '麦克风已关闭')
      } else {
        showToast('text', '麦克风已打开')
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
    // this.setDatas
    app.globalData.netcall.response({
      caller: this.data.infoOfBeCalled.caller,
      accepted: true,
      type: this.data.infoOfBeCalled.type,
      cid: this.data.infoOfBeCalled.cid
    })
      .then(() => {
        // 开启音视频逻辑
        app.globalData.netcall.startRtc({ mode: 0 })
          .then((data) => {
            self.setData({
              beCalling: false,
              isCalling: false,
              loginUser: data
            })
          })
      })
      .catch((error) => {
        console.error(error)
      })
  },
  /**
   * 拒绝通话
   */
  rejectHandler(e) {
    app.globalData.netcall.response({
      caller: this.data.infoOfBeCalled.caller,
      accepted: false,
      type: this.data.infoOfBeCalled.type,
      cid: this.data.infoOfBeCalled.cid
    })
      .then(() => {
        wx.navigateBack(1)
      })
      .catch((error) => {
        console.error(error)
      })
  },
  /**
   * 挂断通话
   */
  hangupHandler(notBack = false) {
    try{
      app.globalData.netcall && app.globalData.netcall.hangup() // 兼容登录网关502错误离开房间
    } catch(error) {
      console.warn(error)
    }
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
    this._clearCallTimer()
    this._clearNetcallTimeTImer()
    this._unBindNetcallEvent()
  },
  /**
   * 清除呼叫定时器
   */
  _clearCallTimer() {
    if (this.callTimerId) {
      clearTimeout(this.callTimerId)
      this.callTimerId = null
    }
  },
  /**
   * 清除通话计时定时器
   */
  _clearNetcallTimeTImer() {
    if (this.netcallTimeTimer) {
      clearTimeout(this.netcallTimeTimer)
      this.netcallTimeTimer = null
    }
  },
  /**
   * 格式化需要时间
   */
  _formateDuration(time) {
    let hour = parseInt(time / 3600)
    let minute = parseInt((time - hour * 3600) / 60)
    let second = time % 60
    return {
      hour: formatNumber(hour),
      minute: formatNumber(minute),
      second: formatNumber(second)
    }
  },
  cameraOpenErrorHandler(e) {
    console.error(e)
  } 

})
