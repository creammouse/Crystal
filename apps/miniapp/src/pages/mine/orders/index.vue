<template>
  <view class="page">
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ 'tab--active': activeTab === tab.key }"
        @tap="activeTab = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <scroll-view
      class="scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view v-if="filteredOrders.length === 0" class="empty">
        <text class="empty-text">暂无相关订单</text>
        <text class="empty-hint">下单后会在这里展示</text>
      </view>
      <view v-else class="list-inner">
        <view
          v-for="order in filteredOrders"
          :key="order.id"
          class="order-card"
          @tap="onCardTap(order)"
        >
          <view class="card-head">
            <text class="order-no">订单号 {{ order.orderNo }}</text>
            <text
              class="status-tag"
              :class="`status-tag--${order.status}`"
            >{{ statusLabel(order.status) }}</text>
          </view>

          <view class="card-placeholder">
            <view class="placeholder-thumb">
              <text class="placeholder-thumb-text">商品图</text>
            </view>
            <view class="placeholder-body">
              <text class="placeholder-title">商品与规格</text>
              <text class="placeholder-sub">具体内容接入订单接口后展示</text>
            </view>
          </view>

          <view class="card-foot">
            <text class="foot-hint">实付等字段待定</text>
            <text class="foot-action">详情</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/** 与 Tab 对应的订单状态（接后端时对齐枚举） */
export type OrderStatus = 'pending_payment' | 'pending_receipt' | 'completed'

export type OrderListItem = {
  id: string
  orderNo: string
  status: OrderStatus
}

const tabs = [
  { key: 'all' as const, label: '全部' },
  { key: 'pending_payment' as const, label: '待付款' },
  { key: 'pending_receipt' as const, label: '待收货' },
  { key: 'completed' as const, label: '已完成' },
]

type TabKey = (typeof tabs)[number]['key']

const activeTab = ref<TabKey>('all')

// TODO: 从后端拉取订单列表
const orderList = ref<OrderListItem[]>([
  { id: '1', orderNo: '202603290001', status: 'pending_payment' },
  { id: '2', orderNo: '202603280088', status: 'pending_receipt' },
  { id: '3', orderNo: '202603270012', status: 'completed' },
  { id: '4', orderNo: '202603260045', status: 'completed' },
])

const filteredOrders = computed(() => {
  if (activeTab.value === 'all')
    return orderList.value
  return orderList.value.filter(o => o.status === activeTab.value)
})

function statusLabel(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending_payment: '待付款',
    pending_receipt: '待收货',
    completed: '已完成',
  }
  return map[s]
}

function onCardTap(item: OrderListItem) {
  void item
  // TODO: 跳转订单详情页
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
  align-items: stretch;
  background-color: #ffffff;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 0 8rpx;
  box-sizing: border-box;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 8rpx;
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
  width: 48rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background-color: #3c9cff;
}

.tab-text {
  font-size: 28rpx;
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

.order-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.order-card:last-child {
  margin-bottom: 0;
}

.card-head {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-no {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: #666666;
}

.status-tag {
  flex-shrink: 0;
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
}

.status-tag--pending_payment {
  color: #e45656;
  background-color: #fff0f0;
}

.status-tag--pending_receipt {
  color: #3c9cff;
  background-color: #e8f4ff;
}

.status-tag--completed {
  color: #666666;
  background-color: #f0f0f0;
}

.card-placeholder {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 24rpx 0;
  gap: 20rpx;
}

.placeholder-thumb {
  width: 140rpx;
  height: 140rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: linear-gradient(145deg, #f0f0f0 0%, #e8e8e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-thumb-text {
  font-size: 22rpx;
  color: #999999;
}

.placeholder-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}

.placeholder-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.placeholder-sub {
  font-size: 24rpx;
  color: #999999;
  line-height: 1.45;
}

.card-foot {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.foot-hint {
  font-size: 24rpx;
  color: #bbbbbb;
}

.foot-action {
  font-size: 26rpx;
  color: #3c9cff;
}
</style>
