<template>
  <v-container fluid>
    <v-btn color="secondary" @click="$refs.fileInput.click()">📥 批量导入租客</v-btn>
    <input type="file" ref="fileInput" accept=".xlsx,.xls,.csv" class="hidden" @change="handleImportBookingExcel" />
    <v-toolbar flat>
      <v-btn text @click="prevMonth">⬅️ 上个月</v-btn>
      <v-toolbar-title>房态日历{{ currentMonthLabel }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openNewBookingDialog">➕ 新增入住</v-btn>
      <v-btn text @click="nextMonth">➡️ 下个月</v-btn>

    </v-toolbar>
        <!-- 日历展示，可以是表格、卡片、gird随便 -->
        <div>
      当前月份：{{ year }}-{{ month }}
      <!-- 这里后面可以放一个真正的日历组件 -->
    </div>



    <v-simple-table class="elevation-1 mt-4" style="table-layout: fixed; width: 100%;">
      <thead>
        <tr>
          <th class="text-center w-160" style="min-width: 160px">房间</th>
          <th v-for="date in dateRange" :key="date" class="text-center text-xs">
            {{ date.slice(5) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="group in groupedRooms" :key="group.propertyId">
          <!-- 楼栋折叠行 -->
          <tr class="bg-gray-100 font-bold">
            <td colspan="100%" class="px-2 cursor-pointer" @click="collapsedMap[group.propertyId] = !collapsedMap[group.propertyId]">
              <span>{{ collapsedMap[group.propertyId] ? '➕' : '➖' }} {{ group.property.name }}（{{ group.rooms.length }}间）</span>
            </td>
          </tr>

          <!-- 房间数据行 -->
          <tr v-for="room in group.rooms" v-if="!collapsedMap[group.propertyId]" :key="room.id">
            <td class="text-center font-semibold">{{ group.property.name }} - {{ room.name }}</td>
            <td v-for="date in dateRange" :key="date" class="relative h-8 w-10 p-0">
              <!-- booking bar 渲染区域 -->
              <div v-if="isStartOfBooking(room.id, date)" class="absolute top-0 left-0 h-full flex items-center">
                <v-tooltip top>
                  <template #activator="{ props }">
                    <div
                      v-bind="props"
                      :style="getBookingBarStyle(room.id, date)"
                      :class="getBookingBarClass(room.id, date)"
                      class="rounded cursor-pointer h-full px-1 overflow-hidden whitespace-nowrap text-xs flex items-center"
                      @click="openBookingDetail(room.id, date)"
                    >
                      {{ getGuestName(room.id, date) }}
                    </div>
                  </template>
                  <span>{{ getGuestName(room.id, date) }}</span>
                </v-tooltip>
              </div>
            </td>
          </tr>
        </template>
      </tbody>


    </v-simple-table>

    <!-- 新增/编辑入住 Dialog -->
    <v-dialog v-model="dialogVisible" max-width="500">
      <v-card>
        <v-card-title>{{ isEditing ? '编辑入住' : '新增入住' }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="editForm.guest_id"
            :items="guestOptions"
            item-title="name"
            item-value="id"
            label="租客"
            outlined dense
          />
          <v-select
            v-model="editForm.room_id"
            :items="roomOptions"
            item-title="name"
            item-value="id"
            label="房间"
            outlined dense
          />
          
        <!-- 入住时间选择 -->
        <v-menu
          v-model="checkInMenu"
          :close-on-content-click="false"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="editForm.check_in"
              label="入住时间"
              readonly
              outlined
              dense
            />
          </template>
          <v-date-picker
            v-model="editForm.check_in"
            @update:model-value="checkInMenu = false"
          />
        </v-menu>


        <!-- 搬出时间选择 -->
        <v-menu
          v-model="checkOutMenu"
          :close-on-content-click="false"
          offset-y
          transition="scale-transition"
        >
          <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="editForm.check_out"
              label="搬出时间"
              readonly
              outlined
              dense
            />
          </template>
          <v-date-picker
            v-model="editForm.check_out"
            @update:model-value="checkOutMenu = false"
          />
        </v-menu>

        <!-- Confirmed Date -->
        <v-menu v-model="confirmedDateMenu" 
          :close-on-content-click="false" 
          offset-y
          transition="scale-transition"
        >
          
          <!-- <template #activator="{ on, attrs }">
            <v-text-field
              v-model="editForm.confirmed_date"
              label="Confirmed Date"
              readonly
              v-bind="attrs"
              v-on="on"
              outlined dense
            /> -->
            <template #activator="{ props }">
            <v-text-field
              v-bind="props"
              v-model="editForm.confirmation_date"
              label="Confirmed Date"
              readonly
              outlined
              dense
            />
          </template>
          <v-date-picker v-model="editForm.confirmed_date" @update:model-value="confirmedDateMenu = false" />
        </v-menu>


        <!-- 其他字段 -->
        <v-text-field v-model="editForm.confirmation_code" label="确认码" outlined dense />
        <v-text-field v-model="editForm.night" label="夜数" type="number" outlined dense />
        <v-text-field v-model="editForm.sum_days" label="总天数" type="number" outlined dense />
        <v-text-field v-model="editForm.net_rate" label="净房价 ($)" type="number" outlined dense />
        <v-text-field v-model="editForm.daily_rent" label="日租金 ($)" type="number" outlined dense />
        <v-text-field v-model="editForm.total_rent" label="总租金 ($)" type="number" outlined dense />



          <v-textarea v-model="editForm.notes" label="备注" outlined dense />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="dialogVisible = false">取消</v-btn>
          <v-btn text color="error" @click="deleteBooking" v-if="editForm.id">删除</v-btn>
          <v-btn color="primary" text @click="saveBooking">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted,computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'


// 数据
const rooms = ref([])
const guests = ref([])
const bookings = ref([])
const dateRange = ref([])
const collapsedMap = reactive({})

// 当前显示的年月
const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)  // JavaScript 月份从0开始，所以+1

// 上一个月
async function prevMonth() {
  if (month.value === 1) {
    year.value--
    month.value = 12
  } else {
    month.value--
    await loadData()

  }
}

// 下一个月
async function nextMonth() {
  if (month.value === 12) {
    year.value++
    month.value = 1
  } else {
    month.value++
    await loadData()

  }
}


function getPropertyName(propertyId) {
  const property = properties.value?.find(p => p.id === propertyId)
  return property?.name || '未知楼栋'
}

// 月份标题格式
const currentMonthLabel = computed(() => {
  return `${year.value}年${month.value.toString().padStart(2, '0')}月`
  
})

// 弹窗控制
const dialogVisible = ref(false)
const isEditing = ref(false)
const editForm = reactive({
  id: null,
  guest_id: '',
  room_id: '',
  check_in: '',
  check_out: '',
  notes: '',
  confirmed_date: '',
  confirmation_code: '',
  night: '',
  sum_days: '',
  net_rate: '',
  total_rent: '',
  daily_rent: ''
})


const checkInMenu = ref(false)
const checkOutMenu = ref(false)
const confirmedDateMenu = ref(false)

onMounted(async () => {
  await loadData()
})
const properties = ref([])

async function loadData() {

  const resProps = await axios.get('http://localhost:3000/properties')
  properties.value = resProps.data

  const firstDay = new Date(year.value, month.value - 1, 1) // JavaScript 月份从0开始，所以-1
  const lastDay = new Date(year.value,month.value,0)
  // end.setDate(today.getDate() + 30)
  dateRange.value = getDatesInRange(firstDay, lastDay)

  const resRooms = await axios.get('http://localhost:3000/rooms')
  const resGuests = await axios.get('http://localhost:3000/guests')
  const resBookings = await axios.get('http://localhost:3000/bookings')

  rooms.value = resRooms.data
  guests.value = resGuests.data
  bookings.value = resBookings.data




}

function getDatesInRange(start, end) {
  const dates = []
  let current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current).toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// 查某天某房间有没有入住
function getBookingForRoom(roomId, date) {
  return bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out
  )
}

// 根据 guest_id 找租客名字
function getGuestName(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (!booking) return ''
  const guest = guests.value.find(g => g.id === booking.guest_id)
  return guest ? guest.name : ''
}


// 判断当天是不是入住开始
function isStartOfBooking(roomId, date) {
  return bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out &&
    isSameDay(new Date(date), getEffectiveStartDate(b))
  )
}

function getEffectiveStartDate(booking) {
  const checkIn = new Date(booking.check_in)
  const calendarStart = new Date(dateRange.value[0])
  return checkIn > calendarStart ? checkIn : calendarStart
}


// 渲染条的宽度（根据入住天数）
function getBookingBarStyle(roomId, date) {
  const booking = bookings.value.find(b =>
    b.room_id === roomId &&
    date >= b.check_in &&
    date < b.check_out &&
    isSameDay(new Date(date), getEffectiveStartDate(b))
  )
  if (!booking) return {}

  const start = getEffectiveStartDate(booking)
  const checkOut = new Date(booking.check_out)
  const calendarEnd = new Date(dateRange.value[dateRange.value.length - 1])

  const end = checkOut > calendarEnd ? calendarEnd : checkOut
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))

  return {
    width: `${days * 40}px`
  }
}



