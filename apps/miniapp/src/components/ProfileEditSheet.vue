<template>
  <view
    v-if="visible"
    class="mask"
    @tap="onMaskTap"
  >
    <view class="panel" @tap.stop>
      <view class="hdr">
        <view class="hdr-side">
          <text
            v-if="subView === 'phone'"
            class="hdr-back"
            @tap="backToProfile"
          >‹</text>
        </view>
        <text class="hdr-title">{{ subView === 'profile' ? '编辑资料' : '更换手机号' }}</text>
        <view class="hdr-side" />
      </view>

      <view class="body">
        <view v-if="subView === 'profile'" class="body-inner body-inner--profile">
          <view class="avatar-block">
            <button
              class="avatar-btn"
              plain
              open-type="chooseAvatar"
              :disabled="avatarUploading"
              @chooseavatar="onChooseAvatar"
            >
              <image
                v-if="avatarResolved"
                class="avatar-img"
                :src="avatarResolved"
                mode="aspectFill"
              />
              <view v-else class="avatar-ph">
                <text class="avatar-ph-text">{{ avatarUploading ? '上传中…' : '点击设置头像' }}</text>
              </view>
            </button>
          </view>

          <view class="field">
            <text class="field-label">昵称</text>
            <input
              class="field-input"
              type="nickname"
              maxlength="32"
              placeholder="请输入昵称"
              :value="nicknameDraft"
              @input="onNicknameInput"
            />
          </view>

          <view class="field">
            <text class="field-label">手机号</text>
            <view class="phone-tap-row" @tap="goPhone">
              <text class="field-value">{{ phoneMasked }}</text>
              <text class="field-arrow">›</text>
            </view>
          </view>

          <button class="btn btn-primary" :disabled="saving" @tap="onSaveProfile">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </view>

        <view v-else class="body-inner body-inner--phone">
          <text class="phone-hint">
            使用微信「手机号实时验证」绑定新号码，服务端通过 code 换取手机号（与登录接口一致）。按微信规则计费；需非个人主体且已认证的小程序。
          </text>
          <button
            class="btn btn-primary btn-realtime"
            plain
            open-type="getRealtimePhoneNumber"
            :disabled="loading"
            @getrealtimephonenumber="onRealtimePhoneBind"
          >
            {{ loading ? '处理中…' : '微信验证并更换' }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { updateProfile, uploadAvatarFromTempPath } from '../api/auth'
import { resolveMediaUrl } from '../config'
import { maskPhone } from '../utils/mask-phone'
import { useUserStore } from '../stores/user'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [boolean] }>()

const userStore = useUserStore()
const { phone, profileNickname, avatarUrl, loading } = storeToRefs(userStore)

const subView = ref<'profile' | 'phone'>('profile')
const nicknameDraft = ref('')
const saving = ref(false)
const avatarUploading = ref(false)

const avatarResolved = computed(() => resolveMediaUrl(avatarUrl.value))
const phoneMasked = computed(() => (phone.value ? maskPhone(phone.value) : '—'))

function close() {
  emit('update:visible', false)
}

function onMaskTap() {
  close()
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      subView.value = 'profile'
      nicknameDraft.value = profileNickname.value
    }
    else {
      subView.value = 'profile'
    }
  },
)

function backToProfile() {
  subView.value = 'profile'
}

function goPhone() {
  subView.value = 'phone'
}

function onNicknameInput(e: { detail?: { value?: string } }) {
  nicknameDraft.value = (e.detail?.value ?? '').slice(0, 32)
}

async function onRealtimePhoneBind(e: { detail?: { errMsg?: string; code?: string; errno?: number } }) {
  const ok = await userStore.handleRealtimePhoneBindDetail(e.detail ?? {})
  if (ok)
    subView.value = 'profile'
}

async function onChooseAvatar(e: { detail?: { avatarUrl?: string } }) {
  const path = e.detail?.avatarUrl
  if (!path)
    return
  avatarUploading.value = true
  try {
    const url = await uploadAvatarFromTempPath(path)
    await updateProfile({ avatarUrl: url })
    await userStore.loadProfile()
    uni.showToast({ title: '头像已更新', icon: 'success' })
  }
  catch (err) {
    console.error(err)
    uni.showToast({ title: '头像上传失败', icon: 'none' })
  }
  finally {
    avatarUploading.value = false
  }
}

async function onSaveProfile() {
  const name = nicknameDraft.value.trim()
  saving.value = true
  try {
    await updateProfile({ nickname: name })
    await userStore.loadProfile()
    uni.showToast({ title: '已保存', icon: 'success' })
    close()
  }
  catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败'
    uni.showToast({ title: msg, icon: 'none' })
  }
  finally {
    saving.value = false
  }
}

</script>

<style scoped lang="scss">
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1001;
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
  padding: 0 32rpx 32rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.hdr {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  flex-shrink: 0;
}

.hdr-side {
  width: 72rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.hdr-back {
  font-size: 56rpx;
  line-height: 1;
  color: #333333;
  padding: 8rpx 16rpx 8rpx 0;
}

.hdr-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.body {
  display: flex;
  flex-direction: column;
}

.body-inner {
  display: flex;
  flex-direction: column;
}

.avatar-block {
  display: flex;
  justify-content: center;
  margin-bottom: 32rpx;
}

.avatar-btn {
  padding: 0;
  margin: 0;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  overflow: hidden;
  border: none;
  background-color: transparent;
}

.avatar-btn::after {
  border: none;
}

.avatar-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: block;
}

.avatar-ph {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 2rpx solid #eeeeee;
}

.avatar-ph-text {
  font-size: 22rpx;
  color: #999999;
  text-align: center;
  padding: 0 12rpx;
}

.field {
  margin-bottom: 24rpx;
}

.field-label {
  display: block;
  font-size: 24rpx;
  color: #888888;
  margin-bottom: 12rpx;
}

/** 与昵称输入框同高，仅号码与箭头在框内 */
.phone-tap-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 20rpx;
  background-color: #f6f7fb;
  border-radius: 12rpx;
  border: 2rpx solid #e8ebf2;
  box-sizing: border-box;
}

.field-input {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  background-color: #f6f7fb;
  border: 2rpx solid #e8ebf2;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #333333;
}

.field-value {
  font-size: 30rpx;
  color: #333333;
}

.field-arrow {
  font-size: 36rpx;
  color: #cccccc;
  line-height: 1;
}

.phone-hint {
  display: block;
  font-size: 26rpx;
  color: #888888;
  line-height: 1.55;
  margin-bottom: 8rpx;
}

.body-inner--phone .btn-realtime {
  margin-top: 24rpx;
}

.btn {
  padding: 0;
  margin: 0;
  margin-top: 28rpx;
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

.btn[disabled] {
  opacity: 0.65;
}
</style>
