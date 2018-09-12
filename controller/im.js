import MD5 from '../vendors/md5.js'
// const NIM = require('../vendors/NIM_Web_NIM_v5.2.1.js')
import { NIM } from '../vendors/NIM_Web_SDK_v5.3.0.js'
// import NIM from '../vendors/NIM_Web_NIM_v4.4.1-beta.js'
import { updateMultiPortStatus, deepClone } from '../utils/util.js'

let app = getApp()
let store = app.store

let orderCounter = 1
// 第一次进去onConnect onBlacklist onMutelist onFriends onMyInfo onUsers onTeams SyncDone onPushEvents
// 重连 onWillConnect 
export default class IMController {
  constructor(headers) {
    app.globalData.nim = NIM.getInstance({
      // 初始化SDk
      // debug           : true,
      appKey: app.globalData.ENVIRONMENT_CONFIG.appkey,
      token: MD5(headers.token),
      account: headers.account,
      transports: ['websocket'],
      syncSessionUnread: true, // 同步未读数
      onconnect: this.onConnect,
      onwillreconnect: this.onWillReconnect,
      ondisconnect: this.onDisconnect,
      onerror: this.onError,
      // 同步完成
      onsyncdone: this.onSyncDone,
      // 用户关系
      onblacklist: this.onBlacklist,
      onsyncmarkinblacklist: this.onMarkInBlacklist,
      onmutelist: this.onMutelist,
      onsyncmarkinmutelist: this.onMarkInMutelist,
      // 好友关系
      onfriends: this.onFriends,
      onsyncfriendaction: this.onSyncFriendAction,
      // // 用户名片
      onmyinfo: this.onMyInfo,
      onupdatemyinfo: this.onUpdateMyInfo,
      onusers: this.onUsers,
      onupdateuser: this.onUpdateUser,
      // 机器人列表的回调
      onrobots: this.onRobots,
      // 群组
      onteams: this.onTeams,
      onsynccreateteam: this.onCreateTeam,
      onteammembers: this.onTeamMembers,
      // // onsyncteammembersdone: onSyncTeamMembersDone,
      onupdateteammember: this.onUpdateTeamMember,
      // 会话
      onsessions: this.onSessions,
      onupdatesession: this.onUpdateSession,
      // 消息
      onroamingmsgs: this.onRoamingMsgs,
      onofflinemsgs: this.onOfflineMsgs,
      onmsg: this.onMsg,
      // 系统通知
      onofflinesysmsgs: this.onOfflineSysMsgs,
      onsysmsg: this.onSysMsg,
      onupdatesysmsg: this.onUpdateSysMsg,
      onsysmsgunread: this.onSysMsgUnread,
      onupdatesysmsgunread: this.onUpdateSysMsgUnread,
      onofflinecustomsysmsgs: this.onOfflineCustomSysMsgs,
      oncustomsysmsg: this.onCustomSysMsg,
      // 收到广播消息
      onbroadcastmsg: this.onBroadcastMsg,
      onbroadcastmsgs: this.onBroadcastMsgs,
      // 事件订阅
      onpushevents: this.onPushEvents,
    })
    // 发送消息开始登陆
    store.dispatch({
      type: 'Login_StartLogin'
    })
  }
  /** 1
   * 连接成功
   */
  onConnect() {
    console.log(orderCounter++, ' onConnect: ')
  }
  /** 2或sync done之后触发
   * 设置订阅后，服务器消息事件回调
   */
  onPushEvents(param) {
    console.log(orderCounter++, ' onPushEvents: ', param)
    let msgEvents = param.msgEvents
    if (msgEvents) {
      let statusArr = []
      msgEvents.map((data) => {
        statusArr.push({
          status: updateMultiPortStatus(data),
          account: data.account
        })
      })
      // 更新好友全局状态
      store.dispatch({
        type: 'FriendCard_Update_Online_Status',
        payload: statusArr
      })
    }
  }
  /** 3
 * 收到黑名单列表
 */
  onBlacklist(blacklist) {
    console.log(orderCounter++, ' onBlacklist: ', blacklist)
    store.dispatch({
      type: 'Blacklist_Update_Initial',
      payload: blacklist
    })
  }
  /** 4
   * onMutelist
   */
  onMutelist(mutelist) {
    console.log(orderCounter++, ' onMutelist: ', mutelist)
  }
  /** 5
   * 同步好友信息，不含名片 [{account, createTime, updateTime}]
   */
  onFriends(friends) {
    console.log(orderCounter++, ' onFriends: ', friends)
  }
  /** 6
   * 个人名片：存储个人信息到全局数据
   */
  onMyInfo(user) {
    console.log(orderCounter++, ' onMyInfo: ')
    store.dispatch({
      type: 'IM_OnMyInfo', 
      payload: user
    })
  }
  /** 7
   * 包含名片的好友信息（可能某些字段不全），[{account,avatar,birth,createTime,email,gender,nick,sign,updateTime}]
   */
  onUsers(friends) {
    console.log(orderCounter++, ' onUsers: ', friends)
    store.dispatch({
      type: 'FriendCard_Update_Initial',
      payload: friends
    })
  }
  /** 8 同步群列表
   * onTeams 
   */
  onTeams(teams) {
    /**
     * [
     *  {avatar:"",beInviteMode:"needVerify",createTime:1472116310831,inviteMode:"manager",joinMode:"needVerify",level:200,memberNum:3,memberUpdateTime:1472528441186,mute:false,name:"高级群",owner:"15968166810",teamId:"7809054",type:"advanced",updateCustomMode:"manager",updateTeamMode:"manager",updateTime:1472528441204,valid:true,validToCurrentUser:true}
     * ]
     */
    console.log(orderCounter++, ' onTeams')
    console.log(teams)
  }
  /** 9
   * onSyncDone,同步完成
   */
  onSyncDone() {
    console.log(orderCounter++, ' Sync Done')
    store.dispatch({
      type: 'Login_LoginSuccess'
    })
    wx.switchTab({
      url: '/pages/recentchat/recentchat',
    })
  }
  /**
 * 会话更新：收到消息、发送消息、设置当前会话、重置会话未读数 触发
 * {id:'p2p-zys2',lastMsg:{},scene,to,unread,updateTime}
 */
  onUpdateSession(session) {
    console.log('onUpdateSession: ', session)
    store.dispatch({
      type: 'UnreadInfo_update',
      payload: session
    })
  }
  /**
   * 收到消息
   * {cc,flow:"in",from,fromClientType:"Web",fromDeviceId,fromNick,idClient,idServer:"9680840912",isHistoryable:true,isLocal,isMuted, isOfflinable,isPushable,isRoamingable,isSyncable,isUnreadable,needPushNick,resend,scene:"p2p",sessionId:"p2p-zys2",status:"success",target:"zys2",text:"[呕吐]",time,to:"wujie",type:"text",userUpdateTime}
   */
  onMsg(msg) {
    console.log('onMsg: 收到消息', msg)
    store.dispatch({
      type: 'RawMessageList_Add_Msg',
      payload: msg
    })
  }
  /** 操作主体为对方
   * 收到系统通知，例如 被对方删除好友、被对方添加好友、被对方撤回消息
   * {type,to,time,deletedMsgTime,deletedMsgFromNick,deletedIdServer,deletedIdClient,status,scene,opeAccount,msg:{flow,from,fromNick,idClient,scene,sessionId,target,time,to,opeAccount},idServer,from}
   * time:为删除消息时间，deletedMsgTime为删除的消息发送时间
   */
  onSysMsg(msg) {
    console.log('onSysMsg: ', msg)
    let account = msg.from
    
    if (msg.type === 'deleteMsg') {
      store.dispatch({
        type: 'RawMessageList_OppositeRecall_Msg',
        payload: msg
      })
    } else if (msg.type === 'addFriend') { //第三方将自己加到好友列表
      app.globalData.nim.getUser({
        account: account,
        done: function (err, user) {
          if (err) {
            console.log('onSysMsg: getUser: ', err)
            return
          }
          store.dispatch({
            type: 'Notification_Opposite_AddFriend',
            payload: {
              msg,
              desc: `添加好友-${msg.from}添加你为好友`
            }
          })
          store.dispatch({
            type: 'FriendCard_Add_Friend',
            payload: user
          })
        }
      })
    } else if (msg.type === 'deleteFriend') {
      store.dispatch({
        type: 'Notification_Opposite_DeleteFriend',
        payload: {
          msg,
          desc: `删除好友-${msg.from}已将你从他的好友列表中移除`
        }
      })
      store.dispatch({
        type: 'FriendCard_Delete_By_Account',
        payload: account
      })
    }
  }
  /**
   * 丢失连接
   */
  onDisconnect(error) {
    console.log(orderCounter++, ' onDisconnect: ')
    console.log(error)
    if (error) {
      switch (error.code) {
        // 账号或者密码错误, 请跳转到登录页面并提示错误
        case 302:
          console.log('onError: 账号或者密码错误')
          break;
        // 重复登录, 已经在其它端登录了, 请跳转到登录页面并提示错误
        case 417:
          console.log('onError: 重复登录')
          break;
        // 被踢, 请提示错误后跳转到登录页面
        case 'kicked':
          wx.showModal({
            title: '用户下线',
            showCancel: false,
            content: '在其他客户端登录，导致被踢',
            confirmText: '重新登录',
            success: (res) => {
              if (res.confirm) { //点击确定
                wx.redirectTo({
                  url: '/pages/login/login',
                })
              }
            }
          })
          break;
        default:
          break;
      }
    }
  }
  /**
   * 漫游消息：会多次收到，每次只会收到指定人的漫游消息
    // {scene:"p2p",sessionId:"p2p-cs4",timetag:1513153729257,to:"cs4",msg:[{from:'wujie',text:'222',to:'cs4'}]}
    // {scene:"team",sessionId:"team-3944051",timetag:1513153729257,to:"3944051",msg:[{from:'wujie',text:'222',to:'cs4'}]}
   */
  onRoamingMsgs(list) {
    console.log(orderCounter++, ' 漫游消息')
    console.log(list)
    store.dispatch({
      type: 'RawMessageList_Add_RoamingMsgList',
      payload: list
    })
  }
  /**
   * 连接出错
   */
  onError(error) {
    console.log(' onError', error)
    app.globalData.nim.disconnect()
    app.globalData.nim.connect()
  }



