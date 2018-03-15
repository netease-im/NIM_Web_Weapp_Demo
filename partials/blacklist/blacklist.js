var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    defaultLogo: 'http://yx-web.nos.netease.com/webdoc/h5/im/default-icon.png',
    accounts: [], //黑名单账户 [{account,nick,avatar}]
    friendsCard: {} //所有好友的名片
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    wx.setNavigationBarTitle({
      title: '黑名单',
    })
    app.globalData.nim.getRelations({
      accounts: Object.keys(app.globalData.blackList),
      done: this.getRelations
    })
  },
  /**
   * 获取黑名单和静音列表
   */
  getRelations(err, obj) {
    if(err) {
      console.log(err)
      return
    }
    let self = this
    let blacklist = obj.blacklist
    
    // 和全局合并黑名单数据，增量添加使用过程中添加黑名单
    // 可能存在invalid字段，需要做特殊处理
    let resultArr = []
    let tempArr = []
    if (Object.keys(blacklist).indexOf('invalid') === -1) { // 不存在静音列表
      tempArr = blacklist
    } else { // 存在静音列表
      // 排除掉静音列表
      let keys = Object.keys(blacklist)
      keys.splice(keys.indexOf('invalid'), 1)
      keys.map(key => {
        tempArr.push(blacklist[key])
      })
    }
    self.generateBlackListToRender(tempArr)
    .then(arr => {
      resultArr = arr
      resultArr.map(item => {
        if (!app.globalData.blackList[item.account]) {
          app.globalData.blackList[item.account] = item
        }
      })
      // 对已有的黑名单列表进行排序
      console.log('对已有的黑名单列表进行排序', app.globalData.blackList)
      resultArr.sort((a, b) => {
        return parseInt(a.addTime) - parseInt(b.addTime)
      })

      // 获取所有黑名单用户的名片信息（非好友可能也是黑名单需要特殊处理
      // 由于涉及到非好友下拉黑，所以需要提前获取非好友的个人名片
      self.setData({
        accounts: resultArr
      })
    })
    .catch(err => {
      wx.showToast({
        title: '获取黑名单列表失败，请重试！',
        icon: 'none',
        duration: 1500
      })
    })
    
  },
  /**
   * 切换到个人页面
   */
  switchToPersonCard(e) {
    let user = e.currentTarget.dataset.user
    let isFriend = true
    let friendsAccountArr = []
    app.globalData.friends.map(friend => {
      friendsAccountArr.push(friend.account)
    })
    if (friendsAccountArr.indexOf(user.account) !== -1) {
      wx.navigateTo({
        url: '../personcard/personcard?account=' + user.account,
      })
    } else {
      app.globalData.nim.getUser({
        account: user.account,
        done: function (err, userCard) {
          if (err) {
            console.log(err)
            return
          }
          wx.navigateTo({
            url: '../strangercard/strangercard?user=' + encodeURIComponent(JSON.stringify(userCard)),
          })
        }
      })
    }
  },
  /**
   * 生成黑名单列表指定数据
   */
  generateBlackListToRender(arr) {
    let self = this
    let resultArr = []
    let accounts = arr.map(item => item.account)
    if(accounts.length === 0) {
      return Promise.resolve([])
    }
    return new Promise((resolve, reject) => {
      app.globalData.nim.getUsers({
        accounts,
        done: function (err, friendsCard) {
          if (err) {
            console.log(err)
            reject(err)
          }
          friendsCard.map(friendCard => {
            resultArr.push({
              account: friendCard.account,
              createTime: friendCard.createTime,
              updateTime: friendCard.updateTime,
              nick: friendCard.nick || item.account,
              avatar: friendCard.avatar || self.data.defaultLogo
            })
          })
          resolve(resultArr)
        }
      })
    })
  }
})