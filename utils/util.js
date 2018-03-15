var emojimap = require('./emojimap.js').default
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

function formatTime (date) {
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds()

  return [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

const KEY_LOGS = 'logs'

function clearLog () {
  wx.removeStorageSync(KEY_LOGS)
}

function pushLog (msg) {
  var logs = wx.getStorageSync(KEY_LOGS) || []
  logs.unshift({
    date: Date.now(),
    msg
  })
  wx.setStorageSync(KEY_LOGS, logs)
}

/**
 * 验证数据长度有效性
 */
function checkStringLength(str, max, min) {
  if (str && str.toString().length <= max && str.toString().length >= min) {
    return true
  } else {
    return false
  }
}

/**
 * 检测字符串类型
 * str: 传入待验证的字符串
 * type: 检测类型
 *       string-number : 仅限字母、数字
 *       string-number-hanzi : 仅限中文、字母、汉字
 */
function validStringType(str, type) {
  let result = null
  switch(type) {
    case 'string-number':
      result = /^[A-Za-z0-9]+$/.test(str)
      break
    case 'string-number-hanzi':
      result = /^[\u4E00-\u9FA5A-Za-z0-9]+$/.test(str)
      break
    case 'email': 
      result = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(str)
      break
    case 'phone':
      result = /^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$/.test(str)
      break
    default: 
      break
  }
  return result
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
  if (year == yesterday.getUTCFullYear() && month == yesterday.getUTCMonth() && day == yesterday.getDate()) {//昨天
    return `昨天 ${hour}:${minute < 10 ? '0' + minute : minute}`
  } else {
    return `${year}-${month + 1}-${day} ${hour}:${minute < 10 ? '0' + minute : minute}`
  }
}
/**
 * 播放网络音频
 */
function playNetAudio({ dur, mp3Url}) {
  const audioContext = wx.createInnerAudioContext()
  audioContext.src = mp3Url
  audioContext.play()
  audioContext.onPlay((res) => {
    // console.log(res)
  })
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
 * 生成富文本节点
 */
function generateRichTextNode(text) {
  let tempStr = text
  let richTextNode = []
  let leftBracketIndex = tempStr.indexOf('['),
    rightBracketIndex = 0
  if (leftBracketIndex == -1) {//没有emoji
    richTextNode.push({
      type: 'text',
      text: tempStr
    })
    return richTextNode
  }

  while (tempStr.length != 0) {
    if (leftBracketIndex != 0) {//最前面是文本
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
    } else {// 前面是[
      rightBracketIndex = tempStr.indexOf(']')
      let emojiName = tempStr.slice(0, rightBracketIndex + 1)
      if (emoji[emojiName]) {
        richTextNode.push({
          name: 'img',
          attrs: {
            width: '30rpx',
            height: '30rpx',
            src: emoji[emojiName].img
          }
        })
      }
      tempStr = tempStr.substring(rightBracketIndex + 1, tempStr.length)
    }
    leftBracketIndex = tempStr.indexOf('[')
  }
  return richTextNode
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
 * 深度克隆
 */
function deepClone(srcObj, out) {
  let outObj = out || {}
  for(let key in srcObj) {
    if(typeof srcObj[key] === 'object') {
      outObj[key] = (srcObj[key].constructor === Array) ? [] : {}
      deepClone(srcObj[key], outObj[key])
    } else {
      outObj[key] = srcObj[key]
    }
  }
  return outObj
}
/**
 * 判断自定义文件类型
 */
function judgeCustomMessageType(type, content) {
  let res = ''
  if (type === 'custom' && content['type'] === 1) {
    res = '猜拳'
  } else if (type === 'custom' && content['type'] === 2) {
    res = '阅后即焚'
  } else if (type === 'custom' && content['type'] === 3) {
    res = '贴图表情'
  } else if (type === 'custom' && content['type'] === 4) {
    res = '白板消息'
  } else {
    res = type
  }
  return res
}
/**
 * 单击用户头像，查询并跳转到指定页面
 * account: 账户, isPush: 新页面是跳转方式，true为压栈，false为重定向
 */
function clickLogoJumpToCard(account, isPush) {
  var app = getApp()
  let isFriend = true
  let friendsAccountArr = []
  app.globalData.friends.map(friend => {
    friendsAccountArr.push(friend.account)
  })
  if (friendsAccountArr.indexOf(account) !== -1) {
    if(isPush === true) {
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
          // console.log(err)
          return
        }
        if(isPush === true) {
          wx.navigateTo({
            url: '/partials/strangercard/strangercard?user=' + encodeURIComponent(JSON.stringify(user)),
          })
        } else {
          wx.redirectTo({
            url: '/partials/strangercard/strangercard?user=' + encodeURIComponent(JSON.stringify(user)),
          })
        }
        
      }
    })
  }
}
/** 
 * post 方法，接受params参数对象
 */
function post(params) {
  let url   = params.url,
    header  = params.header || {},
    data    = params.data;
  
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

module.exports = {
  formatDate,
  formatTime,
  pushLog,
  clearLog,
  post,
  checkStringLength,
  validStringType,
  sortStringArray,
  calcTimeHeader,
  generateFingerGuessImageFile,
  generateBigEmojiImageFile,
  generateRichTextNode,
  generateImageNode,
  deepClone,
  judgeCustomMessageType,
  clickLogoJumpToCard
}
