//app.js
var util = require('./utils/util.js')
var config = require('./utils/config.js')
var subscriber = require('./utils/event.js')

App({
  /**
   * 初始化完成只会触发一次
   */
  onLaunch: function () {
    // wx.getSystemInfo({
    //   success: function (res) {
    //     let arr = res.SDKVersion.split('.')
    //     let num = parseInt(arr[0]) * 10 + parseInt(arr[1])
    //     if (num < 19) {
    //       wx.showModal({
    //         title: '提示',
    //         content: '当前微信版本过低，请升级到最新微信版本后重试。',
    //       })
    //     }
        
    //   }
    // })
  },
  /**
   * 启动或前台进入后台
   */
  onShow() {
    // wx.reLaunch({
    //   url: '/pages/login/login',
    // })
  },
  /**
   * 前台进入后台
   */
  onHide() {
  },
  onError(err) {
    // console.log('小程序出错了', err)
  },
  globalData:{
    isLogin: false, // 当前是否是登录状态
    currentChatTo: '', // 记录当前聊天对象account，用于标记聊天时禁止更新最近会话unread
    loginUser: {},//当前登录用户信息
    friends: [],//好友列表，
    friendsWithCard: {}, // 带有名片信息的好友列表（转发时使用）
    friendsCard: {},//带有名片信息的好友列表
    onlineList: {},//在线人员名单 account: status
    blackList: {},//黑名单列表
    config,//存储appkey信息
    nim: {},//nim连接实例
    subscriber, //消息订阅器
    notificationList: [], // 通知列表
    recentChatList: {},//最近会话列表
    rawMessageList: {}, //原生的所有消息列表(包含的字段特别多)
    messageList: {}//处理过的所有的消息列表
  }
})
/** Demo数据
 * onlineList: {hzfangtiankui: "Android[Wifi]在线", kuguaying: "iOS[Wifi]在线"}
 * loginUser: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}
 * friends: [{account:'',createTime:'',updateTime:'',valid:true}]
 * friendsWithCard: {account: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}} 字段可能不全，需要检测
 * friendsCard: {account: {account:'', nick:'',avatar:'',birth:'',email:'',gender:'',sign:'',tel:'',createTime:'',updateTime:''}} 字段可能不全，需要检测
 * blacklist: {account: {account:'',createTime:'',updateTime:''}} account做key方便查找
 * rawMessageList:{
 *  account: {time1:{},time2:{}}
 * }
 * messageList: {
 *   loginUser: {
 *      account: {time1:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}, time2:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}}
 *   }
 * }
 * recentChatList: {
 *  to: {time1:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}, time2:{from,to,type,scene,text,sendOrReceive,displayTimeHeader}}
 * }
 * notificationList: [{category,from,time,to,type}]
 */