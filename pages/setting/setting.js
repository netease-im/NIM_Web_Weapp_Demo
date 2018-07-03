import { iconRightArrow } from '../../utils/imageBase64.js'
var app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    iconRightArrow: '',
    defaultUserLogo: '/images/default-icon.png',
    loginUser: {},
    logoUrl: ''
  },
  /**
   * 登录后获取设置界面数据
   */
  onLoad(options) {
    let self = this
    self.setData({
      iconRightArrow
    })
    wx.setNavigationBarTitle({
      title: '我的',
    })
    // 监听名片更新变化
    app.globalData.subscriber.on('UPDATE_MY_INFO', (newInfo) => {
      // console.log('UPDATE_MY_INFO')
      self.setData({
        loginUser: self.correctData(app.globalData.loginUser)
      })
    })
  },
  onShow() {
    this.setData({
      loginUser: this.correctData(app.globalData.loginUser)
    })
  },
  /**
   * 登出
   */
  logout: function() {
    wx.showLoading({
      title: '注销中...',
    })

    // app.globalData.nim.disconnect()
    app.globalData.nim.destroy({
      done: function () {
        console.log('destroy nim done !!!')
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
        wx.hideLoading()
        wx.reLaunch({
          url: '../login/login',
        })
      }
    })
    
  },
  /** 
   * 由于返回的用户数据字段不全，需要手动校验
   */
  correctData: function(obj) {
    // account: "wujie"
    // avatar: ""
    // birth: "1989-05-13"
    // createTime: 1441173394044
    // email: "w773679148@163.com"
    // gender: "male"
    // nick: "归海一刀"
    // sign: "hello world!！"
    // tel: "110"
    // updateTime: 1466044995429
    let temp = {}
    temp['account'] = obj['account']
    temp['nick'] = obj['nick']
    temp['avatar'] = obj['avatar'] || this.data.defaultUserLogo
    temp['birth'] = obj['birth'] || '未设置'
    temp['gender'] = obj['gender'] || '未设置'
    temp['sign'] = obj['sign'] || '未设置'
    temp['email'] = obj['email'] || '未设置'
    temp['tel'] = obj['tel'] || '未设置'
    return temp
  },
  /**
   * 个人信息详情修改
   */
  detailTapHandler: function(e) {
    let type = e.target.dataset.type
    console.log(type)
    switch(type) {
      case 'nick': 
        wx.navigateTo({
          url: '../../partials/modify/modify?type=nick',
        })
        break;
      case 'gender':
        wx.navigateTo({
          url: '../../partials/modify/modify?type=gender',
        })
        break;
      case 'birth':
        // wx.navigateTo({
        //   url: '../../partials/modify/modify?type=birth',
        // })
        // console.log('switch 也监听到了')
        break;
      case 'tel':
        wx.navigateTo({
          url: '../../partials/modify/modify?type=tel',
        })
        break;
      case 'email':
        wx.navigateTo({
          url: '../../partials/modify/modify?type=email',
        })
        break;
      case 'sign':
        wx.navigateTo({
          url: '../../partials/modify/modify?type=sign',
        })
        break;
      default:
        break;
    }
  },
  /**
   * 生日选择
   */
  dateChange(e) {
    let birth = e.detail.value
    app.globalData.nim.updateMyInfo({ birth }) //发送
    app.globalData.loginUser.birth = birth //更新全局数据
    this.setData({ //刷界面
      loginUser: app.globalData.loginUser
    })
  },
  /**
   * 修改用户头像
   */
  chooseLogo() {
    let self = this
    wx.chooseImage({
      count: 1,
      success: function (res) {
        // 上传文件到nos
        app.globalData.nim.previewFile({
          type: 'image',
          wxFilePath: res.tempFilePaths[0],
          done: function(err, file) {
            if(err) {
              console.log('上传头像失败')
              return
            }
            // 上传用户头像
            app.globalData.nim.updateMyInfo({
              avatar: file.url
            })
            app.globalData.loginUser.avatar = res.tempFilePaths[0] //更新全局数据
            // 服务器返回的数据可能不全
            self.setData({
              loginUser: self.correctData(app.globalData.loginUser)
            })
          }
        })
      },
    })
  }


  
})