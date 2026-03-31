<template>
  <view class="page">
    <view class="tabs">
      <view
        class="tab"
        :class="{ 'tab--active': activeTab === 'history' }"
        @tap="activeTab = 'history'"
      >
        <text class="tab-text">浏览历史</text>
      </view>
      <view
        class="tab"
        :class="{ 'tab--active': activeTab === 'favorites' }"
        @tap="activeTab = 'favorites'"
      >
        <text class="tab-text">收藏</text>
      </view>
    </view>

    <scroll-view
      class="scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <!-- 浏览历史 -->
      <template v-if="activeTab === 'history'">
        <view v-if="historyList.length === 0" class="empty">
          <text class="empty-text">暂无浏览记录</text>
          <text class="empty-hint">在商城浏览商品后会出现在这里</text>
        </view>
        <view v-else class="list-inner">
          <view
            v-for="item in historyList"
            :key="item.id"
            class="goods-row"
            @tap="onOpenProduct(item.id)"
          >
            <view class="thumb">
              <text class="thumb-text">商品图</text>
            </view>
            <view class="row-body">
              <text class="title">{{ item.title }}</text>
              <view class="row-meta">
                <text v-if="item.priceYuan" class="price">¥{{ item.priceYuan }}</text>
                <text class="time">{{ item.viewedAtLabel }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 收藏 -->
      <template v-else>
        <view v-if="favoriteList.length === 0" class="empty">
          <text class="empty-text">暂无收藏</text>
          <text class="empty-hint">在商品详情中收藏后会出现在这里</text>
        </view>
        <view v-else class="list-inner">
          <view
            v-for="item in favoriteList"
            :key="item.id"
            class="goods-row"
            @tap="onOpenProduct(item.id)"
          >
            <view class="thumb">
              <text class="thumb-text">商品图</text>
            </view>
            <view class="row-body">
              <view class="title-row">
                <text class="title">{{ item.title }}</text>
                <text class="fav-badge">已收藏</text>
              </view>
              <view class="row-meta">
                <text v-if="item.priceYuan" class="price">¥{{ item.priceYuan }}</text>
                <text v-if="item.savedAtLabel" class="time">{{ item.savedAtLabel }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type HistoryItem = {
  id: string
  title: string
  priceYuan?: string
  /** 展示用时间文案，接后端后由接口或本地格式化 */
  viewedAtLabel: string
}

export type FavoriteItem = {
  id: string
  title: string
  priceYuan?: string
  savedAtLabel?: string
}

type TabKey = 'history' | 'favorites'

const activeTab = ref<TabKey>('history')

// TODO: 从本地存储 / 后端同步浏览历史（进入商品详情时写入）
const historyList = ref<HistoryItem[]>([
  {
    id: 'p1',
    title: '白水晶圆珠手串 10mm',
    priceYuan: '128.00',
    viewedAtLabel: '今天 14:20',
  },
  {
    id: 'p2',
    title: '银隔片套装 小号',
    priceYuan: '39.90',
    viewedAtLabel: '昨天 09:05',
  },
])

// TODO: 从后端拉取收藏列表；商品页收藏按钮调接口
const favoriteList = ref<FavoriteItem[]>([
  {
    id: 'p3',
    title: '绿幽灵单圈手串',
    priceYuan: '268.00',
    savedAtLabel: '3 月 20 日收藏',
  },
])

function onOpenProduct(productId: string) {
  void productId
  // TODO: 跳转商品详情，带 id
  uni.showToast({ title: '敬请期待', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.tabs {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 16rpx;
  position: relative;
}

.tab--active .tab-text {
  color: #3c9cff;
  font-weight: 600;
}

.tab--active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 64rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background-color: #3c9cff;
}

.tab-text {
  font-size: 30rpx;
  color: #666666;
}

.scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.list-inner {
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}

.empty {
  padding: 120rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #666666;
}

.empty-hint {
  font-size: 26rpx;
  color: #999999;
  text-align: center;
}

.goods-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  padding: 20rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.goods-row:last-child {
  margin-bottom: 0;
}

.thumb {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: linear-gradient(145deg, #f0f0f0 0%, #e4e4e4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.thumb-text {
  font-size: 24rpx;
  color: #999999;
}

.row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: 4rpx;
  padding-bottom: 4rpx;
}

.title-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12rpx;
}

.title {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.fav-badge {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #3c9cff;
  background-color: #e8f4ff;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  line-height: 1.3;
}

.row-meta {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
}

.price {
  font-size: 28rpx;
  font-weight: 600;
  color: #e45656;
  flex-shrink: 0;
}

.time {
  font-size: 24rpx;
  color: #999999;
  flex-shrink: 0;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}
</style>
