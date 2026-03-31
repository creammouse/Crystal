<template>
  <scroll-view class="page" scroll-y :show-scrollbar="false">
    <view class="list-inner">
      <view
        v-for="item in designList"
        :key="item.id"
        class="design-card"
      >
        <text class="design-name">{{ item.name }}</text>
        <view class="card-top">
          <view class="thumb">
            <text class="thumb-text">示意图</text>
          </view>
          <view class="card-main">
            <text class="line-meta">
              手围 {{ item.wristSize }}cm · {{ item.wearModeText }}
            </text>
            <text class="line-accessories">已选：{{ item.accessoriesText }}</text>
          </view>
        </view>
        <view class="card-actions">
          <text class="action-link" @tap="onEdit(item)">编辑</text>
          <text class="action-link" @tap="onShare(item)">分享</text>
          <text class="action-link action-link--danger" @tap="onDelete(item)">删除</text>
          <text class="action-link" @tap="onAddToCart(item)">添加到购物车</text>
          <text class="action-link action-link--primary" @tap="onPurchase(item)">购买</text>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type DesignListItem = {
  id: string
  /** 用户自定义作品名称 */
  name: string
  wristSize: string
  wearModeText: string
  accessoriesText: string
}

// TODO: 从后端拉取用户设计列表
const designList = ref<DesignListItem[]>([
  {
    id: '1',
    name: '夏日清透款',
    wristSize: '16',
    wearModeText: '单圈',
    accessoriesText: '银隔片、白水晶圆珠 10mm、莲花花托、粉水晶圆珠 8mm、金隔片',
  },
  {
    id: '2',
    name: '双圈森林系',
    wristSize: '17',
    wearModeText: '双圈',
    accessoriesText: '绿幽灵、黑曜石圆珠、复古铜隔片、S 扣、延长链、海蓝宝、烟晶圆珠 12mm、流苏配件',
  },
  {
    id: '3',
    name: '未命名作品',
    wristSize: '15',
    wearModeText: '单圈',
    accessoriesText: '菩提根珠',
  },
])

function onEdit(item: DesignListItem) {
  void item
  // TODO: 带 id 进入 DIY 编辑态
  uni.showToast({ title: '敬请期待', icon: 'none' })
}

function onShare(item: DesignListItem) {
  void item
  // TODO: 使用 button open-type="share" 或生成海报；需配置 onShareAppMessage
  uni.showToast({ title: '敬请期待', icon: 'none' })
}

function onDelete(item: DesignListItem) {
  uni.showModal({
    title: '删除设计',
    content: '确定删除该设计吗？',
    success(res) {
      if (!res.confirm)
        return
      // TODO: 调接口删除
      designList.value = designList.value.filter(d => d.id !== item.id)
      uni.showToast({ title: '已删除', icon: 'none' })
    },
  })
}

function onAddToCart(item: DesignListItem) {
  void item
  // TODO: 将设计对应 SKU 写入购物车接口 / 本地
  uni.showToast({ title: '已加入购物车', icon: 'none' })
}

function onPurchase(item: DesignListItem) {
  void item
  // TODO: 跳转结算或加购
  uni.showToast({ title: '敬请期待', icon: 'none' })
}
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.list-inner {
  padding: 24rpx 24rpx 48rpx;
  box-sizing: border-box;
}

.design-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.design-card:last-child {
  margin-bottom: 0;
}

.design-name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.35;
  margin-bottom: 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-top {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}

.thumb {
  width: 160rpx;
  height: 160rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
  background: linear-gradient(145deg, #e8f4ff 0%, #d4e8fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  box-sizing: border-box;
}

.thumb-text {
  font-size: 24rpx;
  color: #3c9cff;
}

.card-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}

.line-meta {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.4;
}

.line-accessories {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.45;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  column-gap: 32rpx;
  row-gap: 12rpx;
}

.action-link {
  font-size: 26rpx;
  color: #666666;
}

.action-link--primary {
  color: #3c9cff;
}

.action-link--danger {
  color: #e45656;
}
</style>
