<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// TODO: 后续改为从后端接口获取类别列表
const categoryTabs = ['珠子', '配饰', '花托']
const activeCategory = ref('珠子')
const RING_SIZE_RPX = 380
const RING_BORDER_RPX = 4
const BEAD_DIAMETER_RPX = 88
const showSettingDrawer = ref(false)
const wristSize = ref('16')
const wearMode = ref<'single' | 'double'>('single')
const sizeCandidates = [8, 10, 12, 14]

// TODO: 后续改为从后端接口按类别返回子类列表
const subCategoryMap: Record<string, string[]> = {
  珠子: [
    '白水晶',
    '粉水晶',
    '紫水晶',
    '黄水晶',
    '绿幽灵',
    '黑曜石',
    '金曜石',
    '红玛瑙',
    '蓝纹石',
    '海蓝宝',
    '草莓晶',
    '烟晶',
    '月光石',
    '虎眼石',
    '孔雀石',
    '琥珀',
    '沉香木珠',
    '檀木珠',
    '菩提根珠',
    '贝壳珠',
  ],
  配饰: [
    '银隔片',
    '金隔片',
    '复古铜隔片',
    'S扣',
    '龙虾扣',
    '定位珠',
    '延长链',
    '吊坠环',
    '平安扣',
    '福袋吊坠',
    '流苏配件',
    '字母吊牌',
  ],
  花托: [
    '四瓣花托',
    '六瓣花托',
    '莲花花托',
    '圆盘花托',
    '镂空花托',
    '银色花托',
    '金色花托',
    '古铜花托',
    '小号花托',
    '中号花托',
    '大号花托',
    '加厚花托',
  ],
}

const activeSubCategory = ref('')
const subCategoryScrollTopMap = ref<Record<string, number>>({
  珠子: 0,
  配饰: 0,
  花托: 0,
})

const currentSubCategories = computed(() => {
  const list = subCategoryMap[activeCategory.value] || []
  if (!list.includes(activeSubCategory.value))
    activeSubCategory.value = list[0] || ''
  return list
})

const currentSubCategoryScrollTop = computed(
  () => subCategoryScrollTopMap.value[activeCategory.value] || 0,
)

type BraceletBead = {
  name: string
  size: number
  sizes: number[]
}

type GoodsItem = {
  id: string
  name: string
  sizes: number[]
}

const braceletBeads = ref<BraceletBead[]>([])
const selectedBeadIndex = ref<number>(-1)
const selectedGoodsId = ref('')
const selectedSizeByGoodsId = ref<Record<string, number>>({})
const dragState = ref({
  active: false,
  beadIndex: -1,
  pageX: 0,
  pageY: 0,
  overDelete: false,
})
const ringRect = ref<{ left: number, top: number, width: number, height: number } | null>(null)
const deleteRect = ref<{ left: number, top: number, width: number, height: number } | null>(null)
const showGoodsDetailModal = ref(false)

// TODO: 后续改为从后端接口按大类+子类返回商品列表（含图片、名称、可用尺寸）
function buildSizeSet(seedText: string): number[] {
  let seed = 0
  for (let i = 0; i < seedText.length; i++)
    seed = (seed * 131 + seedText.charCodeAt(i)) >>> 0

  const count = (seed % sizeCandidates.length) + 1
  const pool = [...sizeCandidates]
  const picked: number[] = []
  let state = seed || 1
  for (let i = 0; i < count; i++) {
    state = (state * 1664525 + 1013904223) >>> 0
    const idx = state % pool.length
    picked.push(pool[idx])
    pool.splice(idx, 1)
  }
  return picked.sort((a, b) => a - b)
}

const currentGoods = computed<GoodsItem[]>(() => {
  const baseName = activeSubCategory.value || activeCategory.value
  return Array.from({ length: 24 }).map((_, index) => ({
    id: `${activeCategory.value}-${baseName}-${index + 1}`,
    name: `${baseName}${index + 1}号`,
    sizes: buildSizeSet(`${activeCategory.value}-${baseName}-${index + 1}`),
  }))
})

