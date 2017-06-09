var config = require('../../config');
var dateUtil = require('../../utils/dateUtil.js');
var self;
Page({
  data: {
    habit:{},
    selectedDate: '',//选中的几月几号
    selectedWeek: '',//选中的星期几
    curYear: 2017,//当前年份
    curMonth: 0,//当前月份
    daysCountArr: [// 保存各个月份的长度，平年
      31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ],
    weekArr: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dateList: [],
    dayRecordList: []
  },
  onLoad: function (options) {
    self = this;
    self.getHabitById(options.habitId);
    self.getDayRecordListInMonth(options.habitId, dateUtil.getCurrentYearMonth());
  },
  onReady: function () {
    // 页面渲染完成
  },

  initDateList: function () {
    var today = new Date();//当前时间  
    var y = today.getFullYear();//年  
    var mon = today.getMonth() + 1;//月  
    var d = today.getDate();//日  
    var i = today.getDay();//星期  
    this.setData({
      curYear: y,
      curMonth: mon,
      selectedDate: y + '-' + mon + '-' + d,
      selectedWeek: this.data.weekArr[i]
    });

    this.getDateList(y, mon - 1);
    console.log(self.data.dateList);
  },

  getDateList: function (y, mon) {
    var vm = this;
    //如果是否闰年，则2月是29日
    var daysCountArr = this.data.daysCountArr;
    if (y % 4 == 0 && y % 100 != 0) {
      this.data.daysCountArr[1] = 29;
      this.setData({
        daysCountArr: daysCountArr
      });
    }
    //第几个月；下标从0开始实际月份还要再+1  
    var dateList = [];
    // console.log('本月', vm.data.daysCountArr[mon], '天');
    dateList[0] = [];
    var weekIndex = 0;//第几个星期
    for (var i = 0; i < vm.data.daysCountArr[mon]; i++) {
      var dayRecord = self.getDayRecordByDate(y, mon, i+1) == null ? new Object : self.getDayRecordByDate(y, mon, i+1);
      
      var week = new Date(y + '-' + (mon + 1) + '-' + (i + 1)).getDay();
      // 如果是新的一周，则新增一周
      if (week == 0) {
        weekIndex++;
        dateList[weekIndex] = [];
      }
      // 如果是第一行，则将该行日期倒序，以便配合样式居右显示
      if (weekIndex == 0) {
        dateList[weekIndex].unshift({
          value: y + '-' + (mon + 1) + '-' + (i + 1),
          day: i + 1,
          week: week,
          date: dayRecord.date,
          dayRecordId: dayRecord.dayRecordId,
          habitId: dayRecord.habitId,
          isComplete: dayRecord.isComplete,
          remark: dayRecord.remark,
          createTime: dayRecord.createTime
        });
      } else {
        dateList[weekIndex].push({
          value: y + '-' + (mon + 1) + '-' + (i + 1),
          day: i + 1,
          week: week,
          date: dayRecord.date,
          dayRecordId: dayRecord.dayRecordId,
          habitId: dayRecord.habitId,
          isComplete: dayRecord.isComplete,
          remark: dayRecord.remark,
          createTime: dayRecord.createTime
        });
      }
    }
    // console.log('本月日期', dateList);
    vm.setData({
      dateList: dateList
    });
  },

  selectDate: function (e) {
    self.setData({
      selectedDate: e.currentTarget.dataset.date.value,
      selectedWeek: vm.data.weekArr[e.currentTarget.dataset.date.week]
    });
  },

  preMonth: function () {
    var curYear = self.data.curYear;
    var curMonth = self.data.curMonth;
    curYear = curMonth - 1 ? curYear : curYear - 1;
    curMonth = curMonth - 1 ? curMonth - 1 : 12;
    self.setData({
      curYear: curYear,
      curMonth: curMonth
    });

    self.getDateList(curYear, curMonth - 1);
  },

  nextMonth: function () {
    // 下个月
    var curYear = self.data.curYear;
    var curMonth = self.data.curMonth;
    curYear = curMonth + 1 == 13 ? curYear + 1 : curYear;
    curMonth = curMonth + 1 == 13 ? 1 : curMonth + 1;
    // console.log('下个月', curYear, curMonth);
    self.setData({
      curYear: curYear,
      curMonth: curMonth
    });

    self.getDateList(curYear, curMonth - 1);
  },

  getHabitById: function (habitId){
    wx.request({
      url: config.baseUrl + "gethabitbyid",
      data: {
        habitId: habitId,
      },
      success: function (result) {
        if (result.data.returnCode == '200') {
          self.setData({
            habit: result.data.result
          })
        } else {
        }
      },

      fail: function ({errMsg}) {
      }
    })
  },

  getDayRecordListInMonth: function (habitId, yearmonth) {
    wx.request({
      url: config.baseUrl + "getdayrecordlistinmonth",
      data: {
        habitId: habitId,
        yearmonth: yearmonth
      },
      success: function (result) {
        if (result.data.returnCode == '200') {
          self.data.dayRecordList=result.data.result;
          self.initDateList();
        } else {
        }
      },

      fail: function ({errMsg}) {
      }
    })
  },

  getDayRecordByDate: function(year, month, day){
    for (var i = 0; i < self.data.dayRecordList.length; i++){
      var date = new Date(self.data.dayRecordList[i].date);//当前时间  
      var year1 = date.getFullYear();//年  
      var month1 = date.getMonth();//月  
      var day1 = date.getDate();//日  
      
      if (year == year1 && month == month1 && day == day1){
        return self.data.dayRecordList[i];
      }
    }
  }
})