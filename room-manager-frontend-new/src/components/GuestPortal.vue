<template>
    <v-container fluid>
      <v-toolbar flat>
        <v-btn icon @click="goBack">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <v-toolbar-title>租客详情</v-toolbar-title>
      </v-toolbar>
  
      <v-card class="mt-4 p-4">
        <v-card-title>基本信息</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6" md="4">
              <strong>姓名：</strong> {{ guest.name }}
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <strong>电话：</strong> {{ guest.phone }}
            </v-col>
            <v-col cols="12" sm="6" md="4">
              <strong>备注：</strong> {{ guest.notes }}
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
  
      <v-card class="mt-4 p-4">
        <v-card-title>入住记录</v-card-title>
        <v-data-table
          :headers="bookingHeaders"
          :items="bookings"
          density="compact"
          class="elevation-1 mt-2"
        >
        </v-data-table>
      </v-card>
    </v-container>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from 'axios'
  
  const route = useRoute()
  const router = useRouter()
  const guest = ref({})
  const bookings = ref([])
  
  const bookingHeaders = [
    { text: '房间ID', value: 'room_id' },
    { text: '入住时间', value: 'check_in' },
    { text: '搬出时间', value: 'check_out' },
    { text: '备注', value: 'notes' }
  ]
  
  onMounted(async () => {
    const guestId = route.params.id
    await loadGuestInfo(guestId)
    await loadGuestBookings(guestId)
  })
  
  async function loadGuestInfo(id) {
    const res = await axios.get(`http://localhost:3000/guests`)
    guest.value = res.data.find(g => g.id === parseInt(id))
  }
  
  async function loadGuestBookings(id) {
    const res = await axios.get(`http://localhost:3000/bookings`)
    bookings.value = res.data.filter(b => b.guest_id === parseInt(id))
  }
  
  function goBack() {
    router.back()
  }
  </script>
  