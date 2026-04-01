<template>
  <view
    v-if="loginSheetVisible"
    class="mask"
    @tap="onCancel"
  >
    <view class="panel" @tap.stop>
      <text class="title">登录</text>
      <text class="hint">使用微信授权手机号，完成验证后即可登录</text>
      <button
        class="btn btn-primary"
        open-type="getPhoneNumber"
        :disabled="loading"
        @getphonenumber="onPhoneQuick"
      >
        {{ loading ? '登录中…' : '微信授权手机号登录' }}
      </button>
      <button class="btn btn-ghost" :disabled="loading" @tap="onCancel">
        取消
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const { loginSheetVisible, loading } = storeToRefs(userStore)

function onPhoneQuick(e: { detail?: { errMsg?: string; code?: string } }) {
  void userStore.handlePhoneLoginDetail(e.detail ?? {})
}

function onCancel() {
  userStore.endLoginFlow()
}
</script>

<style scoped lang="scss">
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}

.panel {
  width: 100%;
  max-width: 600rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 32rpx 32rpx;
  box-sizing: border-box;
}

.title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.hint {
  display: block;
  font-size: 26rpx;
  color: #888888;
  line-height: 1.5;
  margin-bottom: 32rpx;
  text-align: center;
}

.btn {
  padding: 0;
  margin: 0 0 20rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  color: #ffffff;
  height: 88rpx;
  line-height: 88rpx;
}

.btn::after {
  border: none;
}

.btn-primary {
  background-color: #3c9cff;
}

.btn-ghost {
  background-color: #f5f5f5;
  color: #666666;
  margin-bottom: 0;
}

.btn[disabled] {
  opacity: 0.65;
}
</style>
