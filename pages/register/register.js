import { post, validStringType } from '../../utils/util.js'
import { iconLogo } from '../../utils/imageBase64.js'
import IMEventHandler from '../../utils/imeventhandler.js'
import MD5 from '../../vendors/md5.js'

let app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    iconLogo: '',
    account: '',//账号
    nickname: '',// 昵称
    password: '',//密码
    isRegister: false,//登录菊花,
    errorMessage: '',//提示错误信息
    showHint: false,
  },
  onLoad() {
    this.setData({
      iconLogo
    })
  },

  inputHandler: function(e) {
    let temp = {}
    temp[e.currentTarget.dataset.type] = e.detail.value
    this.setData(temp)
  },

  /**
   * 单击注册，登录表单提交
   */
  registerSubmit: function (e) {
    let errorMessage = '',
      username = this.data.account,
      nickname = this.data.nickname,
      password = this.data.password
    let self = this

    if (!validStringType(username, 'string-number')) {
      errorMessage = '账号限字母或数字'
    }
    if (!validStringType(nickname, 'string-number-hanzi')) {
      errorMessage = '昵称限汉字、字母或数字'
    }
    if ((password.length < 6) || !validStringType(password, 'string-number')) {
      errorMessage = '密码限6~20位字母或数字'
    }
    if (errorMessage.length > 0) {//显示错误信息
      wx.showToast({
        title: errorMessage,
        duration: 1500,
        icon: 'none'
      })
      return
    }

    this.setData({
      isRegister: true
    })

    post({
      url: app.globalData.config.url + '/api/createDemoUser',
      data: {
        username,
        password: MD5(password),
        nickname
      },
      header: {
        'appkey': app.globalData.config.appkey,
        'content-type': 'application/x-www-form-urlencoded'
      }
    }).then(data => {
      self.setData({
        isRegister: false
      })
      if (data.data.data.res == 414) {
        wx.showToast({
          title: '该账号已注册',
          duration: 1500,
          icon: 'none'
        })
        return
      }
      if(data.data.data.res == 200) {
        new IMEventHandler({
          token: MD5(password),
          account: username
        })
      } else {
        self.setData({
          errorMessage: data.data.data.errmsg
        })
      }
    }, err => {
      self.setData({
        isRegister: false
      })
      wx.showToast({
        title: err+'',
        duration: 1500,
        icon: 'none'
      })
      console.log(err)
    })
  },
  /**
   * 单击登录
   */
  registerLoginTap: function () {
    wx.navigateBack({
      url: '../login/login',
    })
    // console.log(getCurrentPages())
  }
})