watch(currentGoods, (list) => {
  if (!list.length) {
    selectedGoodsId.value = ''
    return
  }

  const exists = list.some(item => item.id === selectedGoodsId.value)
  if (!exists)
    selectedGoodsId.value = ''

  for (const item of list) {
    if (!selectedSizeByGoodsId.value[item.id] || !item.sizes.includes(selectedSizeByGoodsId.value[item.id]))
      selectedSizeByGoodsId.value[item.id] = item.sizes[0]
  }
}, { immediate: true })

const currentSelectedGoods = computed(() => currentGoods.value.find(item => item.id === selectedGoodsId.value))
const currentSelectedBead = computed(() => {
  const i = selectedBeadIndex.value
  if (i < 0 || i >= braceletBeads.value.length)
    return null
  return braceletBeads.value[i]
})
const currentSizeOptions = computed(() => {
  if (currentSelectedBead.value)
    return currentSelectedBead.value.sizes
  return currentSelectedGoods.value?.sizes || []
})
const currentSelectedSize = computed(() => {
  if (currentSelectedBead.value)
    return currentSelectedBead.value.size
  if (!currentSelectedGoods.value)
    return 0
  return selectedSizeByGoodsId.value[currentSelectedGoods.value.id] || currentSelectedGoods.value.sizes[0]
})
const draggingBead = computed(() => {
  const i = dragState.value.beadIndex
  if (i < 0 || i >= braceletBeads.value.length)
    return null
  return braceletBeads.value[i]
})
const previewDropIndex = computed(() => {
  if (!dragState.value.active || dragState.value.overDelete)
    return -1
  return calcIndexByPoint(dragState.value.pageX, dragState.value.pageY, braceletBeads.value.length)
})
// 落位预览样式：临时占位，后续可换动画/缝隙标记等更强反馈
const previewDropStyle = computed(() => {
  if (previewDropIndex.value < 0 || !ringRect.value)
    return null

  const trackRadius = RING_SIZE_RPX / 2 - RING_BORDER_RPX / 2
  const angleStep = BEAD_DIAMETER_RPX / trackRadius
  const radiusPercent = (trackRadius / RING_SIZE_RPX) * 100
  const angle = -Math.PI / 2 + previewDropIndex.value * angleStep
  const x = 50 + radiusPercent * Math.cos(angle)
  const y = 50 + radiusPercent * Math.sin(angle)
  return {
    left: `${x}%`,
    top: `${y}%`,
  }
})

const ringBeads = computed(() => {
  const total = braceletBeads.value.length
  if (!total)
    return []

  // 按珠子直径步进，沿圆周依次排布（一个个挨着来）
  const trackRadius = RING_SIZE_RPX / 2 - RING_BORDER_RPX / 2 // 珠子中心落在虚线圆环中线
  const angleStep = BEAD_DIAMETER_RPX / trackRadius
  const radiusPercent = (trackRadius / RING_SIZE_RPX) * 100

  return braceletBeads.value.map((bead, index) => {
    const angle = -Math.PI / 2 + index * angleStep
    const x = 50 + radiusPercent * Math.cos(angle)
    const y = 50 + radiusPercent * Math.sin(angle)
    return {
      id: `${bead.name}-${index}`,
      sizeText: `${bead.size}mm`,
      shortName: bead.name.slice(0, 2),
      selected: selectedBeadIndex.value === index,
      style: {
        left: `${x}%`,
        top: `${y}%`,
      },
    }
  })
})

function switchCategory(category: string) {
  activeCategory.value = category
}

function selectGoods(goodsId: string) {
  selectedGoodsId.value = goodsId
  selectedBeadIndex.value = -1
}

function switchSize(size: number) {
  if (currentSelectedBead.value) {
    currentSelectedBead.value.size = size
    return
  }
  if (selectedGoodsId.value)
    selectedSizeByGoodsId.value[selectedGoodsId.value] = size
}

function handleSubCategoryScroll(event: any) {
  const top = event?.detail?.scrollTop ?? 0
  subCategoryScrollTopMap.value[activeCategory.value] = top
}

