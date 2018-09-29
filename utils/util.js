import PAGE_CONFIG from '../config/pageConfig.js'
import emojimap from './emojimap.js'
var emoji = emojimap.emojiList.emoji

function formatDate(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatTime(date) {
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 验证数据长度有效性
 */
function checkStringLength(str, max, min) {
  if (str && str.toString().length <= max && stfr.toString().length >= min) {
    return true
  } else {
    return false
  }
}
/**
 * 首字母大写
 */
function firstLetterUpper(str) {
  let temp = ''.concat(String.fromCodePoint(str[0].toLowerCase().charCodeAt() - 32), str.substr(1))
  console.log(temp)
  return temp
}

/**
 * 检测字符串类型
 * str: 传入待验证的字符串
 * type: 检测类型
 *       string-number : 仅限字母、数字
 *       string-number-hanzi : 仅限中文、字母、汉字
 */
function validStringType(str, type) {
  switch (type) {
    case 'string-number':
      return /^[A-Za-z0-9]+$/.test(str)
    case 'string-number-hanzi':
      return /^[\u4E00-\u9FA5A-Za-z0-9]+$/.test(str)
    case 'email':
      return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(str)
    case 'phone':
      return /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/.test(str)
    default:
      break
  }
}
/**
 * 字符串数组排序：包含中文字符
 */
function sortStringArray(srcArr) {
  return srcArr.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { sensitivity: 'base' }))
}
/**
 * 输入Unix时间戳，返回指定时间格式
 */
function calcTimeHeader(time) {
  // 格式化传入时间
  let date = new Date(parseInt(time)),
    year = date.getUTCFullYear(),
    month = date.getUTCMonth(),
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getUTCMinutes()
  // 获取当前时间
  let currentDate = new Date(),
    currentYear = date.getUTCFullYear(),
    currentMonth = date.getUTCMonth(),
    currentDay = currentDate.getDate()
  // 计算是否是同一天
  if (currentYear == year && currentMonth == month && currentDay == day) {//同一天直接返回
    if (hour > 12) {
      return `下午 ${hour}:${minute < 10 ? '0' + minute : minute}`
    } else {
      return `上午 ${hour}:${minute < 10 ? '0' + minute : minute}`
    }
  }
  // 计算是否是昨天
  let yesterday = new Date(currentDate - 24 * 3600 * 1000)
  if (year == yesterday.getUTCFullYear() && month == yesterday.getUTCMonth && day == yesterday.getDate()) {//昨天
    return `昨天 ${hour}:${minute < 10 ? '0' + minute : minute}`
  } else {
    return `${year}-${month + 1}-${day} ${hour}:${minute < 10 ? '0' + minute : minute}`
  }
}
/** 
 * post 方法，接受params参数对象
 */
function post(params) {
  let url = params.url,
    header = params.header || {},
    data = params.data;

  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      data: data,
      header: header,
      method: 'POST',
      success: function (data, statusCode, header) {
        resolve({ data, statusCode, header })
      },
      fail: function () {
        reject('请求失败，请重试！')
      }
    })
  })
}
/**
 * 封装toast
 */
function showToast (type, text, obj) {
  let param = { duration: (obj && obj.duration) || 1500, mask: (obj && obj.isMask) || false }
  switch(type) {
    case 'text': {
      param['title'] = text || ''
      param['icon'] = 'none'
      break
    }
    case 'loading': {
      param['title'] = text || ''
      param['icon'] = 'loading'
      break
    } 
    case 'success': {
      param['title'] = text || ''
      param['icon'] = 'success'
      break
    }
    case 'error': {
      param['title'] = text || ''
      param['image'] = '/images/emoji.png'
      break
    }
    default: {
      break
    }
  }
  wx.showToast(param)
}

/**
   * 深度克隆friendCata
   */
function deepClone(data) {
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
}
/**
 * 计算在线 状态
 * [account,clientType,custom:{1:{net_state:1,online_state:0}},idClient,idServer,serverConfig,time,type,value]
 */
