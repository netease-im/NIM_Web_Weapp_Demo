import { iconNoMessage } from '../../utils/imageBase64.js'
import { deepClone } from '../../utils/util.js'
var app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 0,//当前索引
    windowMaxHeight: 0,//通知窗口高度
    sysNotificationList: [], // 系统通知[{category,from,time,to,type}]
    cusNotificationList: [] // 自定义通知，[{category,from,time,to,type}]
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let self = this
    // 获取窗口高度，设置底部滑动容器
    wx.getSystemInfo({
      success: function(res) {
        self.setData({
          windowMaxHeight: res.windowHeight - 120
        })
      },
    })
    wx.setNavigationBarTitle({
      title: '消息通知',
    })
    // 渲染历史数据
    let notificationList = app.globalData.notificationList
    let cusNotificationList = []
    let sysNotificationList = []
    notificationList.map(message => {
      if(message.type == 'custom') { // 自定义通知
        // JSON.parse某些字符串时会报错
        if (message.content.includes('content')) {
          message.content = JSON.parse(message.content)['content']
        }
        // message.content = JSON.parse(message.content)['content'] || message.content // 可能没有content属性
        cusNotificationList.push(deepClone(message))
      } else { // 系统通知
        sysNotificationList.push(deepClone(message))
      }
    })
    this.setData({
      sysNotificationList,
      cusNotificationList,
      iconNoMessage
    })
    // 监听消息数据
  },
  /**
   * nav点击
   */
  switchNav(e) {
    if (this.data.currentTab == e.currentTarget.dataset.current) {
      return
    } else {
      this.setData({
        currentTab: e.currentTarget.dataset.current
      })
    }
  },
  sysClear() {
    this.clearNotification('sys')
  },
  cusClear() {
    this.clearNotification('cus')
  },
  /**
   * 清除通知消息公用方法
   */
  clearNotification(cata) {
    let self = this
    wx.showActionSheet({
      itemList: ['确认'],
      itemColor: '#f00',
      success: function (res) {
        if (res.tapIndex === 0) {
          if (cata == 'cus') {
            self.setData({
              cusNotificationList: []
            })
            // 删除自定义通知
            let notificationList = [...app.globalData.notificationList]
            let resultList = []
            notificationList.map(message => {
              if (message.type != 'custom') {
                resultList.push(deepClone(message))
              }
            })
            app.globalData.notificationList = resultList
          } else if (cata == 'sys') {
            self.setData({
              sysNotificationList: []
            })
            // 删除系统通知
            let notificationList = [...app.globalData.notificationList]
            let resultList = []
            notificationList.map(message => {
              if (message.type == 'custom') {
                resultList.push(deepClone(message))
              }
            })
            app.globalData.notificationList = resultList
          }
          // 发送清空消息通知
          app.globalData.subscriber.emit('DELETE_All_NOTIFICATION')
        }
      },
      fail: function (res) {

      }
    })
  },
  /**
   * 清除系统条目
   */
  deleteSysItem(e) {
    let notification = e.currentTarget.dataset.data
    let self = this
    // 删除本地记录
    let list = [...self.data.cusNotificationList]
    let deleteIndex = self.getDeleteIndexInList(list, notification)
    list.splice(deleteIndex, 1)
    this.setData({
      cusNotificationList: list
    })
    // 删除全局中记录
    let notificationList = app.globalData.notificationList
    let globalIndex = self.getDeleteIndexInList(notificationList, notification)
    app.globalData.notificationList.splice(globalIndex, 1)
    // 发送通知
    app.globalData.subscriber.emit('DELETE_All_NOTIFICATION')
    // app.globalData.subscriber.emit('DELETE_SINGLE_NOTIFICATION', deleteItem)
  },
  /**
   * 删除自定义条目
   */
  deleteCusItem(e) {
    let notification = e.currentTarget.dataset.data
    this.deleteItem('cus', notification)
  },
  /**
   * 获取swipe-delete传递过来的单击事件
   */
  deleteSysItem(e) {
    let notification = e.currentTarget.dataset.data
    this.deleteItem('sys', notification)
  },
  /**
   * 删除item公用方法
   */
  deleteItem(cata, notification) {
    let self = this
    // 删除本地记录
    let list = []
    if(cata == 'sys') {
      list = [...self.data.sysNotificationList]
    } else if(cata == 'cus'){
      list = [...self.data.cusNotificationList]
    }
    let deleteIndex = self.getDeleteIndexInList(list, notification)
    list.splice(deleteIndex, 1)
    if (cata == 'sys') {
      this.setData({
        sysNotificationList: list
      })
    } else if (cata == 'cus') {
      this.setData({
        cusNotificationList: list
      })
    }
    // 删除全局中记录
    let notificationList = app.globalData.notificationList
    let globalIndex = self.getDeleteIndexInList(notificationList, notification)
    app.globalData.notificationList.splice(globalIndex, 1)
    // 发送通知
    app.globalData.subscriber.emit('DELETE_All_NOTIFICATION')
    // app.globalData.subscriber.emit('DELETE_SINGLE_NOTIFICATION', deleteItem)
  },
  /**
   * 依据list查找待删除index
   */
  getDeleteIndexInList(list, notification) {
    list.map((item, index) => {
      if (item.from === notification.from && item.type === notification.type) {
        return index
      }
    })
  }
})