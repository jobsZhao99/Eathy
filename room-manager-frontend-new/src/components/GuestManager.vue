<template>
  <v-container fluid>
    <!-- 顶部工具栏 -->
    <v-toolbar flat>
      <v-toolbar-title>租客管理</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn color="secondary" @click="$refs.fileInput.click()">📥 批量导入租客</v-btn>
      <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" class="hidden" @change="handleFileUpload" />

      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="搜索租客"
        single-line hide-details dense
        class="ml-4" style="max-width: 250px"
      />

      <v-btn color="primary" @click="openNewGuestDialog">➕ 新增租客</v-btn>
      <v-btn color="error" v-if="selectedGuests.length" @click="batchDeleteGuests">🗑️ 批量删除 ({{ selectedGuests.length }})</v-btn>
    </v-toolbar>

    <!-- 导入进度条 -->
    <v-progress-linear
      v-if="isImporting"
      :model-value="importProgress"
      color="primary"
      height="6"
      class="mt-2"
      rounded striped indeterminate
    ></v-progress-linear>

    <!-- 删除进度条 -->
    <v-progress-linear
      v-if="isDeleting"
      :value="deleteProgress"
      color="red"
      height="6"
      class="mb-4"
      striped
    ></v-progress-linear>

    <!-- 租客列表 -->
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
        <v-btn size="small" text @click="goToGuestPortal(item)">详情</v-btn>
        <v-btn size="small" text @click="openEditGuestDialog(item)">编辑</v-btn>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'

// 路由
const router = useRouter()

// 基本数据
const guests = ref([])
const selectedGuests = ref([])

// 搜索
const search = ref('')
const filteredGuests = computed(() => {
  if (!search.value.trim()) return guests.value
  const keyword = search.value.trim().toLowerCase()
  return guests.value.filter(g =>
    (g.name && g.name.toLowerCase().includes(keyword)) ||
    (g.phone && g.phone.toLowerCase().includes(keyword)) ||
    (g.notes && g.notes.toLowerCase().includes(keyword))
  )
})

// 表头
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

// 进度条控制
const importProgress = ref(0)
const deleteProgress = ref(0)
const isImporting = ref(false)
const isDeleting = ref(false)

// 页面加载
onMounted(() => {
  loadGuests()
})

// 加载租客数据
async function loadGuests() {
  const res = await axios.get('http://localhost:3000/guests')
  guests.value = res.data
}

// 打开新增弹窗
function openNewGuestDialog() {
  isEditing.value = false
  Object.assign(editForm, { id: null, name: '', phone: '', notes: '' })
  dialogVisible.value = true
}

// 打开编辑弹窗
function openEditGuestDialog(guest) {
  isEditing.value = true
  Object.assign(editForm, guest)
  dialogVisible.value = true
}

// 保存租客
async function saveGuest() {
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/guests/${editForm.id}`, editForm)
      ElMessage.success('租客更新成功！')
    } else {
      await axios.post('http://localhost:3000/guests', editForm)
      ElMessage.success('新增租客成功！')
    }
    dialogVisible.value = false
    await loadGuests()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败！')
  }
}

// 单个删除租客
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

// 批量删除租客
async function batchDeleteGuests() {
  if (!selectedGuests.value.length) {
    ElMessage.warning('请先选择要删除的租客！')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedGuests.value.length} 位租客吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    isDeleting.value = true
    deleteProgress.value = 0

    for (let i = 0; i < selectedGuests.value.length; i++) {
      const guestId = selectedGuests.value[i].id
      await axios.delete(`http://localhost:3000/guests/${guestId}`)
      deleteProgress.value = Math.round(((i + 1) / selectedGuests.value.length) * 100)
    }

    ElMessage.success(`成功删除了 ${selectedGuests.value.length} 位租客！`)
    selectedGuests.value = []
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

// 批量导入租客
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

      // 处理列名
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
        const existing = existingGuests.find(g => g.name.replace(/\s+/g, '').toLowerCase() === guest.name.replace(/\s+/g, '').toLowerCase())

        if (existing) {
          await axios.put(`http://localhost:3000/guests/${existing.id}`, guest)
          updateCount++
        } else {
          const res = await axios.post('http://localhost:3000/guests', guest)
          existingGuests.push({ id: res.data.id, ...guest })
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

// 跳转到 Guest Portal
function goToGuestPortal(guest) {
  router.push(`/guest/${guest.id}`)
}
</script>

<style scoped>
.hidden {
  display: none;
}
</style>
