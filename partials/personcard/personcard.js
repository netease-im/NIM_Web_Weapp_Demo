let app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    defaultAvatar: 'http://yx-web.nos.netease.com/webdoc/h5/im/default-icon.png',
    userCard: {},
    isBlack: false
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({
      title: '个人名片',
    })
    let account = options.account
    let userCard = app.globalData.friendsCard[account] || null // 获取用户名片，通讯录页还没获取到所有好友名片信息
    let isBlack = false
    let self = this 
    Object.keys(app.globalData.blackList).map(key => {
      if(key == account) {
        isBlack = true
        return
      }
    })
    if (!userCard) { // 没数据，临时获取
      app.globalData.nim.getUser({
        account: account,
        done: function(err, user) {
          if (err) {
            console.log(err)
            return
          }
          self.setData({
            userCard: self.correctData(user),
            isBlack
          })
        }
      })
    } else { // 有数据直接拿
      self.setData({
        userCard: self.correctData(userCard),
        isBlack
      })
    }
    
  },
  /**
   * 格式化数据
   */
  correctData(data) {
    let obj = {}
    obj['account'] = data['account']
    obj['nick'] = data['nick']
    obj['avatar'] = data['avatar'] || this.data.defaultAvatar
    obj['gender'] = data['gender'] || '未设置'
    obj['birth'] = data['birth'] || '未设置'
    obj['tel'] = data['tel'] || '未设置'
    obj['email'] = data['email'] || '未设置'
    obj['sign'] = data['sign'] || '未设置'
    obj['remark'] = '未设置'//TODO：后期离线保存后读取
    return obj
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
    app.globalData.nim.deleteFriend({
      account: this.data.userCard.account,
      done: (err, obj) => {
        if (err) {
          console.log(err)
          return
        }
        let rawUserData = this.data.userCard
        // 从全局列表中删除已存在好友
        app.globalData.friends.map((item, index) => {
          if (rawUserData.account == item.account) {
            app.globalData.friends.splice(index, 1)// 删除
            return
          }
        })
        delete app.globalData.friendsCard[rawUserData.account]//TODO：可能存在bug，friendsCard数据还未同步过来时，为空
        // 发送删除好友信号
        app.globalData.subscriber.emit('DELETE_OLD_FRIEND', rawUserData)
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
    wx.navigateTo({
      url: '../chating/chating?chatTo=' + this.data.userCard.account,
    })
  },
  /**
   * 加入黑名单
   */
  toggleBlackList(e) {
    let value = e.detail.value
    let account = this.data.userCard.account
    let self = this
    if(value) {//加入黑名单
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
                // 插入全局黑名单列表
                app.globalData.blackList[account] = {
                  account,
                  createTime: app.globalData.friendsCard[account].createTime,
                  updateTime: app.globalData.friendsCard[account].updateTime,
                  addTime: new Date().getTime() // 用这个排序
                }

                wx.showToast({
                  title: '拉入黑名单成功',
                  duration: 1500,
                  icon: 'none'
                })
                // 向外部发送消息
                app.globalData.subscriber.emit('MARK_FRIEND_CONTACT', { account })
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
          // 从全局黑名单列表删除
          delete app.globalData.blackList[account]
          wx.showToast({
            title: '移除黑名单成功',
            duration: 1500,
            icon: 'none'
          })
          // 向外部发送消息
          app.globalData.subscriber.emit('UNMARK_FRIEND_CONTACT', { account})
        }
      })
    }
  }
})