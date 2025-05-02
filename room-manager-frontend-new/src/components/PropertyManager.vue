<template>
  <el-form :model="form" label-width="80px" class="max-w-md p-4 border rounded-lg shadow mb-6">
    <el-form-item label="楼栋名">
      <el-input v-model="form.name" placeholder="请输入楼栋名称" />
    </el-form-item>

    <el-form-item label="地址">
      <el-autocomplete
        v-model="form.address"
        :fetch-suggestions="querySearchAddress"
        placeholder="请输入楼栋地址"
      >
        <template #prefix>
          <i class="el-icon-location"></i>
        </template>
        <template #empty>
          <div class="text-center">没有找到相关地址</div>
        </template>
      </el-autocomplete>
    </el-form-item>
    <el-form-item label="描述">
      <el-input v-model="form.description" placeholder="请输入描述（可选）" />
    </el-form-item>


    <el-form-item>
      <el-button type="primary" @click="submitProperty">添加楼栋</el-button>
    </el-form-item>
  </el-form>

      <!-- 楼栋列表展示 -->
      <el-table :data="properties" border class="w-full">
      <el-table-column prop="name" label="楼栋名" sortable />
      <el-table-column prop="address" label="地址" sortable />
      <el-table-column prop="description" label="描述" />
      <el-table-column label="操作" width="100">
        <template #default="scope">
          <el-button size="small" @click="openEditDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteProperty(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>


    <el-dialog v-model="dialogVisible" title="编辑楼栋" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="楼栋名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="地址">
          <el-autocomplete
            v-model="editForm.address"
            :fetch-suggestions="querySearchAddress"
            placeholder="请输入楼栋地址"
            clearable
          >
            <template #prefix>
              <i class="el-icon-location"></i>
            </template>
            <template #empty>
              <div class="text-center">没有找到相关地址</div>
            </template>
          </el-autocomplete>
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="editForm.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { ElNotification } from 'element-plus'

// 通知父组件刷新
const emit = defineEmits(['propertyAdded'])

const form = reactive({
  name: '',
  address: '',
  description: ''
})
const properties = ref([]) // 楼栋列表

// 一进页面拉取已有楼栋
const fetchProperties = async () => {
  try {
    const { data } = await axios.get('http://localhost:3000/properties')
    properties.value = data
  } catch (error) {
    console.error('加载楼栋失败', error)
  }
}

// 检测Google Maps API是否加载完成
const isGoogleReady = ref(false)

onMounted(() => {
  if (window.google && window.google.maps && window.google.maps.places) {
    isGoogleReady.value = true
  } else {
    const checkInterval = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        isGoogleReady.value = true
        clearInterval(checkInterval)
      }
    }, 500)
  }
  fetchProperties()
})

// 地址搜索
const querySearchAddress = (queryString, cb) => {
  if (!queryString) {
    cb([])
    return
  }

  if (!isGoogleReady.value) {
    console.error('Google Maps脚本还没加载好！')
    cb([])
    return
  }

  const autocompleteService = new google.maps.places.AutocompleteService()

  autocompleteService.getPlacePredictions(
    {
      input: queryString,
      types: ['address'],
      componentRestrictions: { country: 'us' },
    },
    (predictions, status) => {
      if (status !== 'OK' || !predictions) {
        console.error('Google Places API Error:', status)
        cb([])
        return
      }

      const suggestions = predictions.map(prediction => ({
        value: prediction.description,
      }))
      cb(suggestions)
    }
  )
}

// 提交楼栋
const submitProperty = async () => {
  if (!form.name || !form.address) {
    ElNotification({
      title: '错误',
      message: '请填写完整楼栋名称和地址！',
      type: 'error'
    })
    return
  }

  try {
    await axios.post('http://localhost:3000/properties', form)
    ElNotification({
      title: '成功',
      message: '楼栋添加成功！',
      type: 'success'
    })
    // 清空表单
    Object.keys(form).forEach(key => (form[key] = ''))
    emit('propertyAdded') // 通知父组件刷新
    await fetchProperties() // 添加成功后，刷新楼栋列表
  } catch (error) {
    console.error(error)
    ElNotification({
      title: '添加失败',
      message: error.message,
      type: 'error'
    })
  }
}


const dialogVisible = ref(false)
const editForm = reactive({
  id: null,
  name: '',
  address: '',
  description: ''
})

function openEditDialog(property) {
  Object.assign(editForm, property)
  dialogVisible.value = true
}

async function saveEdit() {
  try {
    await axios.put(`http://localhost:3000/properties/${editForm.id}`, editForm)
    ElNotification.success('楼栋更新成功！')
    dialogVisible.value = false
    await fetchProperties()
  } catch (error) {
    console.error(error)
    ElNotification.error('更新失败')
  }
}

const deleteProperty = async (id) => {
  try {
    await axios.delete(`http://localhost:3000/properties/${id}`)
    ElNotification({
      title: '已删除',
      message: '楼栋已成功删除',
      type: 'success'
    })
    await fetchProperties()
  } catch (error) {
    console.error(error)
    ElNotification({
      title: '删除失败',
      message: error.message,
      type: 'error'
    })
  }
}


</script>