function updateMultiPortStatus(data) {
  if (data.account) {
    let account = data.account
    let multiPortStatus = ''
    function getMultiPortStatus(customType, custom) {
      // 服务器下推多端事件标记的特定序号对应值
      var netState = {
        0: '',
        1: 'Wifi',
        2: 'WWAN',
        3: '2G',
        4: '3G',
        5: '4G'
      }
      var onlineState = {
        0: '在线',
        1: '忙碌',
        2: '离开'
      }

      var custom = custom || {}
      if (customType !== 0) {
        // 有serverConfig.online属性，已被赋值端名称
        custom = custom[customType]
      } else if (custom[4]) {
        custom = custom[4]
        multiPortStatus = '电脑'
      } else if (custom[2]) {
        custom = custom[2]
        multiPortStatus = 'iOS'
      } else if (custom[1]) {
        custom = custom[1]
        multiPortStatus = 'Android'
      } else if (custom[16]) {
        custom = custom[16]
        multiPortStatus = 'Web'
      } else if (custom[64]) {
        custom = custom[64]
        multiPortStatus = 'Mac'
      }
      if (custom) {
        custom = JSON.parse(custom)
        if (typeof custom['net_state'] === 'number') {
          var tempNetState = netState[custom['net_state']]
          if (tempNetState) {
            multiPortStatus += ('[' + tempNetState + ']')
          }
        }
        if (typeof custom['online_state'] === 'number') {
          multiPortStatus += onlineState[custom['online_state']]
        } else {
          multiPortStatus += '在线'
        }
      }
      return multiPortStatus
    }
    // demo自定义多端登录同步事件
    if (+data.type === 1) {
      if (+data.value === 1 || +data.value === 2 || +data.value === 3 || +data.value === 10001) {
        var serverConfig = JSON.parse(data.serverConfig)
        var customType = 0
        multiPortStatus = ''
        // 优先判断serverConfig字段
        if (serverConfig.online) {
          if (serverConfig.online.indexOf(4) >= 0) {
            multiPortStatus = '电脑'
            customType = 4
          } else if (serverConfig.online.indexOf(2) >= 0) {
            multiPortStatus = 'iOS'
            customType = 2
          } else if (serverConfig.online.indexOf(1) >= 0) {
            multiPortStatus = 'Android'
            customType = 1
          } else if (serverConfig.online.indexOf(16) >= 0) {
            multiPortStatus = 'Web'
            customType = 16
          } else if (serverConfig.online.indexOf(64) >= 0) {
            multiPortStatus = 'Mac'
            customType = 64
          }
        }
        if (data.custom && (Object.keys(data.custom).length > 0)) {
          var portStatus = getMultiPortStatus(customType, data.custom)
          // 如果serverConfig里有属性而custom里没有对应属性值
          if ((multiPortStatus !== '') && (portStatus === '')) {
            multiPortStatus += '在线'
          } else {
            multiPortStatus = portStatus
            // multiPortStatus += portStatus
          }
        } else if (customType !== 0) {
          multiPortStatus += '在线'
        } else {
          multiPortStatus = '离线'
        }
        return multiPortStatus
      }
    }
  }
  return '离线'
}
/** 
 * 校验并补全字段
 */
function correctData (obj) {
  let temp = {}
  temp['account'] = obj['account']
  temp['nick'] = obj['nick']
  temp['avatar'] = obj['avatar'] || PAGE_CONFIG.defaultUserLogo
  temp['gender'] = obj['gender'] || '未设置'
  temp['birth'] = obj['birth'] || '未设置'
  temp['tel'] = obj['tel'] || '未设置'
  temp['email'] = obj['email'] || '未设置'
  temp['sign'] = obj['sign'] || '未设置'
  obj['remark'] = '未设置'
  return temp
}
/**
 * 生成富文本节点
 */
