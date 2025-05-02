<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>入住记录管理</v-toolbar-title>
      <v-spacer></v-spacer>
    </v-toolbar>

    <v-data-table
      :headers="headers"
      :items="bookings"
      item-value="id"
      class="elevation-1 mt-4"
    >
      <template #item.room_name="{ item }">
        {{ getRoomName(item.room_id) }}
      </template>
      <template #item.guest_name="{ item }">
        {{ getGuestName(item.guest_id) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn size="small" text @click="openEditDialog(item)">编辑</v-btn>
        <v-btn size="small" text color="error" @click="deleteBooking(item.id)">删除</v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="dialogVisible" max-width="600">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑入住记录' : '新增入住记录' }}</v-card-title>
        <v-card-text>
          <v-select v-model="editForm.guest_id" :items="guestOptions" item-title="name" item-value="id" label="租客" outlined dense />
          <v-select v-model="editForm.room_id" :items="roomOptions" item-title="name" item-value="id" label="房间" outlined dense />
          <v-text-field v-model="editForm.check_in" label="入住时间" type="date" outlined dense />
          <v-text-field v-model="editForm.check_out" label="搬出时间" type="date" outlined dense />
          <v-text-field v-model="editForm.confirmation_code" label="确认码" outlined dense />
          <v-text-field v-model="editForm.night" label="夜数" type="number" outlined dense />
          <v-text-field v-model="editForm.sum_days" label="总天数" type="number" outlined dense />
          <v-text-field v-model="editForm.net_rate" label="净房价" type="number" outlined dense />
          <v-text-field v-model="editForm.daily_rent" label="日租金" type="number" outlined dense />
          <v-text-field v-model="editForm.total_rent" label="总租金" type="number" outlined dense />
          <v-textarea v-model="editForm.notes" label="备注" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVisible = false">取消</v-btn>
          <v-btn color="primary" text @click="saveBooking">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const bookings = ref([])
const guests = ref([])
const rooms = ref([])

const dialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  guest_id: '',
  room_id: '',
  check_in: '',
  check_out: '',
  notes: '',
  confirmation_code: '',
  night: '',
  sum_days: '',
  net_rate: '',
  total_rent: '',
  daily_rent: ''
})

const headers = [
  { text: '租客', value: 'guest_name' },
  { text: '房间', value: 'room_name' },
  { text: '入住', value: 'check_in' },
  { text: '搬出', value: 'check_out' },
  { text: '确认码', value: 'confirmation_code' },
  { text: '备注', value: 'notes' },
  { text: '操作', value: 'actions', sortable: false }
]

onMounted(async () => {
  await loadAll()
})

const loadAll = async () => {
  const [resBookings, resGuests, resRooms] = await Promise.all([
    axios.get('http://localhost:3000/bookings'),
    axios.get('http://localhost:3000/guests'),
    axios.get('http://localhost:3000/rooms')
  ])
  bookings.value = resBookings.data
  guests.value = resGuests.data
  rooms.value = resRooms.data
}

const guestOptions = guests
const roomOptions = rooms

const getGuestName = (id) => guests.value.find(g => g.id === id)?.name || '-'
const getRoomName = (id) => rooms.value.find(r => r.id === id)?.name || '-'

function openEditDialog(item) {
  isEditing.value = true
  Object.assign(editForm, item)
  dialogVisible.value = true
}

async function saveBooking() {
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('http://localhost:3000/bookings', editForm)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await loadAll()
  } catch (e) {
    ElMessage.error('保存失败')
    console.error(e)
  }
}

async function deleteBooking(id) {
  try {
    await ElMessageBox.confirm('确认删除该记录？', '提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await axios.delete(`http://localhost:3000/bookings/${id}`)
    ElMessage.success('删除成功')
    await loadAll()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
</style>
