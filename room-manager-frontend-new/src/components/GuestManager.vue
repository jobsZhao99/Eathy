<template>

<v-btn color="secondary" @click="$refs.fileInput.click()">📥 批量导入租客</v-btn>
      <input
        type="file"
        ref="fileInput"
        accept=".xlsx,.xls,.csv"
        class="hidden"
        @change="handleFileUpload"
      />

    <v-container fluid>
      <v-toolbar flat>
        <v-toolbar-title>租客管理</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="openNewGuestDialog">➕ 新增租客</v-btn>
      </v-toolbar>


      <v-data-table
        density="default"
        :headers="headers"
        :items="guests"
        item-value="id"
        class="elevation-1 mt-4"
      >
        <template #item.actions="{ item }">
          <v-btn size="small" text @click="openEditGuestDialog(item)">编辑</v-btn>
          <v-btn size="small" text color="error" @click="deleteGuest(item.id)">删除</v-btn>
        </template>
      </v-data-table>

  
      <!-- 新增/编辑租客 Dialog -->
      <v-dialog v-model="dialogVisible" max-width="500">
        <v-card>
          <v-card-title>{{ isEditing ? '编辑租客' : '新增租客' }}</v-card-title>
          <v-card-text>
            <v-text-field v-model="editForm.name" label="姓名" outlined dense />
            <v-text-field v-model="editForm.phone" label="电话" outlined dense />
            <v-textarea v-model="editForm.notes" label="备注" outlined dense />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="dialogVisible = false">取消</v-btn>
            <v-btn color="primary" text @click="saveGuest">保存</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
    
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import axios from 'axios'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  // 租客数据
  const guests = ref([])
  
  // 表头配置
  const headers = [
    { text: '姓名', value: 'name' },
    { text: '电话', value: 'phone' },
    { text: '备注', value: 'notes' },
    { text: '操作', value: 'actions', sortable: false }
  ]
  
  // 弹窗控制
  const dialogVisible = ref(false)
  const isEditing = ref(false)
  const editForm = reactive({
    id: null,
    name: '',
    phone: '',
    notes: ''
  })
  
  onMounted(() => {
    loadGuests()
  })
  
  async function loadGuests() {
    const res = await axios.get('http://localhost:3000/guests')
    guests.value = res.data
  }
  
  function openNewGuestDialog() {
    isEditing.value = false
    editForm.id = null
    editForm.name = ''
    editForm.phone = ''
    editForm.notes = ''
    dialogVisible.value = true
  }
  
  function openEditGuestDialog(guest) {
    isEditing.value = true
    editForm.id = guest.id
    editForm.name = guest.name
    editForm.phone = guest.phone
    editForm.notes = guest.notes
    dialogVisible.value = true
  }
  
  async function saveGuest() {
    try {
      if (isEditing.value) {
        await axios.put(`http://localhost:3000/guests/${editForm.id}`, editForm, {
          headers: { 'Content-Type': 'application/json' }
        })
        ElMessage.success('租客更新成功！')
      } else {
        await axios.post('http://localhost:3000/guests', editForm, {
          headers: { 'Content-Type': 'application/json' }
        })
        ElMessage.success('新增租客成功！')
      }
      dialogVisible.value = false
      await loadGuests()
    } catch (error) {
      console.error(error)
      ElMessage.error('保存失败！')
    }
  }
  
  async function deleteGuest(id) {
    try {
      await ElMessageBox.confirm('确认要删除这个租客吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await axios.delete(`http://localhost:3000/guests/${id}`)
      ElMessage.success('删除成功！')
      await loadGuests()
    } catch (error) {
      if (error !== 'cancel') {
        console.error(error)
        ElMessage.error('删除失败！')
      }
    }
  }


  import * as XLSX from 'xlsx'

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    let rows = XLSX.utils.sheet_to_json(firstSheet)

    if (!rows.length) {
      ElMessage.error('上传的文件没有有效数据！')
      return
    }

    // 🌟 智能表头映射
    rows = rows.map(row => {
      const mapped = {}
      for (const key in row) {
        const lowerKey = key.trim().toLowerCase()
        if (['name', '姓名'].includes(lowerKey)) mapped.name = row[key]
        if (['phone', '电话', '手机号'].includes(lowerKey)) mapped.phone = row[key]
        if (['notes', '备注'].includes(lowerKey)) mapped.notes = row[key]
      }
      return mapped
    })

    const validRows = rows.filter(r => r.name)
    if (!validRows.length) {
      ElMessage.error('找不到任何有效的租客数据，请确认表格格式！')
      return
    }

    // 🌟 先把数据库里现有的 guests 拉下来做去重对比
    const res = await axios.get('http://localhost:3000/guests')
    const existingGuests = res.data

    let newCount = 0
    let updateCount = 0

    // 🌟 遍历要导入的每一个租客
    for (const guest of validRows) {
      const existing = existingGuests.find(g => g.name.trim() === guest.name.trim())
      if (existing) {
        // 已存在，执行更新
        await axios.put(`http://localhost:3000/guests/${existing.id}`, {
          name: guest.name || '',
          phone: guest.phone || '',
          notes: guest.notes || ''
        })
        updateCount++
      } else {
        // 不存在，执行新增
        await axios.post('http://localhost:3000/guests', {
          name: guest.name || '',
          phone: guest.phone || '',
          notes: guest.notes || ''
        })
        newCount++
      }
    }

    ElMessage.success(`导入完成：新增 ${newCount} 位，更新 ${updateCount} 位租客！`)
    await loadData()
  }

  reader.readAsArrayBuffer(file)
}


  </script>
  