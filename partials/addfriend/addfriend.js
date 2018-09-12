import { connect } from '../../redux/index.js'
import { showToast, correctData } from '../../utils/util.js'
let app = getApp()
let store = app.store
let pageConfig = {
  data: {
    inputVal: ''
  },
  /**
   * 点击取消，返回上一层
   */
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
  /**
   * 搜索
   */
  search(e) {
    wx.showLoading({
      title: '搜索中',
    })
    let val = e.detail.value
    if (!val) {
      showToast('error', '请输入内容')
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
    if (err) {
      console.log(err)
      return
    }
    if (user) {
      if (user.account == this.data.userInfo.account) { //自己
        wx.switchTab({
          url: '../../pages/setting/setting',
        })
      } else { //非自己：可能好友可能陌生人
        let isFriend = false
        let accounts = Object.keys(this.data.friendCard)

        // 是否好友
        accounts.map(account => {
          if (account == user.account && this.data.friendCard[account].isFriend == true) {
            isFriend = true
            return
          }
        })
        if (isFriend) {//好友
          wx.navigateTo({
            url: '../personcard/personcard?account=' + user.account,
          })
        } else {//陌生人
          store.dispatch({
            type: 'FriendCard_Update_NonFriendInfoCard',
            payload: user
          })
          wx.navigateTo({
            url: '../strangercard/strangercard?account=' + user.account,
          })
        }
      }
    } else {
      showToast('text', '该好友不存在')
    }
  }
}
let mapStateToData = (state) => {
  return {
    userInfo: state.userInfo,
    friendCard: state.friendCard
  }
}
let connectedPageConfig = connect(mapStateToData)(pageConfig)
Page(connectedPageConfig)