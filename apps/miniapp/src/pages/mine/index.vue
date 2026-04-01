<template>
  <view class="page-root">
  <scroll-view class="page" scroll-y :show-scrollbar="false" :enhanced="true">
    <view class="page-inner">
      <view class="card card-profile">
        <view class="profile-row">
          <view class="avatar-wrap" @tap="onTapAvatar">
            <image
              v-if="avatarDisplay"
              class="avatar"
              :src="avatarDisplay"
              mode="aspectFill"
            />
            <view v-else class="avatar avatar--placeholder">
              <text class="avatar-placeholder-text">头像</text>
            </view>
          </view>
          <view class="profile-info">
            <text
              class="nickname"
              :class="{ 'nickname--guest': !isLoggedIn && !loading }"
            >{{ loading ? '登录中…' : nickname }}</text>
            <view
              v-if="isLoggedIn"
              class="edit-row"
              @tap="onEditProfile"
            >
              <text class="edit-text">编辑资料</text>
              <text class="edit-arrow">›</text>
            </view>
          </view>
          <view
            v-if="!isLoggedIn"
            class="login-prompt"
            @tap="onTapLoginPrompt"
          >
            <text class="login-prompt-text">{{ loading ? '登录中…' : '立刻登录' }}</text>
            <text
              v-if="!loading"
              class="login-prompt-arrow"
            >›</text>
          </view>
        </view>
      </view>

      <view class="card card-menu">
        <view
          v-for="(item, index) in menuEntries"
          :key="item.key"
          class="menu-item"
          :class="{ 'menu-item--last': index === menuEntries.length - 1 && !isLoggedIn }"
          @tap="onMenuTap(item.key)"
        >
          <text class="menu-label">{{ item.label }}</text>
          <text class="menu-arrow">›</text>
        </view>
        <view
          v-if="isLoggedIn"
          class="menu-item menu-item--last menu-item--logout"
          @tap="onLogout"
        >
          <text class="menu-label menu-label--logout">退出登录</text>
        </view>
      </view>
    </view>
  </scroll-view>
  <!-- 小程序端 App.vue 的 template 不参与渲染，登录弹层必须挂在页面内 -->
  <LoginSheet />
  <ProfileEditSheet v-model:visible="profileSheetOpen" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import { resolveMediaUrl } from '../../config'
import LoginSheet from '../../components/LoginSheet.vue'
import ProfileEditSheet from '../../components/ProfileEditSheet.vue'
import { ensureLoggedInForFeature, menuNeedsAuth } from '../../utils/require-auth'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const { nickname, loading, isLoggedIn, avatarUrl } = storeToRefs(userStore)
const avatarDisplay = computed(() => resolveMediaUrl(avatarUrl.value))
const profileSheetOpen = ref(false)


const menuEntries = [
  { key: 'designs', label: '我的设计' },
  { key: 'cart', label: '我的购物车' },
  { key: 'orders', label: '我的订单' },
  { key: 'addresses', label: '管理地址' },
  { key: 'favorites', label: '历史/收藏' },
  { key: 'service', label: '联系客服' },
] as const

onShow(() => {
  void userStore.tryRestoreSession()
  if (uni.getStorageSync('OPEN_PROFILE_EDIT')) {
    uni.removeStorageSync('OPEN_PROFILE_EDIT')
    if (userStore.isLoggedIn)
      profileSheetOpen.value = true
  }
})

function onTapAvatar() {
  if (isLoggedIn.value) {
    profileSheetOpen.value = true
    return
  }
  void userStore.ensureLogin()
}

function onTapLoginPrompt() {
  void userStore.ensureLogin()
}

function onEditProfile() {
  profileSheetOpen.value = true
}

const menuRoutes: Partial<Record<(typeof menuEntries)[number]['key'], string>> = {
  designs: '/pages/mine/designs/index',
  cart: '/pages/mine/cart/index',
  orders: '/pages/mine/orders/index',
  addresses: '/pages/mine/address/index',
  favorites: '/pages/mine/favorites/index',
  service: '/pages/mine/service/index',
}

async function onMenuTap(key: (typeof menuEntries)[number]['key']) {
  if (menuNeedsAuth(key)) {
    const ok = await ensureLoggedInForFeature()
    if (!ok)
      return
  }
  const url = menuRoutes[key]
  if (url)
    uni.navigateTo({ url })
}

function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmText: '退出',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm)
        userStore.logout()
    },
  })
}
</script>

<style scoped lang="scss">
.page-root {
  position: relative;
  min-height: 100vh;
}

.page {
  height: 100vh;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.page-inner {
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  overflow: hidden;
}

.page-inner > .card:last-child {
  margin-bottom: 0;
}

.card-profile {
  padding: 32rpx 28rpx;
}

.profile-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.avatar-wrap {
  flex-shrink: 0;
  margin-right: 24rpx;
}

.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  display: block;
  background-color: #e8e8e8;
}

.avatar--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #eeeeee;
  box-sizing: border-box;
}

.avatar-placeholder-text {
  font-size: 26rpx;
  color: #999999;
}

.profile-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16rpx;
}

.nickname {
  font-size: 34rpx;
  font-weight: 600;
  color: #333333;
  line-height: 1.3;
}

.nickname--guest {
  color: #999999;
  font-weight: 500;
}

.edit-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  padding: 8rpx 0;
}

.edit-text {
  font-size: 26rpx;
  color: #999999;
}

.edit-arrow {
  margin-left: 4rpx;
  font-size: 32rpx;
  color: #999999;
  line-height: 1;
  transform: translateY(-2rpx);
}

.login-prompt {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: center;
  margin-left: 16rpx;
  padding: 8rpx 0 8rpx 12rpx;
}

.login-prompt-text {
  font-size: 28rpx;
  color: #3c9cff;
  line-height: 1.2;
}

.login-prompt-arrow {
  margin-left: 4rpx;
  font-size: 36rpx;
  color: #3c9cff;
  line-height: 1;
  transform: translateY(-1rpx);
}

.card-menu {
  padding: 0 8rpx;
}

.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item--last {
  border-bottom-width: 0;
}

.menu-label {
  font-size: 30rpx;
  color: #333333;
}

.menu-arrow {
  font-size: 36rpx;
  color: #cccccc;
  line-height: 1;
}

.menu-item--logout {
  justify-content: flex-start;
}

.menu-label--logout {
  color: #e54d42;
  font-weight: 500;
}
</style>
