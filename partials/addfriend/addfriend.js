let app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    inputVal: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '添加好友',
    })
  },
  // 取消
  cancel() {
    wx.navigateBack()
  },
  textChange(e) {
    this.setData({
      inputVal: e.detail.value
    })
  },
  clearInput() {
    this.setData({
      inputVal: ''
    })
  },
  // 搜索
  search(e) {
    wx.showLoading({
      title: '搜索中',
    })
    let val = e.detail.value
    if(!val) {
      wx.showToast({
        title: '请输入内容',
        duration: 1500,
        icon: 'none'
      })
      return
    }
    app.globalData.nim.getUser({
      account: val,
      done: this.searchResult
    })
  },
  /**
   * 搜索结果
   */
  searchResult(err, user) {
    wx.hideLoading()
    if(err) {
      console.log(err)
      return
    }
    if(user) {
      if (user.account == app.globalData.loginUser.account) { //自己
        wx.switchTab({
          url: '../../pages/setting/setting',
        })
      } else { //非自己：可能好友可能陌生人
        let isFriend = false
        // 是否好友
        app.globalData.friends.map(item => {
          if (item.account == user.account) {
            isFriend = true
            return
          }
        })
        if(isFriend) {//好友
          wx.navigateTo({
            url: '../personcard/personcard?account=' + user.account,
          })
        } else {//陌生人
          wx.navigateTo({
            url: '../strangercard/strangercard?user=' + encodeURIComponent(JSON.stringify(user)),
          })
        }
      }
    } else {
      wx.showToast({
        title: '该好友不存在',
        duration: 1500,
        icon: 'none'
      })
    }
  }
  
})