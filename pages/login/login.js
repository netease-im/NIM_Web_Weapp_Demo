import IMController from '../../controller/im.js'
import { connect } from '../../redux/index.js'
let app = getApp()
let store = app.store
let pageConfig = {
  data: {
    account: '',// 用户输入账号
    password: ''//用户输入密码
  },
  // 测试使用
  onLoad() {
    new IMController({
      token: '123456',
      account: 'zys0'
    })
  },
  /**
   * 用户输入事件：dataset区分输入框类别
   */
  inputHandler: function (e) {
    let temp = {}
    temp[e.currentTarget.dataset.type] = e.detail.value
    this.setData(temp)
  },
  /**
   * 单击注册:跳转注册页
   */
  registerTap: function () {
    wx.navigateTo({
      url: '../register/register',
    })
  },
  /**
   * 执行登录逻辑
   */
  doLogin: function () {
    new IMController({
      token: this.data.password,
      account: this.data.account
    })
  }
}
let mapStateToData = (state) => {
  return {
    isLogin: state.isLogin || store.getState().isLogin
  }
}
const mapDispatchToPage = (dispatch) => ({
  loginClick: function() {
    this.doLogin()
    return
  }
})
let connectedPageConfig = connect(mapStateToData, mapDispatchToPage)(pageConfig)

Page(connectedPageConfig)