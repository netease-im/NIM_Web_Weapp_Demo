import { showToast, correctData } from '../../utils/util.js'
let app = getApp()
let store = app.store
let pageConfig = {
  data: {
    defaultAvatar: app.globalData.PAGE_CONFIG.defaultUserLogo,
    userCard: {},
    isBlack: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let account = options.account
    let userCard = store.getState().friendCard[account]
    this.setData({
      userCard: correctData(userCard),
      isBlack: userCard.isBlack || false
    })
  },
  /**
   * 删除好友按钮
   */
  deleteFriendBtnHandler() {
    wx.showModal({
      title: '确认删除此好友',
      content: '',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {//用户点击确定
          this.doDeleteFriend()
        }
      }
    })
  },
  /**
   * 发送请求，删除好友
   */
  doDeleteFriend() {
    let self = this
    app.globalData.nim.deleteFriend({
      account: self.data.userCard.account,
      done: (err, obj) => {
        if (err) {
          console.log(err)
          return
        }
        store.dispatch({
          type: 'FriendCard_Delete_By_Account',
          payload: self.data.userCard.account
        })
        wx.switchTab({
          url: '../../pages/contact/contact',
        })
      }
    })
  },
  /**
   * 聊天按钮
   */
  chatBtnHandler() {
    // 更新会话对象
    store.dispatch({
      type: 'CurrentChatTo_Change',
      payload: this.data.userCard.account
    })
    wx.navigateTo({
      url: '../chating/chating?chatTo=' + this.data.userCard.account,
    })
  },
  /**
   * 加入黑名单
   */
  toggleBlackList(e) {
    let account = this.data.userCard.account
    let self = this
    if (e.detail.value) {//加入黑名单
      wx.showModal({
        title: '',
        content: '加入黑名单，你将不再收到对方消息',
        confirmColor: '#f00',
        success: function (res) {
          if (res.confirm) { // 确定
            // 发送请求
            app.globalData.nim.markInBlacklist({
              account,
              isAdd: true,//true表示加入黑名单,
              done: (err, obj) => {
                if (err) {
                  console.log(err)
                  return
                }
                // 更新数据
                store.dispatch({
                  type: 'Blacklist_Update_MarkInBlacklist',
                  payload: {
                    account,
                    isBlack: true,
                    addTime: new Date().getTime() // 用这个排序
                  }
                })
                showToast('text', '拉入黑名单成功')
              }
            })
          } else {
            self.setData({
              isBlack: false
            })
          }
        }
      })
    } else {//从黑名单移除
      // 发送请求
      app.globalData.nim.markInBlacklist({
        account,
        isAdd: false,//true表示加入黑名单,
        done: (err, obj) => {
          if (err) {
            console.log(err)
            return
          }
          store.dispatch({
            type: 'Blacklist_Update_MarkInBlacklist',
            payload: {
              account,
              isBlack: false,
              addTime: new Date().getTime()
            }
          })
          showToast('text', '移除黑名单成功')
        }
      })
    }
  }
}
Page(pageConfig)
