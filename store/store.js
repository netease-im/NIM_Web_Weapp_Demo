const INITIAL_STATE = {
  isLogin: false, // 是否正在登陆
  isRegister: false, // 是否正在注册
  userInfo: {}, // 登录用户信息
  currentChatTo: '', // 正在聊天account
  friendCard: {}, //好友列表，含名片信息，额外添加在线信息
  onlineList: {}, // 在线好友列表
  // messageListToRender: {}, 
  unreadInfo: {}, // 未读信息，包含已、未订阅的账户数
  rawMessageList: {}, // 所有的聊天列表都在里面
  notificationList: { system: [], custom: [] }, // 系统通知，分为自定义消息和系统消息
}

export {INITIAL_STATE}

/**
 * 登录用户个人信息
 * userInfo: {account, avatar, birth, createTime, email, gender, nick, sign, tel, updateTime}
 * friendCard: { account: {account,nick,avatar,sign,gender:'male/female/unknown',tel,updateTime,createTime, isBlack, status} }
 * onlineList: {account: status}
 * messageListToRender: {account: {unixtime1: {from,to,type,scene,text,sendOrReceive,displayTimeHeader,time}, unixtime2: {}}}
 * rawMessageList: {account: {unixtime1: {flow,from,fromNick,idServer,scene,sessionId,text,target,to,time...}, unixtime2: {}}}
 * unreadInfo: {account1: unread, acccount2: unread}
 * notificationList: {system: [{desc:'',msg:{category,from,idServer,read,state,status,time,to,type}}], custom: []}
 */