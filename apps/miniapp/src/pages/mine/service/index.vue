<template>
  <view class="page">
    <!-- TODO: 可改为 button open-type="contact" 进入微信客服会话；需小程序绑定客服 -->
    <view class="hint">客服入口待配置</view>
  </view>
</template>

<script setup lang="ts">
// TODO: 与模板一致 — `button open-type="contact"`、小程序后台绑定客服；或保留自定义客服入口并接网页客服 URL
</script>

<style scoped lang="scss">
.page {
  min-height: 100%;
  background-color: #f7f7f7;
  box-sizing: border-box;
  padding: 24rpx;
}

.hint {
  font-size: 28rpx;
  color: #999999;
  text-align: center;
  padding-top: 80rpx;
}
</style>
