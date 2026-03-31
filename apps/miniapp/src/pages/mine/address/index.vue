<template>
  <view class="page-root">
    <view class="nav-divider" />
    <scroll-view class="list-scroll" scroll-y :show-scrollbar="false" :enhanced="true">
      <view class="page-inner">
        <view
          v-for="item in addressList"
          :key="item.id"
          class="addr-card"
        >
          <view class="row-fields">
            <view class="field field--quarter">
              <text class="field-value field-value--ellipsis">{{ item.name }}</text>
            </view>
            <view class="field field--quarter">
              <text class="field-value field-value--ellipsis">{{ item.phone }}</text>
            </view>
            <view class="field field--quarter">
              <view class="field-value-wrap">
                <text v-if="item.isDefault" class="tag tag-default">默认</text>
                <text v-else class="field-placeholder">—</text>
              </view>
            </view>
            <view class="field field--quarter">
              <text class="field-value field-value--ellipsis">{{ item.tag }}</text>
            </view>
          </view>

          <view class="row-address">
            <text class="address-text">{{ item.detail }}</text>
          </view>

          <view class="row-actions">
            <text
              class="action-left"
              :class="{ disabled: item.isDefault }"
              @tap="onSetDefault(item)"
            >{{ item.isDefault ? '已是默认' : '设为默认' }}</text>
            <view class="action-right">
              <text class="action-link" @tap="onDelete(item)">删除</text>
              <text class="action-gap" />
              <text class="action-link" @tap="onCopy(item)">复制</text>
              <text class="action-gap" />
              <text class="action-link" @tap="onEdit(item)">修改</text>
            </view>
          </view>
        </view>

        <view
          v-if="addressList.length === 0"
          class="addr-card add-card"
          @tap="openAddAddressPage"
        >
          <view class="add-body">
            <view class="add-plus-cell">
              <view class="add-plus-box">
                <text class="add-plus-icon">+</text>
              </view>
            </view>
            <view class="add-hint-wrap">
              <text class="add-hint">添加收货地址（占位）</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="pill-add-btn" @tap="openAddAddressPage">
        <text class="pill-add-text">+新增收货地址</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * 收货地址列表页。
 * TODO: 全页对接后端 — 列表 GET；设默认 / 删除 / 编辑保存见各 handler 内注释。
 * 下列 `addressList` 仅为本地占位；字段名可与后端 DTO 对齐后替换。
 */
export type AddressItem = {
  id: string
  name: string
  phone: string
  isDefault: boolean
  tag: string
  detail: string
}

// TODO: 占位数据；接入后端后 GET /addresses（示例）并赋值
const addressList = ref<AddressItem[]>([
  {
    id: '1',
    name: '张三',
    phone: '138****8000',
    isDefault: true,
    tag: '家',
    detail: '广东省深圳市南山区科技园南路88号水晶大厦A座1201室',
  },
  {
    id: '2',
    name: '李四',
    phone: '159****6000',
    isDefault: false,
    tag: '公司',
    detail: '北京市朝阳区建国路100号示例商务中心3层',
  },
  {
    id: '3',
    name: '王五',
    phone: '186****1234',
    isDefault: false,
    tag: '学校',
    detail: '上海市杨浦区邯郸路220号复旦大学本部南区宿舍区',
  },
  {
    id: '4',
    name: '赵六',
    phone: '177****5678',
    isDefault: false,
    tag: '家',
    detail: '浙江省杭州市西湖区文三路259号昌地火炬大厦1号楼',
  },
  {
    id: '5',
    name: '陈七',
    phone: '136****9012',
    isDefault: false,
    tag: '父母家',
    detail: '四川省成都市武侯区天府大道中段1366号天府软件园E区',
  },
  {
    id: '6',
    name: '周八',
    phone: '199****3456',
    isDefault: false,
    tag: '公司',
    detail: '湖北省武汉市东湖新技术开发区光谷大道303号光谷芯中心',
  },
  {
    id: '7',
    name: '吴九',
    phone: '155****7890',
    isDefault: false,
    tag: '仓库',
    detail: '江苏省苏州市工业园区星湖街328号创意产业园A2栋一层收货处',
  },
  {
    id: '8',
    name: '郑十',
    phone: '188****2468',
    isDefault: false,
    tag: '家',
    detail: '福建省厦门市思明区软件园二期望海路10号楼',
  },
  {
    id: '9',
    name: '钱十一',
    phone: '133****1357',
    isDefault: false,
    tag: '门店',
    detail: '陕西省西安市雁塔区高新六路52号3幢1单元（自提点）',
  },
  {
    id: '10',
    name: '孙十二',
    phone: '166****9753',
    isDefault: false,
    tag: '公司',
    detail: '重庆市渝北区黄山大道中段杨柳路2号综合研发楼B塔',
  },
])

