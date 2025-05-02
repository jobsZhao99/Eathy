<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>房间管理</v-toolbar-title>
      <v-spacer></v-spacer>
      <div class="mr-4 text-gray-600">共 {{ rooms.length }} 个房间</div>
      <v-btn color="primary" @click="openNewRoomDialog">➕ 新增房间</v-btn>
    </v-toolbar>

    <v-data-table
      :headers="headers"
      :items="sortedRooms"
      class="elevation-1 mt-4"
    >

      <template #item.property="{ item }">
        {{ item.property_name || '-' }}
      </template>

      <!-- 🌟 注意这里 value 写 unit -->
      <template #item.unit="{ item }">
        {{ item.unit_name || '-' }}
      </template>

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
          <v-select
            v-model="editForm.property_id"
            :items="sortedProperties"
            item-title="name"
            item-value="id"
            label="所属楼栋"
            outlined dense
          />
          <v-select
            v-model="editForm.unit_id"  
            :items="filteredUnits"
            item-title="name"
            item-value="id"
            label="所属单元"
            outlined dense
          />
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
import { ref, reactive, onMounted,computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { lo } from 'element-plus/es/locale/index.mjs'

const rooms = ref([])
const properties = ref([])
const units = ref([])

const headers = [
  { text: '楼栋', value: 'property_name', sortable:true },  // 🌟 注意这里 value 写 property
  { text: '单元', value: 'unit',sortable:true },  // 🌟 注意这里 value 写 property
  { text: '房间名称', value: 'name' ,sortable:true},
  { text: '描述', value: 'description',sortable:true },
  { text: '操作', value: 'actions', sortable: false }
]

const dialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  name: '',
  property_id: null,
  unit_id: null, // 新增房间的单元 ID
  description: ''
})

onMounted(() => {
  loadProperties()
  loadUnits()
  loadRooms()

})


const sortedProperties = computed(() => {
  return [...properties.value].sort((a, b) => a.name.localeCompare(b.name))
})

const sortedRooms = computed(() => {
  return [...rooms.value].sort((a, b) => {
    const propCompare = (a.property_name || '').localeCompare(b.property_name || '')
    if (propCompare !== 0) return propCompare
    return (a.name || '').localeCompare(b.name || '')
  })
})
const filteredUnits = computed(() => {
  if (!editForm.property_id) return []
  return units.value.filter(u => u.property_id === editForm.property_id)
})
async function loadUnits() {
  const res = await axios.get('http://localhost:3000/units')
  units.value = res.data
}

async function loadRooms() {
  const res = await axios.get('http://localhost:3000/rooms')
  // 补充 property_name（假设后端没有 JOIN，可以前端自己处理）
  rooms.value = res.data.map(room => {
    const property = properties.value.find(p => p.id === room.property_id)
    const unit = units.value.find(u => u.id === room.unit_id) // 获取单元信息
    return { ...room, property_name: property ? property.name : '-', unit_name: unit ? unit.name : '-' }
  })
}

async function loadProperties() {
  const res = await axios.get('http://localhost:3000/properties')
  properties.value = res.data
}

function openNewRoomDialog() {
  isEditing.value = false
  editForm.id = null
  editForm.name = ''
  editForm.property_id = null
  editForm.unit_id = null // 新增房间的单元 ID
  editForm.description = ''
  dialogVisible.value = true
}

function openEditRoomDialog(room) {
  isEditing.value = true
  editForm.id = room.id
  editForm.name = room.name
  editForm.property_id = room.property_id
  editForm.unit_id = room.unit_id // 编辑房间的单元 ID
  editForm.description = room.description
  dialogVisible.value = true
}

async function saveRoom() {
  if (!editForm.name || !editForm.property_id) {
    ElMessage.error('请填写完整房间信息')
    return
  }

  const payload = {
    name: editForm.name,
    property_id: editForm.property_id,
    unit_id: editForm.unit_id, // 新增房间的单元 ID
    description: editForm.description
  }

  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/rooms/${editForm.id}`, payload)
      ElMessage.success('房间更新成功')
    } else {
      await axios.post('http://localhost:3000/rooms', payload)
      ElMessage.success('新增房间成功')
    }
    dialogVisible.value = false
    await loadRooms()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
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
    ElMessage.success('删除成功')
    await loadRooms()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }
}
</script>