  onMarkInBlacklist(obj) {
    console.log(orderCounter++, ' onMarkInBlacklist: ')
    console.log(obj)
  }

  onMarkInMutelist(obj) {
    console.log(orderCounter++, ' onMarkInMutelist: ')
    console.log(obj)
  }

  onSyncFriendAction(obj) {
    console.log(orderCounter++, ' onSyncFriendAction')
    console.log(obj)
  }

  onUpdateMyInfo(user) {
    console.log(orderCounter++, ' onUpdateMyInfo')
    console.log(user)
  }

  onUpdateUser(user) {
    console.log(orderCounter++, ' onUpdateUser')
    console.log(user)
  }

  onCreateTeam(team) {
    console.log(orderCounter++, ' onCreateTeam')
    console.log(team)
  }
  onTeamMembers(teamId, members) {
    console.log(orderCounter++, ' onTeamMembers')
    console.log(teamId, members)
  }
  onUpdateTeamMember(teamMember) {
    console.log(orderCounter++, ' onUpdateTeamMember')
    console.log(teamMember)
  }
  /**会话
   * [ {id:"p2p-liuxuanlin",lastMsg:{from:'wujie',text:'222',to:"liuxuanlin"}} ]
   */
  onSessions(sessions) {
    console.log('onSessions: ', sessions)
  }
  onOfflineMsgs(obj) {
    console.log(orderCounter++, ' onOfflineMsgs')
    console.log(obj)
  }
  // 系统通知
  onOfflineSysMsgs() {
    console.log(orderCounter++, ' onOfflineSysMsgs')
    console.log()
  }
  onUpdateSysMsg(sysMsg) {
    console.log(orderCounter++, ' onUpdateSysMsg')
    console.log(sysMsg)
  }
  onSysMsgUnread(obj) {
    console.log(orderCounter++, ' onSysMsgUnread')
    console.log(obj)
  }
  onUpdateSysMsgUnread(obj) {
    console.log(orderCounter++, ' onUpdateSysMsgUnread')
    console.log(obj)
  }
  onOfflineCustomSysMsgs(sysMsg) {
    console.log(orderCounter++, ' onOfflineCustomSysMsgs')
    console.log(sysMsg)
  }
  onCustomSysMsg(sysMsg) {
    console.log(orderCounter++, ' onCustomSysMsg')
    console.log(sysMsg)
  }
  // 收到广播消息
  onBroadcastMsg(msg) {
    console.log('onBroadcastMsg: ', msg)
  }
  onBroadcastMsgs(msg) {
    console.log('onBroadcastMsgs: ', msg)
  }
  /**
   * 断开重连
   */
  onWillReconnect() {
    console.log(' onWillReconnect')
  }
}

// 初始化的时候回返回一条数据，里面还有所有的未读数，未读数初始化状态不对，后面收到新的后就正确了
// 好友被删除后，再次推送过来的消息如有此人消息会报错，原因recentChat页是获取数据时是从好友列表中拿的