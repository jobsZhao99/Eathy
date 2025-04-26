// import './assets/tailwind.css'
// import ElementPlus from 'element-plus'
// import 'element-plus/dist/index.css'
// import { createApp } from 'vue'
// import App from './App.vue'

// const app = createApp(App)
// app.use(ElementPlus)
// app.mount('#app')


// import { createApp } from 'vue'
// import App from './App.vue'

// import 'vuetify/styles'
// import { createVuetify } from 'vuetify'
// import * as components from 'vuetify/components'
// import * as directives from 'vuetify/directives'

// const vuetify = createVuetify({
//   components,
//   directives,
// })

// const app = createApp(App)
// app.use(vuetify)
// app.mount('#app')


import { createApp } from 'vue'
import App from './App.vue'

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

// 创建 vuetify 实例
const vuetify = createVuetify({
  components,
  directives,
})

// 创建 Vue 应用实例
const app = createApp(App)

// 注册插件
app.use(ElementPlus)
app.use(vuetify)

// 挂载到页面
app.mount('#app')
