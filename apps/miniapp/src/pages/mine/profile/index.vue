<template>
  <view class="page" />
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

/** 编辑资料已改为「我的」页弹窗；旧入口跳转回 Tab 并拉起弹窗 */
onLoad(() => {
  uni.setStorageSync('OPEN_PROFILE_EDIT', '1')
  uni.switchTab({ url: '/pages/mine/index' })
})
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f7f7;
}
</style>
