<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import LoginSheet from './components/LoginSheet.vue'
import { useUserStore } from './stores/user'

/** 不自动登录：仅在有 token 时静默恢复会话 */
onLaunch(async () => {
  const store = useUserStore()
  await store.tryRestoreSession()
})
</script>

<template>
  <LoginSheet />
</template>

<style></style>
