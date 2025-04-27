<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>房态日历（未来30天）</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openNewBookingDialog">➕ 新增入住</v-btn>
    </v-toolbar>

    <v-simple-table class="elevation-1 mt-4">
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
                    :style="getBookingBarStyle(room.id, date)"
                    :class="getBookingBarClass(room.id, date)"
                    class="rounded cursor-pointer h-full px-1 overflow-hidden whitespace-nowrap text-xs flex items-center"
                    @click="openBookingDetail(room.id, date)"
                  >
                    {{ getGuestName(room.id, date) }}
                  </div>
                </template>
                <span>{{ getGuestName(room.id, date) }}</span>
              </v-tooltip>
            </div>
          </td>


        </tr>
      </tbody>
    </v-simple-table>

    <!-- 新增/编辑入住 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑入住' : '新增入住' }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="editForm.guest_id"
            :items="guestOptions"
            item-title="name"
            item-value="id"
            label="租客"
            outlined dense
          />
          <v-select
            v-model="editForm.room_id"
            :items="roomOptions"
            item-title="name"
            item-value="id"
            label="房间"
            outlined dense
          />
          
        <!-- 入住时间选择 -->
        <v-menu
          v-model="checkInMenu"
          :close-on-content-click="false"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="editForm.check_in"
              label="入住时间"
              readonly
              outlined
              dense
            />
          </template>
          <v-date-picker
            v-model="editForm.check_in"
            @update:model-value="checkInMenu = false"
          />
        </v-menu>


        <!-- 搬出时间选择 -->
        <v-menu
          v-model="checkOutMenu"
          :close-on-content-click="false"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="editForm.check_out"
              label="搬出时间"
              readonly
              outlined
              dense
            />
          </template>
          <v-date-picker
            v-model="editForm.check_out"
            @update:model-value="checkOutMenu = false"
          />
        </v-menu>

          <v-textarea v-model="editForm.notes" label="备注" outlined dense />
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

// 数据
const rooms = ref([])
const guests = ref([])
const bookings = ref([])
const dateRange = ref([])



// 弹窗控制
const dialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  guest_id: '',
  room_id: '',
  check_in: '',
  check_out: '',
  notes: ''
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
  dateRange.value = getDatesInRange(today, end)

  const resRooms = await axios.get('http://localhost:3000/rooms')
  const resGuests = await axios.get('http://localhost:3000/guests')
  const resBookings = await axios.get('http://localhost:3000/bookings')

  rooms.value = resRooms.data
  guests.value = resGuests.data
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

// 查某天某房间有没有入住
function getBookingForRoom(roomId, date) {
  return bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out
  )
}

// 根据 guest_id 找租客名字
function getGuestName(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (!booking) return ''
  const guest = guests.value.find(g => g.id === booking.guest_id)
  return guest ? guest.name : ''
}


// 判断当天是不是入住开始
function isStartOfBooking(roomId, date) {
  return bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
}

// 渲染条的宽度（根据入住天数）
function getBookingBarStyle(roomId, date) {
  const booking = bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
  if (!booking) return {}

  const checkIn = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  return {
    width: `${days * 40}px`
  }
}


// // 渲染 booking 的条宽度
// function getBookingBarStyle(roomId, date) {
//   const booking = getBookingForRoom(roomId, date)
//   if (!booking) return {}
//   const checkIn = new Date(booking.check_in)
//   const checkOut = new Date(booking.check_out)
//   const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
//   return {
//     width: `${days * 40}px`
//   }
// }

// 渲染 booking 的条颜色
function getBookingBarClass(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (!booking) return ''
  const today = new Date()
  if (isSameDay(today, new Date(booking.check_in))) {
    return 'bg-blue-lighten-2'
  }
  return 'bg-green-lighten-2'
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

// 点击条条弹出编辑
function openBookingDetail(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (booking) {
    isEditing.value = true
    editForm.id = booking.id
    editForm.room_id = booking.room_id
    editForm.guest_id = booking.guest_id
    editForm.check_in = booking.check_in
    editForm.check_out = booking.check_out
    editForm.notes = booking.notes
    dialogVisible.value = true
  }
}

// 新增入住
function openNewBookingDialog() {
  isEditing.value = false
  editForm.id = null
  editForm.room_id = ''
  editForm.guest_id = ''
  editForm.check_in = ''
  editForm.check_out = ''
  editForm.notes = ''
  dialogVisible.value = true
}

// 保存入住
async function saveBooking() {
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('修改成功！')
    } else {
      await axios.post(`http://localhost:3000/bookings`, editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('新增成功！')
    }
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('保存失败的错误信息：', error.response ? error.response.data : error)
    ElMessage.error('保存失败！请检查填写信息或服务器响应')
  }
}

// 删除入住
async function deleteBooking() {
  try {
    if (!editForm.id) return
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

// 租客选项
const guestOptions = guests
// 房间选项
const roomOptions = rooms
</script>
