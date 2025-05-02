<template>
  <v-container fluid>
    <v-toolbar flat>
      <v-toolbar-title>单元管理</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openNewunitDialog">➕ 新增单元</v-btn>
    </v-toolbar>

    <v-data-table
      :headers="headers"
      :items="units"
      class="elevation-1 mt-4"
    >
      <template #item.property="{ item }">
        {{ item.property_name || '-' }}
      </template>

      <template #item.actions="{ item }">
        <v-btn size="small" text @click="openEditunitDialog(item)">编辑</v-btn>
        <v-btn size="small" text color="error" @click="deleteunit(item.id)">删除</v-btn>
      </template>
    </v-data-table>

    <!-- 新增/编辑单元 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑单元' : '新增单元' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editForm.name" label="单元名称" outlined dense />
          <v-select
            v-model="editForm.property_id"
            :items="properties"
            item-title="name"
            item-value="id"
            label="所属楼栋"
            outlined dense
          />
          <v-textarea v-model="editForm.description" label="单元描述" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVisible = false">取消</v-btn>
          <v-btn color="primary" text @click="saveunit">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const units = ref([])
const properties = ref([])

const headers = [
  { text: '单元名称', value: 'name' },
  { text: '楼栋', value: 'property' },  // 🌟 注意这里 value 写 property
  { text: '描述', value: 'description' },
  { text: '操作', value: 'actions', sortable: false }
]

const dialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  name: '',
  property_id: null,
  description: ''
})

onMounted(() => {
  loadProperties()
  loadunits()

})

async function loadunits() {
  const res = await axios.get('http://localhost:3000/units')
  // 补充 property_name（假设后端没有 JOIN，可以前端自己处理）
  units.value = res.data.map(unit => {
    const property = properties.value.find(p => p.id === unit.property_id)
    return { ...unit, property_name: property ? property.name : '-' }
  })
}

async function loadProperties() {
  const res = await axios.get('http://localhost:3000/properties')
  properties.value = res.data
}

function openNewunitDialog() {
  isEditing.value = false
  editForm.id = null
  editForm.name = ''
  editForm.property_id = null
  editForm.description = ''
  dialogVisible.value = true
}

function openEditunitDialog(unit) {
  isEditing.value = true
  editForm.id = unit.id
  editForm.name = unit.name
  editForm.property_id = unit.property_id
  editForm.description = unit.description
  dialogVisible.value = true
}

async function saveunit() {
  if (!editForm.name || !editForm.property_id) {
    ElMessage.error('请填写完整单元信息')
    return
  }

  const payload = {
    name: editForm.name,
    property_id: editForm.property_id,
    description: editForm.description
  }

  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/units/${editForm.id}`, payload)
      ElMessage.success('单元更新成功')
    } else {
      await axios.post('http://localhost:3000/units', payload)
      ElMessage.success('新增单元成功')
    }
    dialogVisible.value = false
    await loadunits()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  }
}

async function deleteunit(id) {
  try {
    await ElMessageBox.confirm('确认要删除这个单元吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`http://localhost:3000/units/${id}`)
    ElMessage.success('删除成功')
    await loadunits()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }
}
</script>