function addToBracelet(goods: GoodsItem) {
  selectedGoodsId.value = ''
  const trackRadius = RING_SIZE_RPX / 2 - RING_BORDER_RPX / 2
  const ringCircumference = 2 * Math.PI * trackRadius
  const maxBeadCount = Math.floor(ringCircumference / BEAD_DIAMETER_RPX)
  if (braceletBeads.value.length >= maxBeadCount) {
    uni.showToast({
      title: '手串已满',
      icon: 'none',
    })
    return
  }
  braceletBeads.value.push({
    name: goods.name,
    size: selectedSizeByGoodsId.value[goods.id] || goods.sizes[0],
    sizes: [...goods.sizes],
  })
  selectedBeadIndex.value = braceletBeads.value.length - 1
}

function selectBead(index: number) {
  if (dragState.value.active)
    return
  selectedBeadIndex.value = index
  selectedGoodsId.value = ''
}

function removeSelectedBead() {
  const i = selectedBeadIndex.value
  if (i < 0)
    return
  braceletBeads.value.splice(i, 1)
  if (!braceletBeads.value.length) {
    selectedBeadIndex.value = -1
    return
  }
  if (i >= braceletBeads.value.length)
    selectedBeadIndex.value = braceletBeads.value.length - 1
}

function moveSelected(direction: 'up' | 'down') {
  const i = selectedBeadIndex.value
  if (i < 0)
    return
  const target = direction === 'up' ? i - 1 : i + 1
  if (target < 0 || target >= braceletBeads.value.length)
    return
  const temp = braceletBeads.value[i]
  braceletBeads.value[i] = braceletBeads.value[target]
  braceletBeads.value[target] = temp
  selectedBeadIndex.value = target
}

function clearBracelet() {
  braceletBeads.value = []
  selectedBeadIndex.value = -1
}

function openSettingDrawer() {
  showSettingDrawer.value = true
}

function closeSettingDrawer() {
  showSettingDrawer.value = false
}

function openGoodsDetailModal() {
  showGoodsDetailModal.value = true
}

function closeGoodsDetailModal() {
  showGoodsDetailModal.value = false
}

function measureRectById(id: string): Promise<{ left: number, top: number, width: number, height: number } | null> {
  return new Promise((resolve) => {
    uni.createSelectorQuery().select(`#${id}`).boundingClientRect((rect) => {
      resolve(rect as any || null)
    }).exec()
  })
}

function pointInRect(x: number, y: number, rect: { left: number, top: number, width: number, height: number } | null) {
  if (!rect)
    return false
  return x >= rect.left && x <= rect.left + rect.width && y >= rect.top && y <= rect.top + rect.height
}

