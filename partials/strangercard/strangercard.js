let app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rawUserData: {},//传递来的原生用户名片
    user: {}, //界面显示
    defaultAvatar: 'http://yx-web.nos.netease.com/webdoc/h5/im/default-icon.png',
    isBlack: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let paramObj = JSON.parse(decodeURIComponent(options.user))
   
    let isBlack = false
      
    // 是否黑名单
    Object.keys(app.globalData.blackList).map(account => {
      if (account == paramObj.account) {
        isBlack = true
        return
      }
    })
    let result = this.correctData(paramObj) 
    this.setData({
      rawUserData: paramObj,
      user: result,
      isBlack
    })
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
   * 聊天按钮
   */
  chatBtnHandler() {
    // console.log('click chat')//TODO 跳转聊天界面
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
        if(res.confirm) {//用户点击确定
          this.doDeleteFriend()
        }
      }
    })
    
  },
  /**
   * 添加好友按钮
   */
  addFriendBtnHandler() {
    app.globalData.nim.addFriend({
      account: this.data.user.account,
      ps: '',
      done: (err, obj) => {
        if (err) {
          // console.log(err)
          return
        }
        wx.showToast({
          title: '添加成功',
          duration: 1500,
          success: () => {
            let rawUserData = this.data.rawUserData
            // 保存好友列表到全局数据
            app.globalData.friends.push({
              account: rawUserData.account,
              createTime: rawUserData.createTime,
              updateTime: rawUserData.updateTime,
              valid: true
            })
            app.globalData.friendsCard[rawUserData.account] = rawUserData
            // 发送添加新好友信号
            app.globalData.subscriber.emit('ADD_NEW_FRIEND', rawUserData)
            wx.switchTab({
              url: '../../pages/contact/contact'
            })
          }
        })
      }
    })
  },
  /**
   * 发送请求，删除好友
   */
  doDeleteFriend() {
    app.globalData.nim.deleteFriend({
      account: this.data.user.account,
      done: (err, obj) => {
        if (err) {
          // console.log(err)
          return
        }
        let rawUserData = this.data.rawUserData
        // 从全局列表中删除已存在好友
        app.globalData.friends.map((item, index) => {
          if (rawUserData.account == item.account) {
            app.globalData.friends.splice(index, 1)// 删除
            return
          }
        })
        delete app.globalData.friendsCard[rawUserData.account]//TODO：可能存在bug，friendsCard数据还未同步过来时，为空
        // 发送添加新好友信号
        app.globalData.subscriber.emit('DELETE_OLD_FRIEND', rawUserData) 
        wx.switchTab({
          url: '../../pages/contact/contact',
        })
      }
    })
  },
  /**
   * 加入黑名单
   */
  toggleBlackList(e) {
    let value = e.detail.value
    let account = this.data.user.account
    if (value) {//加入黑名单
      wx.showActionSheet({
        itemList: ['确定'],
        itemColor: '#f00',
        success: (res) => {
          let tapIndex = res.tapIndex
          if (tapIndex == 0) {
            // 发送请求
            app.globalData.nim.markInBlacklist({
              account,
              isAdd: true,//true表示加入黑名单,
              done: (err, obj) => {
                if (err) {
                  // console.log(err)
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
            // console.log(err)
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
          app.globalData.subscriber.emit('UNMARK_FRIEND_CONTACT', { account })
        }
      })
    }
  }

  

})