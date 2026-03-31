<template>
  <view class="page">
    <scroll-view class="sidebar" scroll-y :show-scrollbar="false" :enhanced="true">
      <view
        v-for="item in mallCategories"
        :key="item.id"
        class="sidebar-item"
        :class="{ active: activeCategoryId === item.id }"
        @tap="activeCategoryId = item.id"
      >
        <text class="sidebar-text">{{ item.name }}</text>
      </view>
    </scroll-view>
    <view class="main-column">
      <view class="main-nav-divider" />
      <view class="main-scroll-wrap">
        <scroll-view
          v-for="cat in mallCategories"
          :key="cat.id"
          v-show="activeCategoryId === cat.id"
          class="main-scroll"
          scroll-y
          :show-scrollbar="false"
          :enhanced="true"
        >
          <view v-if="cat.id === HOME_CATEGORY_ID" class="main-inner">
            <view class="card-grid card-grid--three">
              <view
                v-for="sub in contentCategories"
                :key="sub.id"
                class="goods-card"
                @tap="activeCategoryId = sub.id"
              >
                <view class="goods-card-cover goods-card-cover--category">
                  <text class="cover-abbr">{{ categoryAbbr(sub.name) }}</text>
                </view>
                <view class="goods-card-body">
                  <text class="goods-card-title">{{ sub.name }}</text>
                  <text class="goods-card-sub">查看商品</text>
                </view>
              </view>
            </view>
          </view>
          <view v-else class="main-inner">
            <view class="card-grid card-grid--two">
              <view
                v-for="p in placeholderProductsFor(cat)"
                :key="p.id"
                class="goods-card"
              >
                <view class="goods-card-cover goods-card-cover--product">
                  <text class="cover-placeholder">图</text>
                </view>
                <view class="goods-card-body">
                  <text class="goods-card-title">{{ p.name }}</text>
                  <text class="goods-card-price">¥ ——</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export type MallCategoryItem = {
  id: string
  name: string
}

const HOME_CATEGORY_ID = 'home'

// TODO: 改为从后端接口拉取商城分类（顺序、名称、是否展示等）
const mallCategories = ref<MallCategoryItem[]>([
  { id: HOME_CATEGORY_ID, name: '主页' },
  { id: 'bracelet', name: '手串' },
  { id: 'crystal-ornament', name: '水晶摆件' },
  { id: 'crystal-pendant', name: '水晶吊坠' },
  { id: 'crystal-earring', name: '水晶耳坠' },
  { id: 'wood-ornament', name: '木制摆件' },
])

const activeCategoryId = ref(mallCategories.value[0]?.id ?? HOME_CATEGORY_ID)

const contentCategories = computed(() =>
  mallCategories.value.filter(c => c.id !== HOME_CATEGORY_ID),
)

type PlaceholderProduct = { id: string, name: string }

// TODO: 改为按分类 id 请求后端商品列表；每个标签独立 scroll-view，滚动互不干扰
function placeholderProductsFor(cat: MallCategoryItem): PlaceholderProduct[] {
  if (cat.id === HOME_CATEGORY_ID)
    return []
  const count = 8
  return Array.from({ length: count }, (_, i) => ({
    id: `${cat.id}-ph-${i}`,
    name: `${cat.name} 占位 ${i + 1}`,
  }))
}

function categoryAbbr(name: string): string {
  const t = name.trim()
  if (t.length <= 2)
    return t
  return t.slice(0, 2)
}
</script>

<style scoped lang="scss">
.page {
  height: 100vh;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  background-color: #f7f7f7;
}

.sidebar {
  flex-shrink: 0;
  width: 168rpx;
  height: 100%;
  background-color: #ffffff;
  border-right: 1rpx solid #eeeeee;
  box-sizing: border-box;
}

.sidebar-item {
  min-height: 100rpx;
  padding: 24rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 6rpx solid transparent;
  box-sizing: border-box;
}

.sidebar-item.active {
  background-color: #f0f7ff;
  border-left-color: #3c9cff;
}

.sidebar-text {
  font-size: 26rpx;
  line-height: 1.35;
  color: #333333;
  text-align: center;
  word-break: break-all;
}

.sidebar-item.active .sidebar-text {
  color: #3c9cff;
  font-weight: 600;
}

.main-column {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.main-nav-divider {
  flex-shrink: 0;
  width: 100%;
  height: 2px;
  background-color: #f7f7f7;
}

.main-scroll-wrap {
  flex: 1;
  min-height: 0;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}

.main-scroll {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.main-inner {
  padding: 20rpx 20rpx 32rpx;
  box-sizing: border-box;
}

.card-grid {
  display: grid;
}

.card-grid--two {
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.card-grid--three {
  grid-template-columns: repeat(3, 1fr);
  gap: 14rpx;
}

.card-grid--three .cover-abbr {
  font-size: 30rpx;
}

.card-grid--three .goods-card-body {
  padding: 12rpx 10rpx 16rpx;
}

.card-grid--three .goods-card-title {
  font-size: 22rpx;
  min-height: 60rpx;
}

.card-grid--three .goods-card-sub {
  font-size: 20rpx;
}

/* 分类卡片与商品卡片共用卡片容器与封面比例 */
.goods-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.goods-card-cover {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.goods-card-cover--category {
  background: linear-gradient(145deg, #e8f4ff 0%, #d4e8fc 100%);
}

.goods-card-cover--product {
  background: linear-gradient(145deg, #f0f0f0 0%, #e4e4e4 100%);
}

.cover-abbr {
  font-size: 40rpx;
  font-weight: 600;
  color: #3c9cff;
  letter-spacing: 2rpx;
}

.cover-placeholder {
  font-size: 32rpx;
  color: #bbbbbb;
}

.goods-card-body {
  padding: 16rpx 16rpx 20rpx;
  box-sizing: border-box;
}

.goods-card-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 26rpx;
  line-height: 1.35;
  color: #333333;
  min-height: 70rpx;
}

.goods-card-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #3c9cff;
}

.goods-card-price {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #e45656;
}
</style>
