<template>
  <v-container>

    <!-- 返回按钮 -->
    <v-btn text @click="goBack">⬅️ 返回租客管理</v-btn>

    <!-- 租客信息卡片 -->
    <v-card class="mt-4">
      <v-card-title>{{ guest.name || '租客详情' }}</v-card-title>

      <v-card-text v-if="guest.name">
        <v-list dense>
          <v-list-item>
            <v-list-item-title>【姓名】{{ guest.name }}</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>【电话】{{ guest.phone || '暂无电话' }}</v-list-item-title>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>【备注】{{ guest.notes || '暂无备注' }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-text v-else>
        正在加载租客信息...
      </v-card-text>
    </v-card>

    <v-divider class="my-6"></v-divider>

    <!-- 入住记录卡片 -->
    <v-card>
      <v-card-title>
        入住记录
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openNewBookingDialog">➕ 新增入住</v-btn>
      </v-card-title>

      <v-data-table
        :headers="bookingHeaders"
        :items="bookings"
        item-value="id"
        class="elevation-1"
      >
        <template #item.actions="{ item }">
          <v-btn size="small" text @click="openEditBookingDialog(item)">编辑</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 入住记录弹窗 -->
    <v-dialog v-model="bookingDialogVisible" max-width="600">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑入住' : '新增入住' }}</v-card-title>

        <v-card-text>
          <v-text-field v-model="editForm.room_id" label="房间ID" outlined dense />

          <v-menu v-model="checkInMenu" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-text-field v-bind="props" v-model="editForm.check_in" label="入住时间" readonly outlined dense />
            </template>
            <v-date-picker v-model="editForm.check_in" @update:model-value="checkInMenu = false" />
          </v-menu>

          <v-menu v-model="checkOutMenu" :close-on-content-click="false" offset-y>
            <template #activator="{ props }">
              <v-text-field v-bind="props" v-model="editForm.check_out" label="离宿时间" readonly outlined dense />
            </template>
            <v-date-picker v-model="editForm.check_out" @update:model-value="checkOutMenu = false" />
          </v-menu>

          <v-textarea v-model="editForm.notes" label="备注" outlined dense />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="bookingDialogVisible = false">取消</v-btn>
          <v-btn color="primary" text @click="saveBooking">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 路由参数
const route = useRoute()
const router = useRouter()
const guestId = route.params.id

// 租客信息
const guest = ref({})
const bookings = ref([])

// 入住表格表头
const bookingHeaders = [
  { text: '房间ID', value: 'room_id' },
  { text: '入住时间', value: 'check_in' },
  { text: '离宿时间', value: 'check_out' },
  { text: '备注', value: 'notes' },
  { text: '操作', value: 'actions', sortable: false }
]

// 弹窗控制
const bookingDialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  room_id: '',
  check_in: '',
  check_out: '',
  notes: ''
})
const checkInMenu = ref(false)
const checkOutMenu = ref(false)

// 页面初始化加载
onMounted(() => {
  loadGuest()
  loadBookings()
})

// 加载租客详情
async function loadGuest() {
  try {
    const res = await axios.get(`http://localhost:3000/guests/${guestId}`)
    guest.value = res.data
  } catch (error) {
    console.error('加载租客失败', error)
    ElMessage.error('该租客不存在或已被删除')
    goBack()  // 返回上一页，避免停留在错误页面
  }
}

// 加载租客入住记录
async function loadBookings() {
  try {
    const res = await axios.get('http://localhost:3000/bookings')
    bookings.value = res.data.filter(b => b.guest_id === Number(guestId))
  } catch (error) {
    console.error('加载入住记录失败', error)
    ElMessage.error('加载入住记录失败')
  }
}

// 打开新增入住弹窗
function openNewBookingDialog() {
  isEditing.value = false
  Object.assign(editForm, { id: null, room_id: '', check_in: '', check_out: '', notes: '' })
  bookingDialogVisible.value = true
}

// 打开编辑入住弹窗
function openEditBookingDialog(booking) {
  isEditing.value = true
  Object.assign(editForm, booking)
  bookingDialogVisible.value = true
}

// 保存入住记录
async function saveBooking() {
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm)
    } else {
      await axios.post('http://localhost:3000/bookings', {
        ...editForm,
        guest_id: Number(guestId)
      })
    }
    ElMessage.success('操作成功')
    bookingDialogVisible.value = false
    await loadBookings()
  } catch (error) {
    console.error('保存失败', error)
    ElMessage.error('保存入住记录失败')
  }
}

// 返回租客管理页
function goBack() {
  router.push('/guests')
}
</script>