function generateRichTextNode(text) {
  let tempStr = text
  let richTextNode = []
  let leftBracketIndex = tempStr.indexOf('[')
  let rightBracketIndex = tempStr.indexOf(']')
  let countOfWord = 0
  Array.from(tempStr).map(item => {
    if (item != '[' && item != ']') {
      countOfWord++
    }
  })
  if (leftBracketIndex == -1 || rightBracketIndex == -1 || countOfWord == 0) {//没有emoji
    richTextNode.push({
      type: 'text',
      text: tempStr
    })
    return richTextNode
  }
  while (tempStr.length != 0) {
    leftBracketIndex = tempStr.indexOf('[')
    rightBracketIndex = tempStr.indexOf(']')
    if (leftBracketIndex == 0) { // 开头是[
      rightBracketIndex = tempStr.indexOf(']')
      if (rightBracketIndex == -1) {
        richTextNode.push({
          type: 'text',
          text: tempStr
        })
        tempStr = ''
      } else {
        let emojiName = tempStr.slice(0, rightBracketIndex + 1)
        if (emoji[emojiName]) { // 有效emoji
          richTextNode.push({
            name: 'img',
            attrs: {
              width: '30rpx',
              height: '30rpx',
              src: emoji[emojiName].img
            }
          })
        } else {//无效emoji
          richTextNode.push({
            type: 'text',
            text: emojiName
          })
        }
        tempStr = tempStr.substring(rightBracketIndex + 1, tempStr.length)
      }
    } else { // 开头不是[
      if (leftBracketIndex == -1) {// 最后全是文字
        richTextNode.push({
          type: 'text',
          text: tempStr.slice(0, tempStr.length)
        })
        tempStr = ''
      } else {
        richTextNode.push({
          type: 'text',
          text: tempStr.slice(0, leftBracketIndex)
        })
        tempStr = tempStr.substring(leftBracketIndex, tempStr.length + 1)
      }
    }
  }
  return richTextNode
}
/**
 * 输出猜拳图片对象，用于生成富文本图片节点
 */
function generateFingerGuessImageFile(value) {
  let file = { w: 50, h: 50, url: '' }
  switch (value) {
    case 1:
      file.url = 'http://yx-web.nos.netease.com/webdoc/h5/im/play-1.png'
      break
    case 2:
      file.url = 'http://yx-web.nos.netease.com/webdoc/h5/im/play-2.png'
      break
    case 3:
      file.url = 'http://yx-web.nos.netease.com/webdoc/h5/im/play-3.png'
      break
    default:
      break
  }
  return file
}
/**
   * 输出贴图表情对象，用于生成富文本图片节点
   * content:"{"type":3,"data":{"catalog":"ajmd","chartlet":"ajmd010"}}"
   */
function generateBigEmojiImageFile(content) {
  let prefix = 'http://yx-web.nosdn.127.net/webdoc/h5/emoji/'
  let file = { w: 100, h: 100, url: '' }
  file.url = `${prefix}${content.data.catalog}/${content.data.chartlet}.png`
  return file
}
/**
 * 处理图片富文本节点
 */
function generateImageNode(file) {
  // console.log(file)
  let width = 0, height = 0
  if (file.w > 250) {
    width = 200
    height = file.h / (file.w / 200)
  } else {
    width = file.w
    height = file.h
  }
  let richTextNode = []
  richTextNode.push({
    name: 'img',
    attrs: {
      width: `${width}rpx`,
      height: `${height}rpx`,
      src: file.url
    }
  })
  return richTextNode
}
/**
 * 单击用户头像，查询并跳转到指定页面
 * account: 账户, isPush: 新页面是跳转方式，true为压栈，false为重定向
 */
function clickLogoJumpToCard(account, isPush) {
  let app = getApp()
  let isFriend = true
  let friendsAccountArr = []
  app.globalData.friends.map(friend => {
    friendsAccountArr.push(friend.account)
  })
  if (friendsAccountArr.indexOf(account) !== -1) {
    if (isPush === true) {
      wx.navigateTo({
        url: '/partials/personcard/personcard?account=' + account,
      })
    } else {
      wx.redirectTo({
        url: '/partials/personcard/personcard?account=' + account,
      })
    }

  } else {
    app.globalData.nim.getUser({
      account: account,
      done: function (err, user) {
        if (err) {
          console.log(err)
          return
        }
        if (isPush === true) {
          wx.navigateTo({
            url: '/partials/strangercard/strangercard?account=' + user.account,
          })
        } else {
          wx.redirectTo({
            url: '/partials/strangercard/strangercard?account=' + user.account,
          })
        }

      }
    })
  }
}
module.exports = {
  formatDate,
  formatTime,
  post,
  firstLetterUpper,
  checkStringLength,
  validStringType,
  sortStringArray,
  calcTimeHeader,
  showToast,
  updateMultiPortStatus,
  correctData,
  deepClone,
  clickLogoJumpToCard,
  generateRichTextNode,
  generateFingerGuessImageFile,
  generateBigEmojiImageFile,
  generateImageNode
}
