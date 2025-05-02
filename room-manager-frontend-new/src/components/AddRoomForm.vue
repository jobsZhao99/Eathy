<template>
  <el-form :model="form" label-width="80px" class="max-w-md p-4 border rounded-lg shadow mb-6">
    <el-form-item label="房间名">
      <el-input v-model="form.name" placeholder="请输入房间名称" />
    </el-form-item>

    <el-form-item label="楼栋">
      <el-select v-model="form.property_id" placeholder="请选择楼栋">
        <el-option
          v-for="property in properties"
          :key="property.id"
          :label="property.name"
          :value="property.id"
        />
      </el-select>
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
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { ElNotification } from 'element-plus'

const emit = defineEmits(['roomAdded'])

const properties = ref([]) // 楼栋列表

const form = reactive({
  name: '',
  property_id: '',  // 现在选择 property id 了
  description: ''
})

const loadProperties = async () => {
  try {
    const res = await axios.get('http://localhost:3000/properties')
    console.log('加载到的楼栋列表', res.data)
    properties.value = res.data
  } catch (error) {
    console.error('加载楼栋失败', error)
  }
}

const submitRoom = async () => {
  if (!form.name || !form.property_id) {
    ElNotification({
      title: '错误',
      message: '请填写完整房间名称并选择楼栋！',
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
    console.error('添加失败', error)
    ElNotification({
      title: '添加失败',
      message: error.message,
      type: 'error'
    })
  }
}

// 页面一加载就拉取楼栋
onMounted(() => {
  loadProperties()
})
</script>
