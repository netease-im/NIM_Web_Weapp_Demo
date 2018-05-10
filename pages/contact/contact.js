import { sortStringArray, deepClone } from '../../utils/util.js'
import { getPinyin } from '../../utils/pinyin.js'
import { iconMyComputer, iconRightArrow } from '../../utils/imageBase64.js'

/**
 * todo：
 * 登录状态消息更新未做，现有逻辑是初始化时获取状态信息，然后设置全局对象（一旦未能在切换前拿到数据那么全部就是出于离线状态），切到通信录页时获取数据渲染，后面考虑采用消息订阅模式完成状态信息同步
 */
var app = getApp()
Page({
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let self = this
    self.setData({
      iconMyComputer,
      iconRightArrow
    })
    
    wx.setNavigationBarTitle({
      title: '通信录',
    })
    // 拉黑好友
    app.globalData.subscriber.on('MARK_FRIEND_CONTACT', function ({account}) {
      // console.log('拉黑好友', account)
      let friendCata = deepClone(self.data.friendCata)
      let cataHeader = [...self.data.cataHeader]
      let firstLetter = self.data.accountMapNick[account][0]
      let key = ''
      let cata = null
      if(self.testNum(firstLetter)) { // 数字
        key = '#'
      } else { // 字母
        key = firstLetter
      }
      cata = friendCata[key]
      let blackNum = 0
      cata.map(item => {
        if (item.isBlack === true) {
          blackNum++
        }
        if (item.account === account) {
          item['isBlack'] = true
          blackNum++
        }
      })
      // 一类中全部拉黑，隐藏头部
      if (cata.length === blackNum) {
        cataHeader.splice(cataHeader.indexOf(firstLetter), 1)
      }
      self.setData({
        cataHeader,
        friendCata
      })
      // console.log(self.data.accountMapNick[account])
    })
    // 取消拉黑好友
    app.globalData.subscriber.on('UNMARK_FRIEND_CONTACT', function ({account}) {
      // console.log('取消拉黑好友', account)
      let friendCata = deepClone(self.data.friendCata)
      let cataHeader = [...self.data.cataHeader]
      let firstLetter = self.data.accountMapNick[account][0]
      let key = ''
      let cata = null
      if (self.testNum(firstLetter)) { // 数字
        key = '#'
      } else { // 字母
        key = firstLetter
      }
      cata = friendCata[key]
      if(cataHeader.indexOf(key) == -1) {//这一类全部是黑名单
        cataHeader.push(key)
        cataHeader = self.sortCataHeader(cataHeader)
      }
      cata.map(item => {
        if (item.account === account) {
          item.isBlack = false
        }
      })
      self.setData({
        cataHeader,
        friendCata
      })
      // console.log(self.data.accountMapNick[account])
    })
    // 监听好友状态列表
    app.globalData.subscriber.on('FRIEND_STATUS_UPDATE', function () {
      // console.log(app.globalData.onlineList)
      self.refreshFriendStatus()
    })
    // 监听添加好友信号
    app.globalData.subscriber.on('ADD_NEW_FRIEND', function (userCard) {
      self.addToFriendList(userCard)
    })
    // 监听删除好友信号
    app.globalData.subscriber.on('DELETE_OLD_FRIEND', function (userCard) {
      self.deleteFromFriendList(userCard)
    })
  },
  /**
   * 检查是否加载成功数据
   */
  onShow() {
    if (app.globalData.friends.length == 0) {
      wx.showToast({
        title: '你还没有任何好友',
        duration: 1500,
        icon: 'none'
      })
      return
    }
    if (Object.keys(app.globalData.friendsCard).length == 0) {
      let accounts = app.globalData.friends.map(item => item.account)
      wx.showLoading({
        title: '同步好友列表',
        mask: true
      })
      // 查询好友名片信息
      app.globalData.nim.getUsers({
        accounts,
        done: this.friendsCardSyncDone
      })
    }
  },
  /**
   * 好友名片信息同步完成
   */
  friendsCardSyncDone(err, friendCards) {
    let self = this
    if(err) {
      console.log(err)
      return
    }

    // 存储account映射nickPinyin，方便依据account查找friendCata
    let accountMapNick = {}

    let orderedFriendsCard = [] // 渲染列表常用数据，[{nick: 'test', account: 'nihwo', avatar: 'path', isBlack}]
    // 查看是否有用户上线
    let flagOfOnlineList = Object.keys(app.globalData.onlineList).length != 0
    // 黑名单账户
    let blackAccounts = Object.keys(app.globalData.blackList)
    // 存储全局以及选出需要展示的字段
    friendCards.map(friendCard => { 
      //存到全局对象
      app.globalData.friendsCard[friendCard.account] = deepClone(friendCard)

      // 隐藏黑名单条目
      let isBlack = false
      blackAccounts.map(account => {
        if(account === friendCard.account) {
          isBlack = true
        }
      })

      let nickPinyin = getPinyin(friendCard.nick, '').toUpperCase()
      let specifidCard = {
        'avatar': friendCard.avatar || this.data.defaultUserLogo,
        'account': friendCard.account,
        'nick': friendCard.nick,
        'nickPinyin': nickPinyin,
        isBlack
      }
      // 存储account映射nickPinyin，方便依据account查找friendCata
      accountMapNick[friendCard.account] = nickPinyin 

      if (flagOfOnlineList) {// 有数据
      // 如果app.globalData.onlineList中数据还没同步过来，后期消息订阅再调整
        specifidCard['status'] = app.globalData.onlineList[friendCard.account] || '离线'
      } else {
        specifidCard['status'] = '离线'
      }
      //刷新视图对象
      orderedFriendsCard.push(specifidCard)
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

    // 判断是否显示头部类别
    let blackCata = {} // 统计黑名单首字母次数
    blackAccounts.map(account => {
      // 非好友情况下拉黑，
      if(!accountMapNick[account]) {
        return
      }
      let firstLetter = accountMapNick[account][0]
      let key = ''
      if (this.testNum(firstLetter)) {// 数字
        key = '#'
      } else { // 字母
        key = firstLetter
      }
      if (!blackCata[key]) {
        blackCata[key] = 1
      } else {
        blackCata[key]++
      }
    })
    
    for(let key in blackCata) {
      let val = blackCata[key]
      let cata = result[key]
      if(cata.length == val) {
        tempKeys.splice(tempKeys.indexOf(key), 1)
      }
    }

    // 刷新视图
    this.setData({
      friendCata: result,
      cataHeader: tempKeys,
      accountMapNick
    })
    wx.hideLoading()
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
    if(arr[0] === '#') {
      arr.push(arr.shift())
    }
    return arr
  },
  /**
   * 深度克隆friendCata
   */
  deepClone(data) {
    let des = {}
    for (let cataKey in data) {
      let desArr = data[cataKey]

      des[cataKey] = []
      desArr.map(item => {
        let temp = {}
        for (let key in item) {
          temp[key] = item[key]
        }
        des[cataKey].push(temp)
      })
    }
    return des
  },
  /**
   * 调整好友登录状态
   */
  refreshFriendStatus() {
    let onlineList = app.globalData.onlineList
    // console.log(app.globalData.onlineList)
    let friendCata = this.data.friendCata
    if (Object.keys(friendCata).length == 0) {
      // 收到推送的状态消息早于好友列表消息，忽略此次更新，好友列表更新时会自动获取状态
    } else {
      // 深拷贝：目的是减少dom更新此时，批量更新状态
      let cata = deepClone(friendCata)
      // let cata = this.deepClone(friendCata)

      // 检测哪个用户的状态变化了
      for (let account in onlineList) {
        let nickPinyin = this.data.accountMapNick[account]
        if(!nickPinyin) return //有时候不是好友也会推送在线消息过来，导致undefined
        let cataArr = cata[nickPinyin[0]] || cata['#']
        cataArr.map((item, index) => {
          if (item.account == account) {
            cataArr[index].status = onlineList[account]
            return
          }
        })
      }
      // 更新视图
      this.setData({
        friendCata: cata
      })
    }
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

    // let index = this.data.cataHeader.indexOf(nickPinyin[0])
    // if (nickPinyin[0] == '#' && index != -1) { //#类。处于已有类别中
    //   arr = cata['#']
    // }
    // if (nickPinyin[0] != '#' && index != -1 ) { // 非#类，处于已有类别中
    //   header = Object.keys(cata)[index + 1] //#处于cataHeader的最后一个，处于cata最前面，因此索引+1
    //   arr = cata[header]
    // } 
    // if(index == -1) { // 新类别，
    //   // 处理类别 
    //   cataHeader.push(nickPinyin[0])
    //   cataHeader.sort()
    //   // 将#类放置最后
    //   if (cataHeader[0] == '#') {
    //     cataHeader.push(cataHeader.shift())
    //   }
    //   // 处理数据
    //   cata[nickPinyin[0]] = []
    //   arr = cata[nickPinyin[0]]
    // }

    // // 插入数据
    // arr.push({
    //   account: userCard.account,
    //   nick: userCard.nick,
    //   avatar: userCard.avatar || this.data.defaultUserLogo,
    //   status: '离线',  //假设离线，后期收到数据后更新
    //   nickPinyin: nickPinyin
    // })
    // arr.sort((a, b) => {
    //   return a.nickPinyin.localeCompare(b.nickPinyin)
    // })
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
    // let cata = this.deepClone(this.data.friendCata)
    let cataHeader = [...this.data.cataHeader]
    let nickPinyin = getPinyin(userCard.nick, '').toUpperCase()
    let header = nickPinyin[0] //当前类别的头
    // 可能是数字头部
    if (this.testNum(header)) { 
      header = '#'
    }
    let arr = cata[header] //当前类下的数据
    if(arr.length == 1) {//只有一项数据，连同类别全部删除
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
   * 单击用户条目
   */
  friendItemClick(e) {
    let account = e.currentTarget.dataset.account
    wx.navigateTo({
      url: '../../partials/personcard/personcard?account=' + account,
    })
  },
  /**
   * 单击消息通知 
   */
  switchToMessageNotification() {
    wx.navigateTo({
      url: '../../partials/messagenotification/messagenotification',
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
    let account = app.globalData['loginUser']['account']
    wx.navigateTo({
      url: '../../partials/chating/chating?chatTo=' + account,
    })
  }
})
/** 拉去好友列表 ->  好友信息数组 -> 生成指定对象（friendCata） -> 排序 -> 提取首字母数组（cataHeader） -> 刷新视图（cataHeader控制类别顺序，friendCata获取数据） */