<template>
  <el-form :model="form" label-width="80px" class="max-w-md p-4 border rounded-lg shadow mb-6">
    <el-form-item label="租客姓名">
      <el-input v-model="form.guest_name" placeholder="请输入租客名" />
    </el-form-item>

    <el-form-item label="选择房间">
      <el-select v-model="form.room_id" placeholder="请选择房间" style="width: 100%;">
        <el-option
          v-for="room in rooms"
          :key="room.id"
          :label="room.name"
          :value="room.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="入住时间">
      <el-date-picker v-model="form.check_in" type="date" placeholder="选择入住日期" style="width: 100%;" />
    </el-form-item>

    <el-form-item label="搬出时间">
      <el-date-picker v-model="form.check_out" type="date" placeholder="选择搬出日期" style="width: 100%;" />
    </el-form-item>

    <el-form-item label="备注">
      <el-input v-model="form.notes" placeholder="可填写备注信息" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitBooking">提交预订</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { ElNotification } from 'element-plus'

const emit = defineEmits(['submitted'])

const form = reactive({
  guest_name: '',
  room_id: null,
  check_in: '',
  check_out: '',
  notes: ''
})

const rooms = ref([])

const loadRooms = async () => {
  const res = await axios.get('http://localhost:3000/rooms')
  rooms.value = res.data
}

onMounted(loadRooms)

const submitBooking = async () => {
  if (!form.guest_name || !form.room_id || !form.check_in || !form.check_out) {
    ElNotification({
      title: '错误',
      message: '请填写完整信息！',
      type: 'error'
    })
    return
  }

  try {
    await axios.post('http://localhost:3000/bookings', form)
    ElNotification({
      title: '成功',
      message: '预订信息提交成功！',
      type: 'success'
    })
    Object.keys(form).forEach(key => (form[key] = key === 'room_id' ? null : ''))
    emit('submitted')
  } catch (error) {
    ElNotification({
      title: '提交失败',
      message: error.message,
      type: 'error'
    })
  }
}



</script>
