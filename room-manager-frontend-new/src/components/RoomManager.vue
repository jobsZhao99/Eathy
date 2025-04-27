<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>房间管理</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openNewRoomDialog">➕ 新增房间</v-btn>
    </v-toolbar>

    <v-data-table
      :headers="headers"
      :items="rooms"
      class="elevation-1 mt-4"
    >
    
      <template #item.actions="{ item }">
        <v-btn size="small" text @click="openEditRoomDialog(item)">编辑</v-btn>
        <v-btn size="small" text color="error" @click="deleteRoom(item.id)">删除</v-btn>
      </template>
    </v-data-table>

    <!-- 新增/编辑房间 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑房间' : '新增房间' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.name" label="房间名称" outlined dense />
          <v-text-field v-model="editForm.address" label="房间地址" outlined dense />
          <v-textarea v-model="editForm.description" label="房间描述" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVisible = false">取消</v-btn>
          <v-btn color="primary" text @click="saveRoom">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 房间数据
const rooms = ref([])

// 表头配置
const headers = [
  { text: '房间名称', value: 'name' },
  { text: '地址', value: 'address' },
  { text: '描述', value: 'description' },
  { text: '操作', value: 'actions', sortable: false }
]

// 弹窗控制
const dialogVisible = ref(false)
const isEditing = ref(false) // 区分是新增还是编辑
const editForm = reactive({
  id: null,
  name: '',
  address: '',
  description: ''
})

onMounted(() => {
  loadRooms()
})

async function loadRooms() {
  const res = await axios.get('http://localhost:3000/rooms')
  rooms.value = res.data
}

function openNewRoomDialog() {
  isEditing.value = false
  editForm.id = null
  editForm.name = ''
  editForm.address = ''
  editForm.description = ''
  dialogVisible.value = true
}

function openEditRoomDialog(room) {
  isEditing.value = true
  editForm.id = room.id
  editForm.name = room.name
  editForm.address = room.address
  editForm.description = room.description
  dialogVisible.value = true
}

async function saveRoom() {
  try {
    if (isEditing.value) {
      // 编辑更新
      await axios.put(`http://localhost:3000/rooms/${editForm.id}`, editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('房间更新成功！')
    } else {
      // 新增房间
      await axios.post('http://localhost:3000/rooms', editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('新增房间成功！')
    }
    dialogVisible.value = false
    await loadRooms()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败！')
  }
}

async function deleteRoom(id) {
  try {
    await ElMessageBox.confirm('确认要删除这个房间吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`http://localhost:3000/rooms/${id}`)
    ElMessage.success('删除成功！')
    await loadRooms()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('删除失败！')
    }
  }
}
</script>
