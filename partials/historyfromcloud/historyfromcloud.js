import { calcTimeHeader, generateFingerGuessImageFile, generateBigEmojiImageFile, generateRichTextNode, generateImageNode } from '../../utils/util.js'
import { voice } from '../../utils/imageBase64.js'
var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chatTo: '',
    voiceIcon: '',// 小喇叭图标base64
    messageArr: [], //[{scene,from,fromNick,flow,to,text,type,time,content,file,geo,displayTimeHeader]}]
    lastMsgId: '', // 上次查询的最后一条消息的idServer,第一次不用,
    endTime: '', // 存储上次加载的最后一条消息的时间，后续加载更多使用
    limit: 100, // 每次查询结果
    historyAllDone: false, //是否已经加载完所有历史
    isVideoFullScreen: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // console.log(options)
    this.getHistoryMsgs(options.account)
    this.setData({
      chatTo: options.account,
      voiceIcon: voice,
      chatToLogo: decodeURIComponent(options.chatToLogo),
      userLogo: app.globalData.loginUser['avatar'] || 'http://yx-web.nos.netease.com/webdoc/h5/im/default-icon.png'
    })
  },
  /**
   * 下拉刷新钩子
   */
  onPullDownRefresh() {
    if (this.data.historyAllDone) {
      wx.stopPullDownRefresh()
    } else {
      app.globalData.nim.getHistoryMsgs({
        scene: 'p2p',
        to: this.data.chatTo,
        limit: this.data.limit,
        asc: true, // 时间正序排序
        lastMsgId: this.data.lastMsgId,
        endTime: this.data.endTime,
        done: this.getHistoryMsgsDone
      });
    }
  },
  /**
   * 获取云端历史记录
   */
  getHistoryMsgs(account) {
    wx.showLoading({
      title: '加载历史消息中',
    })
    app.globalData.nim.getHistoryMsgs({
      scene: 'p2p',
      to: account,
      limit: this.data.limit,
      asc: true,// 时间正序排序
      done: this.getHistoryMsgsDone
    })
  },
  /**
   * 历史消息获取成功回调
   */
  getHistoryMsgsDone(err, obj) {
    wx.hideLoading()
    if(err) {
      console.log(err)
      wx.showToast({
        title: '请检查网络后重试',
        duration: 1500,
        icon: 'none'
      })
      return
    }
    this.formatMsgs(obj.msgs)
  },
  /**
   * 格式化收到的消息，以便显示
   */
  formatMsgs(msgs) {
    let self = this
    let resultArr = [] // 存储结果数组
    let messageArr = [...self.data.messageArr] // 已经渲染完成数组
    // console.log(msgs)
    msgs.map((message,index) => {
      // 类型 
      let type = ''
      if (message.type === 'custom' && JSON.parse(message['content'])['type'] === 1) {
        type = '猜拳'
      } else if (message.type === 'custom' && JSON.parse(message['content'])['type'] === 3) {
        type = '贴图表情'
      } else {
        type = message.type
      }
      // 时间头部
      let displayTimeHeader = ''
      if(index === 0) {
        displayTimeHeader = calcTimeHeader(message.time)
      } else {
        let delta = message.time - msgs[index - 1].time
        if(delta > 2*60*1000) { // 超过两分钟，才计算
          displayTimeHeader = calcTimeHeader(message.time)
        }
      }
      // 富文本节点信息
      let nodes = []
      if(type === 'text') {
        nodes = generateRichTextNode(message.text)
      } else if(type === 'tip') {
        nodes = [{
          type: 'text',
          text: message.tip
        }]
      } else if(type === 'image'){
        nodes = generateImageNode(message.file)
      } else if (type === '贴图表情') {
        nodes = generateImageNode(generateBigEmojiImageFile(JSON.parse(message.content)))
      } else if(type === '猜拳') {
        nodes = generateImageNode(generateFingerGuessImageFile(JSON.parse(message.content).data.value))
      }
      messageArr.push({
        type,
        text: message.text,
        time: message.time,
        sendOrReceive: message.flow === 'in' ? 'receive' : 'send',
        displayTimeHeader,
        geo: message.geo || null,
        file: message.file || null,
        nodes 
      })
    })
    // console.log(messageArr)
    // if(msgs.length < self.data.limit) { // 返回的数量小于预期加载数量，加载结束
    //   self.setData({
    //     historyAllDone: true
    //   })
    // }
    self.setData({
      messageArr,
      // lastMsgId: messageArr[0].idServer,
      // endTime: messageArr[0].time
    })
    // if (self.data.messageArr.length <= self.data.limit) { // 第一次加载，滚动至底部
    //   setTimeout(() => {
    //     self.scrollToBottom()
    //   }, 200)
    // } else { // 加载更多，无须滚动

    // }
    setTimeout(() => {
      self.scrollToBottom()
    }, 200)
  },
  /**
   * 滚动页面到底部
   */
  scrollToBottom() {
    let self = this
    wx.createSelectorQuery().select('#historyWrapper').boundingClientRect(function (rect) {
      wx.pageScrollTo({
        scrollTop: rect.height + 100,
        duration: 100
      })
    }).exec()
  },
  /**
   * 查看全屏地图
   */
  fullScreenMap(e) {
    let geo = e.currentTarget.dataset.geo
    wx.openLocation({
      latitude: geo.lat,
      longitude: geo.lng,
    })
  },
  /**
   * 播放音频
   */
  playAudio(e) {
    let audio = e.currentTarget.dataset.audio
    const audioContext = wx.createInnerAudioContext()
    if (audio.ext === 'mp3') { // 小程序发送的
      audioContext.src = audio.url
    } else {
      audioContext.src = audio.mp3Url
    }
    audioContext.play()
    audioContext.onPlay(() => {
      wx.showToast({
        title: '播放中',
        icon: 'none',
        duration: audio.dur
      })
    })
    audioContext.onError((res) => {
      wx.showToast({
        title: res.errCode,
        icon: 'none',
        duration: 1500
      })
    })
  },
  /**
  * 全屏播放视频
  */
  requestFullScreenVideo(e) {
    let video = e.currentTarget.dataset.video
    // console.log(video)
    let videoContext = wx.createVideoContext('videoEle')

    this.setData({
      isVideoFullScreen: true,
      videoSrc: video.url,
      videoContext
    })
    videoContext.requestFullScreen()
    videoContext.play()
  },
  /**
   * 视频播放结束钩子
   */
  videoEnded() {
    this.setData({
      isVideoFullScreen: false,
      videoSrc: ''
    })
  },
})