// // 渲染 booking 的条宽度
// function getBookingBarStyle(roomId, date) {
//   const booking = getBookingForRoom(roomId, date)
//   if (!booking) return {}
//   const checkIn = new Date(booking.check_in)
//   const checkOut = new Date(booking.check_out)
//   const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
//   return {
//     width: `${days * 40}px`
//   }
// }

// 渲染 booking 的条颜色
function getBookingBarClass(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (!booking) return ''
  const today = new Date()
  if (isSameDay(today, new Date(booking.check_in))) {
    return 'bg-blue-lighten-2'
  }
  return 'bg-green-lighten-2'
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

// 点击条条弹出编辑
function openBookingDetail(roomId, date) {
  const booking = getBookingForRoom(roomId, date)
  if (booking) {
    isEditing.value = true
    editForm.id = booking.id
    editForm.room_id = booking.room_id
    editForm.guest_id = booking.guest_id
    editForm.check_in = booking.check_in
    editForm.check_out = booking.check_out
    editForm.notes = booking.notes
    dialogVisible.value = true
  }
}

// 新增入住
function openNewBookingDialog() {
  isEditing.value = false
  editForm.id = null
  editForm.room_id = ''
  editForm.guest_id = ''
  editForm.check_in = ''
  editForm.check_out = ''
  editForm.notes = ''
  dialogVisible.value = true
}

// 保存入住
async function saveBooking() {
  try {
    if (isEditing.value) {
      await axios.put(`http://localhost:3000/bookings/${editForm.id}`, editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('修改成功！')
    } else {
      await axios.post(`http://localhost:3000/bookings`, editForm, {
        headers: { 'Content-Type': 'application/json' }
      })
      ElMessage.success('新增成功！')
    }
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error('保存失败的错误信息：', error.response ? error.response.data : error)
    ElMessage.error('保存失败！请检查填写信息或服务器响应')
  }
}

// 删除入住
async function deleteBooking() {
  try {
    if (!editForm.id) return
    const confirm = window.confirm('确定要删除这条入住记录吗？')
    if (!confirm) return

    await axios.delete(`http://localhost:3000/bookings/${editForm.id}`)
    ElMessage.success('删除成功！')
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败！')
  }
}

// 租客选项
const guestOptions = guests
// 房间选项
const roomOptions = rooms


import { watch } from 'vue'

// 自动计算 Night 和 Sum Days
watch([() => editForm.check_in, () => editForm.check_out], ([moveIn, moveOut]) => {
  if (moveIn && moveOut) {
    const inDate = new Date(moveIn)
    const outDate = new Date(moveOut)
    const diffMs = outDate - inDate
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays >= 0) {
      editForm.night = diffDays
      editForm.sum_days = diffDays + 1
    } else {
      editForm.night = 0
      editForm.sum_days = 0
    }
  }
})


const handleImportBookingExcel = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    let  rows = XLSX.utils.sheet_to_json(sheet)
    rows = rows.map(row => {
      return {
        ...row,
        check_in: isExcelDate(row['Move in']) ? excelDateToString(row['Move in']) : row['Move in'],
        check_out: isExcelDate(row['Move out']) ? excelDateToString(row['Move out']) : row['Move out'],
        confirmed_date: isExcelDate(row['Confirmed date']) ? excelDateToString(row['Confirmed date']) : row['Confirmed date'],
        confirmation_code: row['Confirmation Code'],
        // 其他字段也照常保留
      }
    })
    const [resGuests, resRooms, resProperties, resUnits] = await Promise.all([
      axios.get('http://localhost:3000/guests'),
      axios.get('http://localhost:3000/rooms'),
      axios.get('http://localhost:3000/properties'),
      axios.get('http://localhost:3000/units'),
    ])

    const guests = resGuests.data
    const rooms = resRooms.data
    const properties = resProperties.data
    const units = resUnits.data

    let success = 0, skipped = 0

    for (const row of rows) {
      const guestName = row['Name']?.toString().trim()
      const propertyName = row['Property']?.toString().trim()
      const unitName = row['Unit']?.toString().trim()
      const roomName = row['Room']?.toString().trim()

      if (!guestName || !propertyName || !roomName) {
        skipped++
        continue
      }

      // 查找 guest
      const guest = guests.find(g => g.name.replace(/\s+/g, '').toLowerCase() === guestName.replace(/\s+/g, '').toLowerCase())
      if (!guest) {
        console.warn(`⚠️ Guest 不存在：${guestName}`)
        skipped++
        continue
      }

      // 查找 property
      const property = properties.find(p => p.address === propertyName)
      if (!property) {
        console.warn(`⚠️ Property 不存在：${propertyName}`)
        skipped++
        continue
      }

      // 查找 unit
      let unit_id = null
      if (unitName) {
        const unit = units.find(u => u.name === unitName && u.property_id === property.id)
        if (!unit) {
          console.warn(`⚠️ Unit 不存在：${unitName} under ${propertyName}`)
          skipped++
          continue
        }
        unit_id = unit.id
      }

      // 查找 room
      const room = rooms.find(r =>
        r.name === roomName &&
        r.property_id === property.id &&
        (unit_id === null || r.unit_id === unit_id)
      )
      if (!room) {
        console.warn(`⚠️ Room 不存在：${roomName} (${propertyName} / ${unitName || '无单元'})`)
        skipped++
        continue
      }
      // // 检查 confirmation_code 是否已存在
      // const code = row['Confirmation Code']?.toString().trim()
      // if (!code) {
      //   console.warn(`⚠️ 缺少 confirmation code，跳过：${guestName}, ${roomName}`)
      //   skipped++
      //   continue
      // }
      // const isDuplicate = bookings.value.find(b => b.confirmation_code === code)
      // if (isDuplicate) {
      //   console.warn(`⚠️ 重复的 confirmation_code: ${code}，跳过导入`)
      //   skipped++
      //   continue
      // }

      // 构建 booking 数据
      const bookingPayload = {
        guest_id: guest.id,
        room_id: room.id,
        check_in: row['Move in'] || '',
        check_out: row['Move out'] || '',
        confirmed_date: row['Confirmed date'] || '',
        confirmation_code: row['Confirmation Code'] || '',
        night: Number(row['night']) || 0,
        sum_days: Number(row['sum days']) || 0,
        net_rate: Number(row['Net Rate']) || 0,
        total_rent: Number(row['Total Rent']) || 0,
        daily_rent: Number(row['daily rent']) || 0,
        notes: ''
      }

      try {
        await axios.post('http://localhost:3000/bookings', bookingPayload)
        success++
      } catch (err) {
        console.error('❌ Booking 导入失败:', bookingPayload, err)
        skipped++
      }
    }

    ElMessage.success(`导入完成！成功 ${success} 条，跳过 ${skipped} 条`)
  }

  reader.readAsArrayBuffer(file)
}