function moveArrayItem<T>(list: T[], from: number, to: number) {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function calcIndexByPoint(pageX: number, pageY: number, total: number) {
  if (!ringRect.value || total <= 1)
    return 0
  const centerX = ringRect.value.left + ringRect.value.width / 2
  const centerY = ringRect.value.top + ringRect.value.height / 2
  const angle = Math.atan2(pageY - centerY, pageX - centerX)
  const trackRadius = RING_SIZE_RPX / 2 - RING_BORDER_RPX / 2
  const step = BEAD_DIAMETER_RPX / trackRadius
  let normalized = angle + Math.PI / 2
  while (normalized < 0) normalized += Math.PI * 2
  while (normalized >= Math.PI * 2) normalized -= Math.PI * 2
  return Math.max(0, Math.min(total - 1, Math.round(normalized / step)))
}

async function onBeadTouchStart(index: number, event: any) {
  const touch = event?.touches?.[0] || event?.changedTouches?.[0]
  if (!touch)
    return
  selectedBeadIndex.value = index
  selectedGoodsId.value = ''
  ringRect.value = await measureRectById('diy-ring')
  deleteRect.value = await measureRectById('delete-btn')
  dragState.value = {
    active: true,
    beadIndex: index,
    pageX: touch.pageX,
    pageY: touch.pageY,
    overDelete: pointInRect(touch.pageX, touch.pageY, deleteRect.value),
  }
}

function handlePageTouchMove(event: any) {
  if (!dragState.value.active)
    return
  const touch = event?.touches?.[0] || event?.changedTouches?.[0]
  if (!touch)
    return
  dragState.value.pageX = touch.pageX
  dragState.value.pageY = touch.pageY
  dragState.value.overDelete = pointInRect(touch.pageX, touch.pageY, deleteRect.value)
}

function handlePageTouchEnd() {
  if (!dragState.value.active)
    return
  const from = dragState.value.beadIndex
  if (dragState.value.overDelete) {
    braceletBeads.value.splice(from, 1)
    if (!braceletBeads.value.length)
      selectedBeadIndex.value = -1
    else if (from >= braceletBeads.value.length)
      selectedBeadIndex.value = braceletBeads.value.length - 1
    else
      selectedBeadIndex.value = from
  }
  else {
    const total = braceletBeads.value.length
    const target = calcIndexByPoint(dragState.value.pageX, dragState.value.pageY, total)
    if (target !== from)
      braceletBeads.value = moveArrayItem(braceletBeads.value, from, target)
    selectedBeadIndex.value = target
  }
  dragState.value = {
    active: false,
    beadIndex: -1,
    pageX: 0,
    pageY: 0,
    overDelete: false,
  }
}
</script>

<template>
  <view class="page" @touchmove="handlePageTouchMove" @touchend="handlePageTouchEnd" @touchcancel="handlePageTouchEnd">
    <view class="top-area">
      <view class="ring-wrap">
        <view id="diy-ring" class="ring">
          <!-- 落位预览：当前为示意效果，后续会替换为更清晰的插入提示（如缝隙高亮、引导线等） -->
          <view
            v-if="previewDropStyle"
            class="ring-drop-preview"
            :style="previewDropStyle"
          />
          <view
            v-for="(bead, index) in ringBeads"
            :key="bead.id"
            class="ring-bead"
            :class="{ 'ring-bead--selected': bead.selected }"
            :style="bead.style"
            @tap="selectBead(index)"
            @touchstart="onBeadTouchStart(index, $event)"
          >
            <text class="ring-bead-size">{{ bead.sizeText }}</text>
            <text class="ring-bead-name">{{ bead.shortName }}</text>
          </view>
        </view>
      </view>

      <view v-if="currentSizeOptions.length" class="size-switch-bar">
        <view
          v-for="size in currentSizeOptions"
          :key="size"
          class="size-pill"
          :class="{ 'size-pill--active': currentSelectedSize === size }"
          @tap="switchSize(size)"
        >
          {{ size }}mm
        </view>
      </view>

      <view class="right-tools">
        <view class="tool-btn" @tap="openSettingDrawer">设置</view>

        <view class="tool-group">
          <view class="tool-btn" @tap="moveSelected('up')">上移</view>
          <view class="tool-btn" @tap="moveSelected('down')">下移</view>
          <view class="tool-btn">翻转</view>
          <view
            id="delete-btn"
            class="tool-btn"
            :class="{ 'tool-btn--delete-active': dragState.overDelete }"
            @tap="removeSelectedBead"
          >
            删除
          </view>
          <view class="tool-btn" @tap="clearBracelet">清空</view>
        </view>
      </view>
    </view>

    <view
      v-if="dragState.active && draggingBead"
      class="drag-bead"
      :class="{ 'drag-bead--delete-over': dragState.overDelete }"
      :style="{ left: `${dragState.pageX}px`, top: `${dragState.pageY}px` }"
    >
      <text class="ring-bead-size">{{ draggingBead.size }}mm</text>
      <text class="ring-bead-name">{{ draggingBead.name.slice(0, 2) }}</text>
    </view>

    <view v-if="showSettingDrawer" class="setting-popover-wrap" @tap="closeSettingDrawer">
      <view class="setting-modal" @tap.stop>
        <view class="drawer-header">
          <text class="drawer-title">设置</text>
        </view>

        <view class="drawer-item">
          <text class="drawer-label">手围（cm）</text>
          <input
            v-model="wristSize"
            class="drawer-input"
            type="digit"
            placeholder="请输入手围"
          />
        </view>

        <view class="drawer-item">
          <text class="drawer-label">佩戴方式</text>
          <view class="mode-row">
            <view
              class="mode-btn"
              :class="{ 'mode-btn--active': wearMode === 'single' }"
              @tap="wearMode = 'single'"
            >
              单圈
            </view>
            <view
              class="mode-btn"
              :class="{ 'mode-btn--active': wearMode === 'double' }"
              @tap="wearMode = 'double'"
            >
              双圈
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-area">
      <view class="category-row">
        <view class="category-tabs">
          <view
            v-for="item in categoryTabs"
            :key="item"
            class="category-tab"
            :class="{ 'category-tab--active': activeCategory === item }"
            @tap="switchCategory(item)"
          >
            {{ item }}
          </view>
        </view>

        <view class="category-actions">
          <view class="action-btn">搜索</view>
          <view class="action-btn">筛选</view>
        </view>
      </view>

      <view class="table-placeholder">
        <view class="table-content">
          <scroll-view
            class="sub-category-col"
            scroll-y
            :scroll-top="currentSubCategoryScrollTop"
            @scroll="handleSubCategoryScroll"
          >
            <view
              v-for="item in currentSubCategories"
              :key="item"
              class="sub-category-item"
              :class="{ 'sub-category-item--active': activeSubCategory === item }"
              @tap="activeSubCategory = item"
            >
              {{ item }}
            </view>
          </scroll-view>

          <scroll-view class="goods-placeholder" scroll-y>
            <view class="goods-grid">
              <view
                v-for="item in currentGoods"
                :key="item.id"
                class="goods-card"
                :class="{ 'goods-card--active': selectedGoodsId === item.id }"
                @tap="addToBracelet(item)"
                @longpress="openGoodsDetailModal"
              >
                <view class="goods-image">
                  <view class="goods-circle">
                    <text class="goods-circle-text">{{ item.name.slice(0, 2) }}</text>
                  </view>
                </view>
                <text class="goods-name" @tap.stop="selectGoods(item.id)">{{ item.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>

    <view v-if="showGoodsDetailModal" class="goods-detail-mask" @tap="closeGoodsDetailModal">
      <view class="goods-detail-modal" @tap.stop>
        <view class="goods-detail-header">
          <text class="goods-detail-title">珠子详情</text>
        </view>
        <view class="goods-detail-body" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-area {
  position: relative;
  flex: 56;
  min-height: 0;
  padding: 24rpx 24rpx 16rpx;
  box-sizing: border-box;
}

.ring-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-switch-bar {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  transform: translateX(-50%);
  display: flex;
  gap: 8rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #e8e8e8;
}

.size-pill {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #666666;
  background: #f5f5f5;
}

.size-pill--active {
  color: #3c9cff;
  background: #eaf4ff;
}

.ring {
  position: relative;
  width: 380rpx;
  height: 380rpx;
  border: 4rpx dashed #9a9a9a;
  border-radius: 50%;
}

.ring-bead {
  position: absolute;
  width: 88rpx;
  height: 88rpx;
  margin-left: -44rpx;
  margin-top: -44rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 1rpx solid #cccccc;
  color: #666666;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
}

.ring-bead-size {
  font-size: 18rpx;
  font-weight: 600;
}

.ring-bead-name {
  margin-top: 4rpx;
  font-size: 14rpx;
}

.ring-bead--selected {
  border-color: #3c9cff;
  color: #3c9cff;
  box-shadow: 0 0 0 4rpx rgba(60, 156, 255, 0.2);
}

/* 落位预览：示意级，后续用更佳视觉替换 */
.ring-drop-preview {
  position: absolute;
  width: 88rpx;
  height: 88rpx;
  margin-left: -44rpx;
  margin-top: -44rpx;
  border-radius: 50%;
  border: 2rpx dashed #3c9cff;
  background: rgba(60, 156, 255, 0.12);
  box-sizing: border-box;
}

.drag-bead {
  position: fixed;
  width: 88rpx;
  height: 88rpx;
  margin-left: -44rpx;
  margin-top: -44rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 2rpx solid #3c9cff;
  color: #3c9cff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
  z-index: 40;
  pointer-events: none;
}

.drag-bead--delete-over {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.right-tools {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  bottom: 16rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.setting-popover-wrap {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.setting-modal {
  position: absolute;
  top: 24rpx;
  right: 180rpx;
  width: 460rpx;
  max-width: calc(100vw - 180rpx);
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-sizing: border-box;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.12);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 28rpx;
}

.drawer-title {
  font-size: 30rpx;
  color: #222222;
  font-weight: 600;
}

.drawer-item {
  margin-bottom: 28rpx;
}

.drawer-label {
  display: block;
  margin-bottom: 12rpx;
  font-size: 24rpx;
  color: #555555;
}

.drawer-input {
  height: 70rpx;
  border: 1rpx solid #e4e4e4;
  border-radius: 10rpx;
  padding: 0 16rpx;
  font-size: 24rpx;
  color: #333333;
}

.mode-row {
  display: flex;
  gap: 12rpx;
}

.mode-btn {
  padding: 12rpx 24rpx;
  border: 1rpx solid #e4e4e4;
  border-radius: 10rpx;
  font-size: 24rpx;
  color: #666666;
}

.mode-btn--active {
  color: #3c9cff;
  border-color: #3c9cff;
  background: #eaf4ff;
}

.tool-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12rpx;
}

.tool-btn {
  min-width: 96rpx;
  padding: 10rpx 16rpx;
  border-radius: 12rpx;
  background: #ffffff;
  color: #333333;
  font-size: 24rpx;
  text-align: center;
  border: 1rpx solid #e5e5e5;
}

.tool-btn--delete-active {
  color: #ff4d4f;
  border-color: #ffb3b3;
  background: #fff2f0;
}

.bottom-area {
  flex: 44;
  min-height: 0;
  padding: 0;
  box-sizing: border-box;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.category-row {
  display: flex;
  align-items: stretch;
  width: 100%;
  gap: 0;
  padding: 0;
  border-bottom: 1rpx solid #eeeeee;
}

.category-tabs {
  flex: 1;
  display: flex;
}

.category-tab {
  flex: 1;
  padding: 16rpx 0;
  font-size: 24rpx;
  color: #666666;
  background: #f2f2f2;
  text-align: center;
  border-right: 1rpx solid #e8e8e8;
}

.category-tab:last-child {
  border-right: 0;
}

.category-tab--active {
  color: #3c9cff;
  background: #eaf4ff;
}

.category-actions {
  display: flex;
}

.action-btn {
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: #555555;
  background: #ffffff;
  border-left: 1rpx solid #e8e8e8;
}

.table-placeholder {
  flex: 1;
  min-height: 0;
  border-top: 1rpx solid #efefef;
  background: #ffffff;
}

.table-content {
  height: 100%;
  display: flex;
}

.sub-category-col {
  width: 190rpx;
  height: 100%;
  border-right: 1rpx solid #efefef;
  background: #fafafa;
}

.sub-category-item {
  padding: 20rpx 14rpx;
  font-size: 24rpx;
  color: #555555;
  border-bottom: 1rpx solid #f0f0f0;
}

.sub-category-item--active {
  color: #3c9cff;
  background: #eaf4ff;
}

.goods-placeholder {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.goods-grid {
  padding: 16rpx;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  box-sizing: border-box;
}

.goods-card {
  border: 1rpx solid #e9e9e9;
  border-radius: 12rpx;
  background: #ffffff;
  overflow: hidden;
}

.goods-card--active {
  border-color: #3c9cff;
  box-shadow: 0 0 0 2rpx rgba(60, 156, 255, 0.15);
}

.goods-detail-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-detail-modal {
  width: 76%;
  max-width: 560rpx;
  min-height: 320rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 12rpx 30rpx rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.goods-detail-header {
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #eeeeee;
}

.goods-detail-title {
  font-size: 28rpx;
  color: #222222;
  font-weight: 600;
}

.goods-detail-body {
  min-height: 240rpx;
}

.goods-image {
  aspect-ratio: 1 / 1;
  background: #f3f3f3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-circle {
  width: 70%;
  height: 70%;
  border-radius: 50%;
  border: 2rpx solid #d7d7d7;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.goods-circle-text {
  color: #7a7a7a;
  font-size: 22rpx;
}

.goods-name {
  display: block;
  padding: 10rpx 8rpx;
  font-size: 22rpx;
  color: #444444;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
