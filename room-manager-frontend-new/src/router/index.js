import { createRouter, createWebHistory } from 'vue-router'
import RoomCalendar from '../components/RoomCalendar.vue'
import RoomManager from '../components/RoomManager.vue'
import GuestManager from '../components/GuestManager.vue'
import GuestPortal from '../components/GuestPortal.vue'
const routes = [
  { path: '/', redirect: '/calendar' },
  { path: '/calendar', component: RoomCalendar },
  { path: '/rooms', component: RoomManager },
  { path: '/guests', component: GuestManager },
  {
    path: '/guest/:id',component: GuestPortal  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
