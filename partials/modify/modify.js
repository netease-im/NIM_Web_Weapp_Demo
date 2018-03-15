let app = getApp()
let loginUser = app.globalData.loginUser

import { validStringType } from '../../utils/util.js'

const navigationBarTitle = {
  'nick': '昵称',
  'gender': '性别',
  'birth': '我的',
  'tel': '手机',
  'email': '邮箱',
  'sign': '签名'
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    type: '',
    gender: 'unknown',
    nick: '',
    tel: '',
    email: '',
    sign: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let type = options.type
    wx.setNavigationBarTitle({
      title: navigationBarTitle[type],
    })
    this.setData({ 
      type,
      sign: app.globalData.loginUser.sign
    })
    // 初始化默认性别
    if(type === 'gender') {
      this.setData({
        gender: app.globalData.loginUser.gender
      })
    }
  },
  /**
   * 昵称变化
   */
  nickChange(e) {
    this.setData({
      nick: e.detail.data
    })
  },
  /**
   * 性别变化
   */
  genderChange(e) {
    let gender = e.currentTarget.dataset.gender
    this.setData({ gender })
    // 全局存储
    if (this.data.type == 'gender' && this.data.gender != app.globalData.loginUser.gender) {
      app.globalData.nim.updateMyInfo({
        gender: this.data.gender
      })
      app.globalData.loginUser.gender = this.data.gender
    }
    wx.navigateBack({})
  },
  /**
   * 选择日期处理函数
   */
  birthChange(e) {
    // console.log(e)
  },
  /**
   * 手机号变化
   */
  telChange(e) {
    this.setData({
      tel: e.detail.data
    })
  },
  /**
   * 邮箱变化
   */
  emailChange(e) {
    this.setData({
      email: e.detail.data
    })
  },
  /**
   * 签名变化
   */
  signChange(e) {
    this.setData({
      sign: e.detail.value
    })
  },
  /**
   * 提交保存
   */
  submit() {
    let self = this,
      paraObj = {}
    // 防止输入为空的情况
    if (self.data[self.data.type].trim().length === 0) {// 输入的全是空格
      wx.showToast({
        title: '输入不能为空',
        icon: 'none',
        duration: 1500
      })
      return
    }
    if(self.data.type == 'email') {
      if (!validStringType(self.data[self.data.type], 'email')) {
        wx.showToast({
          title: '请输入有效邮箱格式!',
          icon: 'none',
          duration: 1500
        })
        return
      }
    }

    self.setData({
      isSaving: true
    })
    paraObj[self.data.type] = self.data[self.data.type]
    paraObj['done'] = () => {
      self.setData({
        isSaving: false
      })
      app.globalData.loginUser[self.data.type] = self.data[self.data.type]
      wx.navigateBack()
    }
    app.globalData.nim.updateMyInfo(paraObj)
  },
})