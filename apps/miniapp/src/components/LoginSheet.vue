<template>
  <view
    v-if="loginSheetVisible"
    class="mask"
    @tap="onCancel"
  >
    <view class="panel" @tap.stop>
      <text class="title">{{ mode === 'select' ? '选择登录方式' : '手机号验证码登录' }}</text>
      <view v-if="mode === 'select'">
        <button
          class="btn btn-primary"
          open-type="getPhoneNumber"
          @getphonenumber="onPhoneQuick"
        >
          手机号快捷登录
        </button>
        <button
          class="btn btn-secondary"
          @tap="onOtherPhone"
        >
          其他手机号登录
        </button>
        <button class="btn btn-ghost" @tap="onCancel">
          取消
        </button>
      </view>
      <view v-else>
        <input
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          :value="phone"
          @input="onPhoneInput"
        />
        <view class="code-row">
          <input
            class="input code-input"
            type="number"
            maxlength="8"
            placeholder="请输入验证码"
            :value="code"
            @input="onCodeInput"
          />
          <button class="send-btn" :disabled="sending || cooldown > 0 || loading" @tap="onSendCode">
            {{ cooldown > 0 ? `${cooldown}s` : '发送验证码' }}
          </button>
        </view>
        <button class="btn btn-primary" :disabled="loading" @tap="onSubmitOtherPhone">
          {{ loading ? '登录中…' : '立即登录' }}
        </button>
        <button class="btn btn-secondary" :disabled="loading" @tap="onBackSelect">
          返回
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const { loginSheetVisible, loading } = storeToRefs(userStore)
const mode = ref<'select' | 'other'>('select')
const phone = ref('')
const code = ref('')
const sending = ref(false)
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function onPhoneQuick(e: { detail?: { errMsg?: string; code?: string } }) {
  void userStore.handlePhoneLoginDetail(e.detail ?? {})
}

function onOtherPhone() {
  mode.value = 'other'
}

function onBackSelect() {
  mode.value = 'select'
}

function onPhoneInput(e: { detail?: { value?: string } }) {
  phone.value = (e.detail?.value || '').replace(/\D/g, '').slice(0, 11)
}

function onCodeInput(e: { detail?: { value?: string } }) {
  code.value = (e.detail?.value || '').replace(/\D/g, '').slice(0, 8)
}

function startCooldown(sec: number) {
  cooldown.value = sec
  if (timer)
    clearInterval(timer)
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function onSendCode() {
  if (sending.value || cooldown.value > 0)
    return
  sending.value = true
  try {
    const ok = await userStore.sendOtherPhoneCode(phone.value)
    if (ok)
      startCooldown(60)
  }
  finally {
    sending.value = false
  }
}

async function onSubmitOtherPhone() {
  await userStore.loginWithOtherPhone(phone.value, code.value)
}

function onCancel() {
  mode.value = 'select'
  userStore.endLoginFlow()
}

onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
})
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
  margin-bottom: 36rpx;
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

.btn-secondary {
  background-color: #ffffff;
  color: #3c9cff;
  border: 2rpx solid #3c9cff;
  line-height: 84rpx;
}

.btn-ghost {
  background-color: #f5f5f5;
  color: #666666;
  margin-bottom: 0;
}

.input {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  background-color: #f6f7fb;
  border: 2rpx solid #e8ebf2;
  margin-bottom: 20rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #333333;
}

.code-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.code-input {
  flex: 1;
  margin-bottom: 0;
}

.send-btn {
  width: 220rpx;
  height: 88rpx;
  line-height: 84rpx;
  border-radius: 12rpx;
  border: 2rpx solid #3c9cff;
  color: #3c9cff;
  background-color: #ffffff;
  font-size: 28rpx;
  padding: 0;
}

.send-btn[disabled] {
  color: #a6b5cc;
  border-color: #d9e0ea;
}

.send-btn::after {
  border: none;
}
</style>