// 批量导入房间

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)

    for (const row of rows) {
      const propertyAddr = row['Property']?.toString().trim()
      // const unitName = row['Unit']?.toString().trim()
      // const roomName = row['Room']?.toString().trim()

      // if (!propertyAddr || !roomName) continue
      if (!propertyAddr) continue
      // 1️⃣ 查找或创建 property
      const propertyName = propertyAddr.split(' ')[0]
      let propertyRes = await axios.get(`http://localhost:3000/properties`)
      let existingProp = propertyRes.data.find(p => p.address === propertyAddr)
      let property_id = null

      if (!existingProp) {
        const created = await axios.post(`http://localhost:3000/properties`, {
          name: propertyName,
          address: propertyAddr
        })
        property_id = created.data.id
      } else {
        property_id = existingProp.id
      }

      // // 2️⃣ 查找或创建 unit（如果有）
      // let unit_id = null
      // if (unitName) {
      //   const unitRes = await axios.get(`http://localhost:3000/units`)
      //   let existingUnit = unitRes.data.find(u => u.name === unitName && u.property_id === property_id)
      //   if (!existingUnit) {
      //     const newUnit = await axios.post(`http://localhost:3000/units`, {
      //       name: unitName,
      //       property_id
      //     })
      //     unit_id = newUnit.data.id
      //   } else {
      //     unit_id = existingUnit.id
      //   }
      // }

      // // 3️⃣ 查找或创建 room
      // const roomRes = await axios.get(`http://localhost:3000/rooms`)
      // let existingRoom = roomRes.data.find(r =>
      //   r.name === roomName &&
      //   r.property_id === property_id &&
      //   (!unitName || r.unit_id === unit_id)
      // )

      // if (!existingRoom) {
      //   await axios.post(`http://localhost:3000/rooms`, {
      //     name: roomName,
      //     property_id,
      //     unit_id
      //   })
      //   console.log(`✅ Room ${roomName} 导入成功`)
      // } else {
      //   console.log(`⏩ Room ${roomName} 已存在，跳过`)
      // }
    }

    ElMessage.success('导入完成！')
  }

  reader.readAsArrayBuffer(file)
}

function excelDateToString(serial) {
  const utc_days = Math.floor(serial - 25569) // Excel起始日为1900-01-01
  const utc_value = utc_days * 86400 // 转换为秒
  const date_info = new Date(utc_value * 1000)
  return date_info.toISOString().slice(0, 10)
}
function isExcelDate(val) {
  return typeof val === 'number' && val > 40 && val < 60000 // 粗略判断
}



const groupedRooms = computed(() => {
  const map = {}

  for (const room of rooms.value) {
    const propId = room.property_id
    if (!map[propId]) {
      const property = properties.value.find(p => p.id === propId)
      map[propId] = {
        property,
        rooms: []
      }
      // 初始化展开状态
      if (!(propId in collapsedMap)) collapsedMap[propId] = false
    }
    map[propId].rooms.push(room)
  }

  // 对每组房间排序
  for (const group of Object.values(map)) {
    group.rooms.sort((a, b) => a.name.localeCompare(b.name))
  }

  return Object.entries(map).map(([id, group]) => ({
    ...group,
    propertyId: id,
    collapsed: collapsedMap[id]
  }))
})


</script>
