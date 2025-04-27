

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
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="搜索租客"
          single-line
          hide-details
          dense
          class="ml-4"
          style="max-width: 250px"
        />

        <v-btn color="primary" @click="openNewGuestDialog">➕ 新增租客</v-btn>
        <v-btn color="error" @click="batchDeleteGuests" v-if="selectedGuests.length">🗑️ 批量删除({{ selectedGuests.length }})</v-btn>

      </v-toolbar>
      <v-progress-linear
        v-if="isImporting"
        :model-value="importProgress"
        color="primary"
        height="6"
        class="mt-2"
        rounded
        striped
        indeterminate
      ></v-progress-linear>


      <v-progress-linear
        v-if="isDeleting"
        :value="deleteProgress"
        color="red"
        height="6"
        class="mb-4"
        striped
      ></v-progress-linear>

      <v-data-table
        density="default"
        :headers="headers"
        :items="filteredGuests"
        v-model="selectedGuests"
        item-value="id"
        show-select
        class="elevation-1 mt-4"
      >

        <template #item.actions="{ item }">
          <v-btn text @click="viewGuestBookings(item)" color="primary">
    {{ item.name }}
  </v-btn>
          <v-btn size="small" text @click="openEditGuestDialog(item)">编辑</v-btn>
          <!-- <v-btn size="small" text color="error" @click="deleteGuest(item.id)">删除</v-btn> -->
        </template>
      </v-data-table>
      <v-dialog v-model="bookingDialogVisible" max-width="700">
        <v-card>
          <v-card-title>{{ currentGuestName }} 的入住记录</v-card-title>
          <v-card-text>
            <v-simple-table dense>
              <thead>
                <tr>
                  <th>房间ID</th>
                  <th>入住时间</th>
                  <th>搬出时间</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="booking in currentGuestBookings" :key="booking.id">
                  <td>{{ booking.room_id }}</td>
                  <td>{{ booking.check_in }}</td>
                  <td>{{ booking.check_out }}</td>
                  <td>{{ booking.notes }}</td>
                </tr>
                <tr v-if="!currentGuestBookings.length">
                  <td colspan="4" class="text-center text-gray-400">暂无入住记录</td>
                </tr>
              </tbody>
            </v-simple-table>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="bookingDialogVisible = false">关闭</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>


  
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
  import { ref, reactive, computed, onMounted } from 'vue'
  import axios from 'axios'
  import { ElMessage, ElMessageBox } from 'element-plus'
  
  // 租客数据
  const guests = ref([])

  const importProgress = ref(0)  // 导入进度
const deleteProgress = ref(0)  // 删除进度
const isImporting = ref(false)
const isDeleting = ref(false)

  
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
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      let rows = XLSX.utils.sheet_to_json(firstSheet)

      if (!rows.length) {
        ElMessage.error('上传的文件没有有效数据！')
        return
      }

      // 🌟 智能表头映射 + 去空格
      rows = rows.map(row => {
        const mapped = {}
        for (const key in row) {
          const lowerKey = key.trim().toLowerCase()
          if (['name', '姓名'].includes(lowerKey)) mapped.name = (row[key] || '').toString().trim()
          if (['phone', '电话', '手机号'].includes(lowerKey)) mapped.phone = (row[key] || '').toString().trim()
          if (['notes', '备注'].includes(lowerKey)) mapped.notes = (row[key] || '').toString().trim()
        }
        return mapped
      })

      // 🌟 过滤掉名字空白的行
      const validRows = rows.filter(r => r.name)
      if (!validRows.length) {
        ElMessage.error('找不到任何有效租客，请检查表格格式！')
        return
      }

      isImporting.value = true
      importProgress.value = 0

      const res = await axios.get('http://localhost:3000/guests')
      const existingGuests = res.data

      let newCount = 0
      let updateCount = 0

      for (let i = 0; i < validRows.length; i++) {
        const guest = validRows[i]

        // 🌟 比较的时候忽略大小写和空格
        const existing = existingGuests.find(g => g.name.replace(/\s+/g, '').toLowerCase() === guest.name.replace(/\s+/g, '').toLowerCase())

        if (existing) {
          await axios.put(`http://localhost:3000/guests/${existing.id}`, {
            name: guest.name,
            phone: guest.phone,
            notes: guest.notes
          })
          updateCount++
        } else {
          const res = await axios.post('http://localhost:3000/guests', {
            name: guest.name,
            phone: guest.phone,
            notes: guest.notes
          })
          // 🌟 新增成功后，动态加到本地数组，避免后面又新增一次
          existingGuests.push({
            id: res.data.id,
            name: guest.name,
            phone: guest.phone,
            notes: guest.notes
          })
          newCount++
        }

        importProgress.value = Math.round(((i + 1) / validRows.length) * 100)
      }

      ElMessage.success(`导入完成：新增 ${newCount} 位，更新 ${updateCount} 位租客！`)
      await loadGuests()

    } catch (error) {
      console.error('导入异常', error)
      ElMessage.error('导入失败，请检查文件格式或服务器！')
    } finally {
      isImporting.value = false
      importProgress.value = 0
    }
  }

  reader.readAsArrayBuffer(file)
}


const selectedGuests = ref([]) // 勾选中的租客

async function batchDeleteGuests() {
  if (!selectedGuests.value.length) {
    ElMessage.warning('请先选择要删除的租客！')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedGuests.value.length} 位租客吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    isDeleting.value = true
    deleteProgress.value = 0

    for (let i = 0; i < selectedGuests.value.length; i++) {
      const guestId = selectedGuests.value[i].id
      await axios.delete(`http://localhost:3000/guests/${guestId}`)
      deleteProgress.value = Math.round(((i + 1) / selectedGuests.value.length) * 100)
    }

    ElMessage.success(`成功删除了 ${selectedGuests.value.length} 位租客！`)
    selectedGuests.value = [] // 清空选择
    await loadGuests()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('批量删除失败！')
    }
  } finally {
    isDeleting.value = false
    deleteProgress.value = 0
  }
}


function getRowClass(item) {
  const isSelected = selectedGuests.value.some(selected => selected.id === item.id)
  return isSelected ? 'selected-row' : ''
}
const search = ref('') // 搜索关键词

const filteredGuests = computed(() => {
  if (!search.value.trim()) {
    return guests.value
  }
  const keyword = search.value.trim().toLowerCase()
  return guests.value.filter(g => 
    (g.name && g.name.toLowerCase().includes(keyword)) ||
    (g.phone && g.phone.toLowerCase().includes(keyword)) ||
    (g.notes && g.notes.toLowerCase().includes(keyword))
  )
})


const bookingDialogVisible = ref(false)
const currentGuestBookings = ref([])
const currentGuestName = ref('')

async function viewGuestBookings(guest) {
  currentGuestName.value = guest.name
  try {
    const res = await axios.get(`http://localhost:3000/bookings`)  // 这里根据你后端改成支持 guest_id 的话可以优化
    const allBookings = res.data
    currentGuestBookings.value = allBookings.filter(b => b.guest_id === guest.id)
    bookingDialogVisible.value = true
  } catch (error) {
    console.error('加载租客 Booking 失败', error)
    ElMessage.error('加载失败')
  }
}


  </script>
  
