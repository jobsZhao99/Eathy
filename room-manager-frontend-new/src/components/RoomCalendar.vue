<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>房态日历（未来30天）</v-toolbar-title>
    </v-toolbar>

    <v-simple-table class="elevation-1">
      <thead>
        <tr>
          <th class="text-center">房间</th>
          <th v-for="date in dateRange" :key="date" class="text-center text-xs">
            {{ date.slice(5) }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="room in rooms" :key="room.id">
          <td class="text-center font-semibold">{{ room.name }}</td>

          <td v-for="(date, idx) in dateRange" :key="date" class="relative h-8 w-10 p-0">
            <div v-if="isStartOfBooking(room.id, date)" class="absolute top-0 left-0 h-full flex items-center">
              <v-tooltip top>
                <template #activator="{ props }">
                  <div
                    v-bind="props"
                    :style="getBookingBarStyle(room.id, date, idx)"
                    :class="getBookingBarClass(room.id, date)"
                    class="rounded cursor-pointer h-full"
                    @click="openBookingDetail(room.id, date)"
                  ></div>
                </template>
                <span>{{ getGuestName(room.id, date) }}</span>
              </v-tooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <!-- 弹出编辑 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>编辑入住信息</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.guest_name" label="租客姓名" outlined dense />
          <v-text-field v-model="editForm.notes" label="备注" outlined dense />
          <v-menu v-model="checkInMenu" :close-on-content-click="false" transition="scale-transition" offset-y>
            <template #activator="{ on, attrs }">
              <v-text-field
                v-model="editForm.check_in"
                label="入住时间"
                readonly
                v-bind="attrs"
                v-on="on"
                outlined dense
              />
            </template>
            <v-date-picker v-model="editForm.check_in" @input="checkInMenu = false" />
          </v-menu>

          <v-menu v-model="checkOutMenu" :close-on-content-click="false" transition="scale-transition" offset-y>
            <template #activator="{ on, attrs }">
              <v-text-field
                v-model="editForm.check_out"
                label="搬出时间"
                readonly
                v-bind="attrs"
                v-on="on"
                outlined dense
              />
            </template>
            <v-date-picker v-model="editForm.check_out" @input="checkOutMenu = false" />
          </v-menu>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVisible = false">取消</v-btn>
          <v-btn text color="error" @click="deleteBooking" v-if="editForm.id">删除</v-btn>
          <v-btn color="primary" text @click="saveBooking">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 房间数据
const rooms = ref([])
// 预订数据
const bookings = ref([])
// 日期范围
const dateRange = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const editForm = reactive({
  id: null,
  guest_name: '',
  notes: '',
  check_in: '',
  check_out: ''
})
const checkInMenu = ref(false)
const checkOutMenu = ref(false)

onMounted(async () => {
  await loadData()
})

async function loadData() {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + 30)
  dateRange.value = getDatesInRange(today.setDate(today.getDate()-5), end)

  const resRooms = await axios.get('http://localhost:3000/rooms')
  const resBookings = await axios.get('http://localhost:3000/bookings')

  rooms.value = resRooms.data
  bookings.value = resBookings.data
}

function getDatesInRange(start, end) {
  const dates = []
  let current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current).toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function isStartOfBooking(roomId, date) {
  return bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
}

function getGuestName(roomId, date) {
  const booking = bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out
  )
  return booking ? booking.guest_name : ''
}

function getBookingBarStyle(roomId, date, idx) {
  const booking = bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
  if (!booking) return {}

  const checkIn = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  return {
    width: `${days * 40}px`
  }
}

function getBookingBarClass(roomId, date) {
  const booking = bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
  if (!booking) return ''

  const today = new Date()
  const checkInDate = new Date(booking.check_in)

  if (isSameDay(today, checkInDate)) {
    return 'bg-blue-lighten-2'
  }
  return 'bg-green-lighten-2'
}

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function openBookingDetail(roomId, date) {
  const booking = bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out
  )
  if (booking) {
    editForm.id = booking.id
    editForm.guest_name = booking.guest_name
    editForm.notes = booking.notes
    editForm.check_in = booking.check_in
    editForm.check_out = booking.check_out
    dialogVisible.value = true
  }
}

async function saveBooking() {
  try {
    await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm, {
      headers: { 'Content-Type': 'application/json' }
    })
    ElMessage.success('修改成功！')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败！')
  }
}

async function deleteBooking() {
  try {
    const confirm = window.confirm('确定要删除这条入住记录吗？')
    if (!confirm) return

    await axios.delete(`http://localhost:3000/bookings/${editForm.id}`)
    ElMessage.success('删除成功！')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败！')
  }
}

</script>