function onSetDefault(item: AddressItem) {
  if (item.isDefault)
    return
  // TODO: 接入后端 — 调用设默认接口成功后，再更新本地列表或重新拉列表
  addressList.value = addressList.value.map((a) => ({
    ...a,
    isDefault: a.id === item.id,
  }))
}

function onDelete(item: AddressItem) {
  // TODO: 接入后端 — 弹窗确认后 DELETE，成功后从列表移除或重新拉列表
  void item
  uni.showToast({ title: '敬请期待', icon: 'none' })
}

function onCopy(item: AddressItem) {
  const text = `${item.name} ${item.phone} ${item.detail}`
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'none' })
    },
  })
}

function onEdit(item: AddressItem) {
  // TODO: 接入后端 — 跳转编辑页并带 id，保存时 PUT/PATCH
  void item
  uni.showToast({ title: '敬请期待', icon: 'none' })
}

function openAddAddressPage() {
  uni.navigateTo({ url: '/pages/mine/address/add' })
}
</script>

<style scoped lang="scss">
.page-root {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.nav-divider {
  flex-shrink: 0;
  width: 100%;
  height: 2px;
  background-color: #f7f7f7;
}

.list-scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.page-inner {
  padding: 24rpx 24rpx calc(32rpx + 88rpx + 40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 2px solid #f7f7f7;
  box-sizing: border-box;
}

.pill-add-btn {
  height: 88rpx;
  border-radius: 9999rpx;
  background-color: #3c9cff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.pill-add-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #ffffff;
}

.addr-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  padding: 24rpx 24rpx 20rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.add-card {
  margin-bottom: 0;
  background-color: transparent;
  box-shadow: none;
  border: 2rpx dashed #cccccc;
}

.row-fields {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.field {
  flex: 1;
  min-width: 0;
  padding-right: 12rpx;
  box-sizing: border-box;
}

.field--quarter:last-child {
  padding-right: 0;
}

.field-value--ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-value {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.35;
}

.field-value-wrap {
  min-height: 38rpx;
  display: flex;
  align-items: center;
}

.field-placeholder {
  font-size: 28rpx;
  color: #cccccc;
}

.tag-default {
  display: inline-block;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: #3c9cff;
  background-color: #f0f7ff;
  border-radius: 8rpx;
}

.row-address {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.address-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
}

.row-actions {
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.action-left {
  font-size: 26rpx;
  color: #3c9cff;
}

.action-left.disabled {
  color: #bbbbbb;
}

.action-right {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.action-link {
  font-size: 26rpx;
  color: #666666;
}

.action-gap {
  width: 24rpx;
}

.add-body {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 200rpx;
}

.add-plus-cell {
  flex-shrink: 0;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-plus-box {
  border: 2rpx dashed #cccccc;
  border-radius: 12rpx;
  padding: 12rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.add-plus-icon {
  font-size: 96rpx;
  line-height: 1;
  font-weight: 200;
  color: #c8c8c8;
}

.add-hint-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.add-hint {
  font-size: 34rpx;
  font-weight: 500;
  line-height: 1.45;
  color: #666666;
}
</style>
