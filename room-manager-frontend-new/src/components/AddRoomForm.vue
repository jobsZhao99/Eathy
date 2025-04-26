<template>
    <el-form :model="form" label-width="80px" class="max-w-md p-4 border rounded-lg shadow mb-6">
      <el-form-item label="房间名">
        <el-input v-model="form.name" placeholder="请输入房间名称" />
      </el-form-item>
  
      <el-form-item label="地址">
        <el-input v-model="form.address" placeholder="请输入房间地址" />
      </el-form-item>
  
      <el-form-item label="描述">
        <el-input v-model="form.description" placeholder="请输入描述，可选" />
      </el-form-item>
  
      <el-form-item>
        <el-button type="primary" @click="submitRoom">添加房间</el-button>
      </el-form-item>
    </el-form>
  </template>
  
  <script setup>
  import { reactive } from 'vue'
  import axios from 'axios'
  import { ElNotification } from 'element-plus'
  
  const emit = defineEmits(['roomAdded'])
  
  const form = reactive({
    name: '',
    address: '',
    description: ''
  })
  
  const submitRoom = async () => {
    if (!form.name || !form.address) {
      ElNotification({
        title: '错误',
        message: '请填写完整房间名称和地址！',
        type: 'error'
      })
      return
    }
  
    try {
      await axios.post('http://localhost:3000/rooms', form)
      ElNotification({
        title: '成功',
        message: '房间添加成功！',
        type: 'success'
      })
      Object.keys(form).forEach(key => (form[key] = ''))
      emit('roomAdded') // 通知父组件刷新
    } catch (error) {
      ElNotification({
        title: '添加失败',
        message: error.message,
        type: 'error'
      })
    }
  }
  </script>
  