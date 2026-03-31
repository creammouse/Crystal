<template>
  <view class="page">
    <scroll-view
      class="scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view v-if="cartList.length === 0" class="empty">
        <text class="empty-text">购物车还是空的</text>
        <text class="empty-hint">去商城逛逛，或从我的设计加入购物车</text>
      </view>
      <view v-else class="list-inner">
        <view
          v-for="item in cartList"
          :key="item.id"
          class="cart-card"
        >
          <view
            class="check-wrap"
            @tap.stop="toggleItem(item)"
          >
            <view
              class="check"
              :class="{ 'check--on': item.selected }"
            >
              <text v-if="item.selected" class="check-tick">✓</text>
            </view>
          </view>

          <view
            class="thumb"
            :class="item.kind === 'design' ? 'thumb--design' : 'thumb--product'"
          >
            <text class="thumb-text">
              {{ item.kind === 'design' ? '示意图' : '商品图' }}
            </text>
          </view>

          <view class="card-body">
            <view class="title-row">
              <text
                v-if="item.kind === 'design'"
                class="tag tag--design"
              >设计</text>
              <text
                v-else
                class="tag tag--product"
              >商品</text>
              <text class="title">{{ item.title }}</text>
            </view>
            <text
              v-if="item.spec"
              class="spec"
            >{{ item.spec }}</text>

            <view class="card-bottom">
              <text class="price">¥{{ item.priceYuan }}</text>
              <view
                v-if="item.kind === 'product'"
                class="stepper"
              >
                <view
                  class="stepper-btn"
                  :class="{ 'stepper-btn--disabled': item.qty <= 1 }"
                  @tap.stop="decQty(item)"
                >
                  <text class="stepper-btn-text">−</text>
                </view>
                <text class="stepper-num">{{ item.qty }}</text>
                <view
                  class="stepper-btn"
                  @tap.stop="incQty(item)"
                >
                  <text class="stepper-btn-text">+</text>
                </view>
              </view>
              <text
                v-else
                class="qty-hint"
              >×{{ item.qty }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view
      v-if="cartList.length > 0"
      class="footer"
    >
      <view
        class="footer-select"
        @tap="toggleSelectAll"
      >
        <view
          class="check check--footer"
          :class="{ 'check--on': allSelected }"
        >
          <text
            v-if="allSelected"
            class="check-tick"
          >✓</text>
        </view>
        <text class="footer-select-text">全选</text>
      </view>

      <view class="footer-mid">
        <view class="footer-price-row">
          <text class="footer-label">合计</text>
          <text class="footer-total">¥{{ selectedTotal }}</text>
        </view>
        <text class="footer-sub">已选 {{ selectedQtySum }} 件</text>
      </view>

      <view
        class="footer-btn"
        :class="{ 'footer-btn--disabled': selectedQtySum === 0 }"
        @tap="onCheckout"
      >
        <text class="footer-btn-text">结算</text>
        <text
          v-if="selectedLineCount > 0"
          class="footer-btn-badge"
        >({{ selectedLineCount }})</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'

export type CartItemKind = 'product' | 'design'

export type CartItem = {
  id: string
  kind: CartItemKind
  /** 商品名或手串设计名 */
  title: string
  spec?: string
  priceYuan: string
  qty: number
  selected: boolean
}

// TODO: 从后端 / 本地存储同步购物车
const cartList = ref<CartItem[]>([
  {
    id: '1',
    kind: 'product',
    title: '白水晶圆珠手串',
    spec: '10mm · 默认手围',
    priceYuan: '128.00',
    qty: 1,
    selected: false,
  },
  {
    id: '2',
    kind: 'design',
    title: '夏日清透款',
    spec: '手围 16cm · 单圈',
    priceYuan: '268.00',
    qty: 1,
    selected: false,
  },
  {
    id: '3',
    kind: 'product',
    title: '银隔片套装',
    spec: '小号 20 枚',
    priceYuan: '39.90',
    qty: 2,
    selected: false,
  },
])

function clearSelection() {
  cartList.value.forEach((it) => {
    it.selected = false
  })
}

/** 每次进入购物车页均不保留上次勾选（含从其他页返回） */
onShow(() => {
  clearSelection()
})

const allSelected = computed(
  () => cartList.value.length > 0 && cartList.value.every(it => it.selected),
)

const selectedQtySum = computed(() =>
  cartList.value.reduce((n, it) => (it.selected ? n + it.qty : n), 0),
)

const selectedLineCount = computed(
  () => cartList.value.filter(it => it.selected).length,
)

const selectedTotal = computed(() => {
  const sum = cartList.value.reduce((n, it) => {
    if (!it.selected)
      return n
    const p = Number.parseFloat(it.priceYuan)
    return n + (Number.isFinite(p) ? p * it.qty : 0)
  }, 0)
  return sum.toFixed(2)
})

function toggleItem(item: CartItem) {
  item.selected = !item.selected
}

function toggleSelectAll() {
  const next = !allSelected.value
  cartList.value.forEach((it) => {
    it.selected = next
  })
}

function incQty(item: CartItem) {
  if (item.kind !== 'product')
    return
  if (item.qty >= 99)
    return
  item.qty += 1
}

function decQty(item: CartItem) {
  if (item.kind !== 'product')
    return
  if (item.qty <= 1)
    return
  item.qty -= 1
}

function onCheckout() {
  if (selectedQtySum.value === 0) {
    uni.showToast({ title: '请选择要结算的商品', icon: 'none' })
    return
  }
  // TODO: 携带选中项跳转确认订单页
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

.scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  box-sizing: border-box;
}

.list-inner {
  padding: 24rpx 24rpx 32rpx;
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

.cart-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  padding: 20rpx 16rpx 20rpx 12rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.cart-card:last-child {
  margin-bottom: 0;
}

.check-wrap {
  flex-shrink: 0;
  width: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #cccccc;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check--footer {
  width: 36rpx;
  height: 36rpx;
}

.check--on {
  border-color: #3c9cff;
  background-color: #3c9cff;
}

.check-tick {
  font-size: 22rpx;
  color: #ffffff;
  line-height: 1;
  font-weight: 600;
}

.thumb {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  box-sizing: border-box;
}

.thumb--product {
  background: linear-gradient(145deg, #f0f0f0 0%, #e4e4e4 100%);
}

.thumb--design {
  background: linear-gradient(145deg, #e8f4ff 0%, #d4e8fc 100%);
}

.thumb-text {
  font-size: 24rpx;
  color: #999999;
}

.thumb--design .thumb-text {
  color: #3c9cff;
}

.card-body {
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
  gap: 10rpx;
}

.tag {
  flex-shrink: 0;
  font-size: 20rpx;
  line-height: 1.2;
  padding: 4rpx 10rpx;
  border-radius: 6rpx;
}

.tag--product {
  color: #666666;
  background-color: #f0f0f0;
}

.tag--design {
  color: #3c9cff;
  background-color: #e8f4ff;
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

.spec {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #999999;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-bottom {
  margin-top: 16rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.price {
  font-size: 30rpx;
  font-weight: 600;
  color: #e45656;
  flex-shrink: 0;
}

.stepper {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #fafafa;
}

.stepper-btn {
  width: 56rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.stepper-btn--disabled {
  opacity: 0.35;
}

.stepper-btn-text {
  font-size: 32rpx;
  color: #333333;
  line-height: 1;
}

.stepper-num {
  min-width: 56rpx;
  text-align: center;
  font-size: 26rpx;
  color: #333333;
}

.qty-hint {
  font-size: 26rpx;
  color: #999999;
  flex-shrink: 0;
}

.footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 1rpx solid #f0f0f0;
  box-sizing: border-box;
  gap: 16rpx;
}

.footer-select {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8rpx;
}

.footer-select-text {
  font-size: 26rpx;
  color: #333333;
}

.footer-mid {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.footer-price-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8rpx;
}

.footer-label {
  font-size: 26rpx;
  color: #333333;
}

.footer-total {
  font-size: 34rpx;
  font-weight: 600;
  color: #e45656;
}

.footer-sub {
  font-size: 22rpx;
  color: #999999;
}

.footer-btn {
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 20rpx 28rpx;
  border-radius: 40rpx;
  background-color: #3c9cff;
  box-sizing: border-box;
}

.footer-btn--disabled {
  opacity: 0.45;
}

.footer-btn-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #ffffff;
}

.footer-btn-badge {
  margin-left: 4rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #ffffff;
}
</style>
