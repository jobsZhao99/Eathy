<template>
  <div class="overflow-x-auto border rounded-lg shadow p-2">
    <table class="min-w-full text-center">
      <thead>
        <tr class="bg-gray-100">
          <th class="py-2 px-4">房间</th>
          <th v-for="date in dateRange" :key="date" class="py-2 px-2 text-xs">
            {{ date.slice(5) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in rooms" :key="room.id" class="hover:bg-gray-50">
          <td class="relative p-0 h-8 w-32 flex items-center justify-center bg-gray-50 text-sm font-semibold">
            {{ room.name }}
          </td>

          <td
            v-for="(date, index) in dateRange"
            :key="date"
            class="relative p-0 h-8 w-10"
          >
            <template v-if="isStartOfBooking(room.id, date)">
              <el-tooltip
                :content="getGuestName(room.id, date)"
                placement="top"
                effect="dark"
              >
                <div
                  :style="getBookingBarStyle(room.id, date, index)"
                  :class="getBookingBarClass(room.id, date)"
                  class="absolute top-0 left-0 h-full flex items-center rounded-lg cursor-pointer"
                  @click="openBookingDetail(room.id, date)"
                ></div>
              </el-tooltip>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 修改Booking弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑入住信息"
      width="400px"
      :before-close="() => (dialogVisible = false)"
    >
      <el-form :model="editForm" label-width="80px" class="mt-4">
        <el-form-item label="租客姓名">
          <el-input v-model="editForm.guest_name" placeholder="请输入租客姓名" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="editForm.notes" placeholder="请输入备注" />
        </el-form-item>

        <el-form-item label="入住时间">
          <el-date-picker
            v-model="editForm.check_in"
            type="date"
            placeholder="选择入住日期"
            style="width: 100%;"
          />
        </el-form-item>

        <el-form-item label="搬出时间">
          <el-date-picker
            v-model="editForm.check_out"
            type="date"
            placeholder="选择搬出日期"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBooking">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElTooltip, ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElDatePicker, ElMessage } from 'element-plus'

const rooms = ref([])
const bookings = ref([])
const dateRange = ref([])

const dialogVisible = ref(false)
const currentBooking = ref(null)
const editForm = reactive({
  id: null,
  guest_name: '',
  notes: '',
  check_in: '',
  check_out: ''
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  const today = new Date()
  const end = new Date()
  end.setDate(today.getDate() + 30)
  dateRange.value = getDatesInRange(today, end)

  const resRooms = await axios.get('http://localhost:3000/rooms')
  rooms.value = resRooms.data

  const resBookings = await axios.get('http://localhost:3000/bookings')
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
  return booking ? `${booking.guest_name}${booking.notes ? ' (' + booking.notes + ')' : ''}` : ''
}

function getBookingBarStyle(roomId, date, index) {
  const booking = bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
  if (!booking) return {}

  const checkIn = new Date(booking.check_in)
  const checkOut = new Date(booking.check_out)
  const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  return {
    width: `${days * 40}px`,
  }
}

function getBookingBarClass(roomId, date) {
  const booking = bookings.value.find(b => b.room_id === roomId && isSameDay(new Date(b.check_in), new Date(date)))
  if (!booking) return ''

  const today = new Date()
  const checkInDate = new Date(booking.check_in)

  if (isSameDay(today, checkInDate)) {
    return 'bg-blue-400 hover:bg-blue-500'
  }
  return 'bg-green-400 hover:bg-green-500'
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
    currentBooking.value = booking
    Object.assign(editForm, {
      id: booking.id,
      guest_name: booking.guest_name,
      notes: booking.notes,
      check_in: booking.check_in,
      check_out: booking.check_out
    })
    dialogVisible.value = true
  }
}

async function saveBooking() {
  try {
    await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    ElMessage.success('修改成功！')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('保存出错:', error)
    ElMessage.error('修改失败，请检查填写内容或后端接口！')
  }
}
</script>
