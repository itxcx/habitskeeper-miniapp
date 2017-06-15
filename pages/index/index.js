var config = require('../../config');
var dateUtil = require('../../utils/dateUtil.js');
var self;

Page({
  currDateForCompare:'',
  currDate:'',
  currWeek:'',

  data: {
    habitNameInput:'',
    showModalStatus: false,
    userInfo:{},
    showMask: false,
    habitList:[
    ]
  },

  onLoad: function (){
    self = this;
    self.setData({
      currDate: dateUtil.getCurrentDateDisplay(),
      currWeek: dateUtil.getCurrentWeekDisplay(),
      currDateForCompare: dateUtil.getCurrentDate()
    })

    wx.login({
      success: function (data) {
        console.log('step1 success 调用微信登录接口');
        wx.showToast({
          title: '数据加载中...',
          icon: 'loading'
        })
        wx.request({
          url: "https://api.weixin.qq.com/sns/jscode2session?appid=" + config.appId + "&secret=" + config.appSecret + "&js_code=" + data.code + "&grant_type=authorization_code",
          data: {
            code: data.code
          },
          success: function (res) {
            getApp().user.openid = res.data.openid;
            console.log('step2 success 获取微信openid ：', getApp().user.openid);

            wx.getUserInfo({
              success: function (res) {
                console.log('step3.1 success 获取微信用户信息 ', res.userInfo);
                getApp().user.userInfo = res.userInfo;
                self.data.userInfo = getApp().user.userInfo;
                self.setData({
                  userInfo: self.data.userInfo
                })
                wx.hideLoading();
                self.updateUser();
              },

              fail: function (res) {
                console.log('step3.1 fail 获取微信用户信息', res);
              }
            })


            wx.request({
              url: `https://api.weixin.qq.com/cgi-bin/token`,
              data: {
                grant_type: 'client_credential',
                appid: config.appId,
                secret: config.appSecret,
              },

              success: function (result) {
                console.log('step3.2 success 获取用户access_token：' + result.data.access_token + '，初始化完成');
                getApp().user.accessToken = result.data.access_token;
              },

              fail: function ({errMsg}) {
                console.log('step3.2 fail 获取用户access_token', errMsg);
              }
            })
          },

          fail: function (res) {
            console.log('step2 fail 获取微信openid，将无法正常使用开放接口等服务', res);
          }
        })

      },

      fail: function (err) {
        console.log('step1 fail 调用微信登录接口，将无法正常使用开放接口等服务', err);
      }
    })
  },

  onShow: function () {
    if(null != getApp().user.userInfo){
      self.getHabitList();
    }
  },

  updateUser: function(){
    wx.request({
      url: config.baseUrl + "adduser",
      data: {
        userId: getApp().user.openid,
        avatarUrl: getApp().user.userInfo.avatarUrl,
        city: getApp().user.userInfo.city,
        country: getApp().user.userInfo.country,
        gender: getApp().user.userInfo.gender,
        language: getApp().user.userInfo.language,
        nickName: getApp().user.userInfo.nickName,
        province: getApp().user.userInfo.province,
      },
      success: function (result) {
        console.log('step4 success 更新云端用户信息 ', result.data);
        console.log(result.data);
        self.getHabitList();
      },

      fail: function ({errMsg}) {
        console.log('step4 fail 更新云端用户信息 ', errMsg);
      }
    })
  },

  getHabitList: function(){
    wx.request({
      url: config.baseUrl + "gethabitlist",
      data: {
        userId: getApp().user.openid,
      },
      success: function (result) {
        if(result.data.returnCode == '200'){
          self.setData({
            habitList: result.data.result
          })
        }else{

        }
      },

      fail: function ({errMsg}) {
      }
    })
  },

  habitNameInput: function(e) {
    self.data.habitNameInput = e.detail.value;
  },

  controlTap: function() {
    self.setData({
      showMask: !self.data.showMask
    })
  },

  noTap:function(e){
    var id = e.currentTarget.id, list = self.data.habitList;
    for (var i = 0; i < list.length; i++) {
      if ("no-" + list[i].habitId == id) {
        var habitId = list[i].habitId;
        wx.showModal({
          title: "提示",
          content: "您确定吗？您今天没有完成了该目标。",
          confirmText: "确定",
          cancelText: "取消",
          success: function () {
            self.addHabitDayRecord(habitId, dateUtil.getCurrentDate(), 0);
          }
        })
      }
    }
  },

  yesTap:function(e){
    var id = e.currentTarget.id, list = self.data.habitList;
    for (var i = 0; i < list.length; i++) {
      if ("yes-" + list[i].habitId == id) {
        var habitId = list[i].habitId;
        wx.showModal({
          title: "提示",
          content: "您确定吗？您今天已经完成了该目标。",
          confirmText: "确定",
          cancelText: "取消",
          success: function () {
            self.addHabitDayRecord(habitId, dateUtil.getCurrentDate(), 1);
          }
        })
      }
    }
  },

  addHabitDayRecord: function (habitId, date, isComplete){
    wx.showToast({
      title: '正在上传数据...',
      icon: 'loading'
    })
    wx.request({
      url: config.baseUrl + "addhabitdayrecord",
      data: {
        habitId: habitId,
        date: date,
        isComplete: isComplete,
        remark: '无',
      },
      success: function (result) {
        wx.hideToast();
        self.getHabitList();
      },

      fail: function ({errMsg}) { }
    })
  },

  habitDetailTap:function(e){
    var id = e.currentTarget.id, list = self.data.habitList;
    for (var i = 0; i < list.length; i++) {
      if ("goto-" + list[i].habitId == id) {
        wx.navigateTo({
          url: '/pages/habitDetail/habitDetail?habitId=' + list[i].habitId,
        })
      }
    }
  },

  showAddHabitTap: function (e) {
      self.setData({
        showMask: false,
        showModalStatus: true
      })
   }, 

   cancleAddHabitTap: function(){
     this.setData({
       showModalStatus: false
     });
   },

   confirmAddHabitTap: function (currentStatu) {
     self.cancleAddHabitTap();
     if (self.data.habitNameInput != null && self.data.habitNameInput.length != 0){
       wx.showToast({
         title: '正在上传数据...',
         icon: 'loading'
       })
       wx.request({
         url: config.baseUrl + "addhabit",
         data: {
           userId: getApp().user.openid,
           habitName: self.data.habitNameInput,
           targetPercent: 0.8,
         },
         success: function (result) {
           wx.hideToast();
           self.getHabitList();
         },

         fail: function ({errMsg}) { }
       })
     }else{
       wx.showModal({
         title: "提示",
         content: "请您输入内容！",
         confirmText: "确定",
         showCancel: false,
         success: function () {
           self.addHabitDayRecord(habitId, dateUtil.getCurrentDate(), 1);
         }
       })
     }
   }
})
