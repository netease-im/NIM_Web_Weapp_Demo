// 配置
let envir = 'online'
let ENVIRONMENT_CONFIG = {}
let configMap = {
    test: {
      appkey: 'fe416640c8e8a72734219e1847ad2547',
      url: 'https://apptest.netease.im'
    },
    pre: {
      appkey: '45c6af3c98409b18a84451215d0bdd6e',
      url: 'http://preapp.netease.im:8184'
    },
    online: {
      appkey: '45c6af3c98409b18a84451215d0bdd6e',
      url: 'https://app.netease.im'
    },
    privateConf: { 
        "lbs_web": "http://127.0.0.1/lbs/webconf.jsp", 
        "link_ssl_web": false, 
        "nos_uploader_web": "", 
        "https_enabled": false, 
        "nos_downloader": "127.0.0.1/{bucket}/{object}", 
        "nos_accelerate": "", 
        "nos_accelerate_host": "", 
        "nt_server": "" 
    }
  };
ENVIRONMENT_CONFIG = configMap[envir];
// 是否开启订阅服务
ENVIRONMENT_CONFIG.openSubscription = true
// 是否开启私有化部署
ENVIRONMENT_CONFIG.openPrivateConf = false
module.exports = ENVIRONMENT_CONFIG
