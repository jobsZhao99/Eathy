import { createRouter, createWebHistory } from 'vue-router'
import RoomCalendar from '../components/RoomCalendar.vue'
import RoomManager from '../components/RoomManager.vue'
import UnitManager from '../components/UnitManager.vue'
import PropertyManager from '../components/PropertyManager.vue'
import GuestManager from '../components/GuestManager.vue'
import GuestPortal from '../components/GuestPortal.vue'
import BookingManager from '../components/BookingManager.vue'
const routes = [
  { path: '/', redirect: '/calendar' },
  { path: '/calendar', component: RoomCalendar },
  { path: '/rooms', component: RoomManager },
  { path: '/guests', component: GuestManager },
  { path: '/guest/:id',component: GuestPortal  },
  { path: '/properties', component: PropertyManager },
  { path: '/units', component: UnitManager },
  { path: '/bookingManager', component: BookingManager },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
