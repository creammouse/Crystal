<template>
  <scroll-view class="page" scroll-y :show-scrollbar="false">
    <view class="page-inner">
      <view class="hint">
        微信要求使用「选择头像」与「昵称输入框」填写资料；保存后会同步到你的账号。
      </view>

      <view class="card">
        <text class="label">头像</text>
        <button
          class="avatar-btn"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
        >
          <image
            v-if="previewAvatar"
            class="avatar"
            :src="previewAvatar"
            mode="aspectFill"
          />
          <view v-else class="avatar avatar--placeholder">
            <text class="placeholder-text">点击选择头像</text>
          </view>
        </button>
      </view>

      <view class="card">
        <text class="label">昵称</text>
        <input
          class="nick-input"
          type="nickname"
          :value="draftNick"
          placeholder="请输入昵称"
          @input="onInputNick"
        />
      </view>

      <button class="save-btn" @tap="onSave">
        保存
      </button>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { resolveMediaUrl } from '../../../config'
import { updateProfile, uploadAvatarFromTempPath } from '../../../api/auth'
import { useUserStore } from '../../../stores/user'

const userStore = useUserStore()
const draftNick = ref('')
const serverAvatarPath = ref('')

const previewAvatar = computed(() =>
  resolveMediaUrl(serverAvatarPath.value || undefined),
)

onLoad(() => {
  draftNick.value
    = userStore.nickname === '微信用户' || userStore.nickname === '未登录'
      ? ''
      : userStore.nickname
  serverAvatarPath.value = userStore.avatarUrl
})

function onInputNick(e: { detail?: { value?: string } }) {
  draftNick.value = (e.detail?.value || '') as string
}

async function onChooseAvatar(e: { detail?: { avatarUrl?: string } }) {
  const path = e.detail?.avatarUrl
  if (!path)
    return
  uni.showLoading({ title: '上传中' })
  try {
    const rel = await uploadAvatarFromTempPath(path)
    serverAvatarPath.value = rel
  }
  catch (err) {
    console.error(err)
    uni.showToast({ title: '头像上传失败', icon: 'none' })
  }
  finally {
    uni.hideLoading()
  }
}

async function onSave() {
  const nick = draftNick.value.trim() || '微信用户'
  uni.showLoading({ title: '保存中' })
  try {
    await updateProfile({
      nickname: nick,
      ...(serverAvatarPath.value ? { avatarUrl: serverAvatarPath.value } : {}),
    })
    await userStore.loadProfile()
    uni.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 400)
  }
  catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
  finally {
    uni.hideLoading()
  }
}
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.page-inner {
  padding: 24rpx;
}

.hint {
  font-size: 24rpx;
  color: #888888;
  line-height: 1.5;
  margin-bottom: 24rpx;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 20rpx;
  font-weight: 600;
}

.avatar-btn {
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  line-height: normal;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-btn::after {
  border: none;
}

.avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: block;
  background-color: #e8e8e8;
}

.avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #cccccc;
  box-sizing: border-box;
}

.placeholder-text {
  font-size: 24rpx;
  color: #999999;
  padding: 0 12rpx;
  text-align: center;
}

.nick-input {
  height: 80rpx;
  padding: 0 20rpx;
  border-radius: 12rpx;
  background-color: #f5f5f5;
  font-size: 30rpx;
  color: #333333;
}

.save-btn {
  margin-top: 16rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 12rpx;
  background-color: #3c9cff;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
}

.save-btn::after {
  border: none;
}
</style>
