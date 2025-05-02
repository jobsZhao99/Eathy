import { createApp } from 'vue'
import App from './App.vue'


import router from './router'

// 引入 TailwindCSS
import './assets/tailwind.css'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 引入 Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
// Material Design Icons
import '@mdi/font/css/materialdesignicons.css'

// 创建 vuetify 实例
const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  components,
  directives,
})

// 创建 Vue 应用实例
const app = createApp(App)

// 注册插件
app.use(ElementPlus)
app.use(vuetify)

app.use(router)

// 挂载到页面
app.mount('#app')
