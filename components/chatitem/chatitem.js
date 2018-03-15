// components/listitem/listitem.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    icon: {
      type: String,
      value: '../../images/default-icon.png',
      observer: function(newVal, oldVal) {
        // console.log(newVal+'--'+oldVal)
      }
    },
    title: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    
  },
  attached:function(obj) {
    console.log(obj)
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
