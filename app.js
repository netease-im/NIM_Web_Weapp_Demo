import WeAppRedux from './redux/index.js';
import createStore from './redux/createStore.js';
import reducer from './store/reducer.js';

import ENVIRONMENT_CONFIG from './config/envConfig.js'
import PAGE_CONFIG from './config/pageConfig.js'

const {Provider} = WeAppRedux;
const store = createStore(reducer) // redux store

App(
  Provider(store)(
    {
      globalData: {
        ENVIRONMENT_CONFIG,
        PAGE_CONFIG
      },
      onLaunch: function () {}
    }
  )
)
