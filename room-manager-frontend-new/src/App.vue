<template>
  <v-app>
    <!-- 顶部导航 -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>房态管理系统</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-avatar size="32">
          <img src="https://randomuser.me/api/portraits/men/85.jpg" alt="User" />
        </v-avatar>
      </v-btn>
    </v-app-bar>

    <!-- 左侧菜单栏 -->
    <v-navigation-drawer app color="blue-grey lighten-5" permanent>
      <v-list>
        <v-list-item-title class="text-h6 text-center mt-4 mb-2">菜单</v-list-item-title>
        <v-divider></v-divider>
        <v-list-item to="/calendar" link>
          <v-list-item-icon>
            <v-icon>mdi-calendar-month</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>房态日历</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/bookingManager" link>
          <v-list-item-icon>
            <v-icon>mdi-calendar-month</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>订房记录</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/properties" link>
          <v-list-item-icon>
            <v-icon>mdi-building</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>楼栋管理</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        
        <v-list-item to="/units" link>
          <v-list-item-icon>
            <v-icon>mdi-bed</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>单元管理</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/rooms" link>
          <v-list-item-icon>
            <v-icon>mdi-bed</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>房间管理</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item to="/guests" link>
          <v-list-item-icon>
            <v-icon>mdi-account-multiple</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>租客管理</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 主体内容 -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view /> <!-- 这里放子页面，比如房态表 -->
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
// 什么都不用额外引入，Vuetify 组件自动生效
</script>

<style scoped>
.v-application {
  font-family: 'Roboto', sans-serif;
}
</style>
