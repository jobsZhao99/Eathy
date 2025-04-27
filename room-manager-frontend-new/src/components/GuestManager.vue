<template>
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
  </script>
  