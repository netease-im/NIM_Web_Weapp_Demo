import { pushLog, checkStringLength } from '../../utils/util.js'
import { iconLogo } from '../../utils/imageBase64.js'
import IMEventHandler from '../../utils/imeventhandler.js'
import MD5 from '../../vendors/md5.js'
var app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    errorMessage: '', // 显示错误提示信息
    transports: ['websocket'],//传输方式
    isLogin: false,// 登录状态
    account: '',// 用户输入账号
    password: ''//用户输入密码
  },
  onLoad() {
    this.setData({
      iconLogo
    })
    // setTimeout(() => {
    //   app.globalData.nim.disconnect || app.globalData.nim.disconnect()
    //   setTimeout(() => {
    //     app.globalData.nim.connect || app.globalData.nim.connect()
    //   }, 5*1000)
    // }, 10*1000)
    let self = this
    app.globalData.subscriber.on('STOP_IS_LOGIN', function() {
      self.setData({
        isLogin: false
      })
    })
  },
  /**
   * 用户输入事件：dataset区分输入框类别
   */
  inputHandler: function(e) {
    let temp = {}
    temp[e.currentTarget.dataset.type] = e.detail.value
    this.setData(temp)
  },

  /**
   * 单击登录：提交表单
   */
  loginSubmit: function(e) {
    let account = this.data.account,
      password = this.data.password
    this.login({ account, password })
  },
  /**
   * 单击注册:跳转注册页
   */
  registerTap: function() {
    wx.navigateTo({
      url: '../register/register',
    })
  },

  /**
   * 登录逻辑
   */
  login: function(user) {
    let self = this
    this.setData({
      isLogin: true
    })
    app.globalData.isLogin = true
    setTimeout(()=>{
      if (app.globalData.isLogin === true) {
        self.setData({
          isLogin: false
        })
        wx.showToast({
          title: '请检查网络',
          icon: 'none',
          duration: 1500
        })
      }
    }, 15*1000)
    new IMEventHandler({ 
      token: MD5(user.password), 
      account: user.account 
    })
  },
})