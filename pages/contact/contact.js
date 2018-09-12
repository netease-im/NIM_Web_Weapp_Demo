import IMController from '../../controller/im.js'
import { connect } from '../../redux/index.js'
import { sortStringArray, deepClone, showToast } from '../../utils/util.js'
import { getPinyin } from '../../utils/pinyin.js'
import { iconMyComputer, iconRightArrow } from '../../utils/imageBase64.js'

let app = getApp()
let store = app.store
/**
 * todo：
 * 登录状态消息更新未做，现有逻辑是初始化时获取状态信息，然后设置全局对象（一旦未能在切换前拿到数据那么全部就是出于离线状态），切到通信录页时获取数据渲染，后面考虑采用消息订阅模式完成状态信息同步
 */
let self = this
let pageConfig = {
  /**
   * 页面的初始数据
   */
  data: {
    iconMyComputer: '',
    iconRightArrow: '',
    defaultUserLogo: '/images/default-icon.png',
    friendCata: {},//按照类别排好序的数据 {'A': [{account,nick,avatar,status,nickPinyin,isBlack}]}（如有#则在最前）
    cataHeader: [], //首字母列表(如有#则在最后)
    accountMapNick: {}//account映射nick，{account: nickPinyin}
  },
  /**
   * 检查是否加载成功数据
   */
  onShow() {
    if (Object.keys(this.data.friendCard).length == 0) {
      showToast('text', '你还没有任何好友')
      return
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let self = this
    self.setData({
      iconMyComputer,
      iconRightArrow
    })
    // 渲染本地列表 
    this.showFriendList(this.data.friendCard)
  },
  showFriendList(friendCard) {
    let self = this

    let friendCardMap = friendCard // key为account，value为该人信息
    let accountArr = Object.keys(friendCardMap) // accounts数组
    let accountMapNick = {} // 存储account映射nickPinyin，方便依据account查找friendCata
    let orderedFriendsCard = [] // 渲染列表常用数据，[{nick: 'test', account: 'nihwo', avatar: 'path', isBlack}]
    // 循环遍历
    accountArr.map(account => {
      let card = friendCardMap[account]
      // 没有account说明是非好友情况下拉黑
      if (!card.account || card.isFriend == false) {
        return
      }

      let nickPinyin = getPinyin(card.nick, '').toUpperCase()

      let renderCard = {
        'avatar': card.avatar || app.globalData.PAGE_CONFIG.defaultUserLogo,
        'account': card.account,
        'nick': card.nick,
        'nickPinyin': nickPinyin,
        'status': card.status,
        'isBlack': card.isBlack || false
      }
      // 存储account映射nickPinyin，方便依据account查找friendCata
      accountMapNick[card.account] = nickPinyin
      //刷新视图对象
      orderedFriendsCard.push(renderCard)
    })
    // 排序
    let newOrder = orderedFriendsCard.sort((a, b) => {
      return a.nickPinyin.localeCompare(b.nickPinyin)
    })
    // 数据分类 
    let result = {}
    newOrder.map((item, index) => {
      let firstLetter = item.nickPinyin[0]
      if (!self.testLetter(firstLetter)) { // 非字母
        firstLetter = '#'
      }
      if (!result[firstLetter]) {
        result[firstLetter] = []
      }
      result[firstLetter].push(item)
    })

    // 将#类放置最后
    let tempKeys = Object.keys(result)
    if (tempKeys[0] == '#') {
      tempKeys.push(tempKeys.shift())
    }
    return {
      friendCata: result,
      cataHeader: tempKeys
    }
  },
  /**
   * 单击用户条目
   */
  friendItemClick(e) {
    let account = e.currentTarget.dataset.account
    wx.navigateTo({
      url: '../../partials/personcard/personcard?account=' + account,
    })
    // 更新会话对象
    store.dispatch({
      type: 'CurrentChatTo_Change',
      payload: account
    })
  },
  /**
   * 添加好友：点击回调
   */
  addFriendHandler() {
    wx.navigateTo({
      url: '../../partials/addfriend/addfriend'
    })
  },
  /**
   * 检测数字
   */
  testNum(char) {
    return /^[0-9]*$/.test(char)
  },
  /**
   * 检测字母
   */
  testLetter(char) {
    return /^[A-Za-z]*$/.test(char)
  },
  /**
   * 排序首字母数组，可能会包含 #
   */
  sortCataHeader(temp) {
    let arr = [...temp]
    arr.sort()
    if (arr[0] === '#') {
      arr.push(arr.shift())
    }
    return arr
  },
  /**
   * 添加新的好友至列表并刷新
   * 注意如有#类需要特殊处理，cataHeader中#排在最后，friendCata中排在最前
   */
  addToFriendList(userCard) {
    let cata = deepClone(this.data.friendCata)
    let cataHeader = [...this.data.cataHeader]
    let nickPinyin = getPinyin(userCard.nick, '').toUpperCase()

    let header = nickPinyin[0] //当前类别的头
    let arr = [] //当前类下的数据
    let insertData = {
      account: userCard.account,
      nick: userCard.nick,
      avatar: userCard.avatar || this.data.defaultUserLogo,
      status: '离线',  //假设离线，后期收到数据后更新
      nickPinyin: nickPinyin
    }

    if (!this.testLetter(header)) {//非字母
      header = '#'
    }

    if (cataHeader.indexOf(header) === -1) { // 新类别，不包含此类
      // 添加类别 
      cataHeader.push(header)
      cataHeader.sort()
      // 将#类放置最后
      if (cataHeader[0] == '#') {
        cataHeader.push(cataHeader.shift())
      }
      // 添加数据
      cata[header] = []
      cata[header].push(insertData)
    } else { // 包含此类
      cata[header].push(insertData)
    }
    cata[header].sort((a, b) => {
      return a.nickPinyin.localeCompare(b.nickPinyin)
    })
    // 刷新视图
    this.setData({
      cataHeader: cataHeader,
      friendCata: cata
    })
  },
  /**
   * 从好友列表中删除好友并刷新
   */
  deleteFromFriendList(userCard) {
    // console.log('删除了', userCard)
    let cata = deepClone(this.data.friendCata)
    let cataHeader = [...this.data.cataHeader]
    let nickPinyin = getPinyin(userCard.nick, '').toUpperCase()
    let header = nickPinyin[0] //当前类别的头
    // 可能是数字头部
    if (this.testNum(header)) {
      header = '#'
    }
    let arr = cata[header] //当前类下的数据
    if (arr.length == 1) {//只有一项数据，连同类别全部删除
      delete cata[header]
      let index = cataHeader.indexOf(header)
      cataHeader.splice(index, 1)// 删除
    } else {// 不止一项
      arr.map((item, index) => {
        if (item.account == userCard.account) {
          arr.splice(index, 1)// 删除
          return
        }
      })
    }
    // 刷新视图
    this.setData({
      friendCata: cata,
      cataHeader: cataHeader
    })
  },
  /**
   * 单击消息通知 
   */
  switchToMessageNotification() {
    wx.navigateTo({
      url: '../../partials/messageNotification/messageNotification',
    })
  },
  /**
   * 单击黑名单
   */
  switchToBlacklistHandler() {
    wx.navigateTo({
      url: '../../partials/blacklist/blacklist',
    })
  },
  /**
   * 单击我的电脑
   */
  switchToChating() {
    let account = this.data.userInfo.account
    wx.navigateTo({
      url: '../../partials/chating/chating?chatTo=' + account,
    })
  }
}

let mapStateToData = (state) => {
  let obj = pageConfig.showFriendList(state.friendCard)
  return {
    friendCata: obj.friendCata,
    cataHeader: obj.cataHeader,
    friendCard: state.friendCard,
    userInfo: state.userInfo,
    onlineList: state.onlineList
  }
}
const mapDispatchToPage = (dispatch) => ({

})
let connectedPageConfig = connect(mapStateToData, mapDispatchToPage)(pageConfig)
Page(connectedPageConfig)