<template>
  <view class="page-root">
    <scroll-view
      class="form-scroll"
      scroll-y
      :show-scrollbar="false"
    >
      <view class="page-inner">
        <view class="card">
      <view class="cell">
        <text class="cell-label">收货人</text>
        <input
          v-model="receiverName"
          class="cell-input"
          type="text"
          placeholder="请填写收货人姓名"
          placeholder-class="input-ph"
          maxlength="20"
        />
      </view>
      <view class="cell-line" />
      <view class="cell cell--phone">
        <text class="cell-label">手机号码</text>
        <view class="phone-right">
          <picker
            mode="selector"
            :range="dialLabels"
            :value="dialIndex"
            @change="onDialChange"
          >
            <view class="dial-trigger">
              <text class="dial-code">{{ dialCodes[dialIndex] }}</text>
              <text class="dial-arrow">▼</text>
            </view>
          </picker>
          <view class="dial-sep" />
          <input
            v-model="phoneNumber"
            class="cell-input cell-input--phone"
            type="number"
            placeholder="请填写手机号码"
            placeholder-class="input-ph"
            maxlength="11"
          />
        </view>
      </view>
    </view>

    <view class="card">
      <view class="cell cell--address">
        <text class="cell-label">地址</text>
        <input
          v-model="deliveryAddress"
          class="cell-input cell-input--address"
          type="text"
          placeholder="请输入收货地址"
          placeholder-class="input-ph"
          maxlength="120"
        />
        <view class="map-pick-btn" @tap.stop="onMapPick">
          <text class="map-pick-text">地图选址</text>
        </view>
      </view>
      <view class="cell-line" />
      <view class="cell">
        <text class="cell-label">门牌号</text>
        <input
          v-model="buildingDetail"
          class="cell-input"
          type="text"
          placeholder="例：5栋201室"
          placeholder-class="input-ph"
          maxlength="50"
        />
      </view>
      <view class="cell-line" />
      <view class="cell cell--paste">
        <text class="cell-label cell-label--paste">粘贴框</text>
        <view class="paste-col">
          <textarea
            v-model="pasteText"
            class="paste-textarea"
            placeholder="可粘贴完整地址，便于识别或自行填写"
            placeholder-class="input-ph"
            :maxlength="200"
          />
          <text class="paste-backend-hint">
            智能识别将接入后端：提交原文 → 服务端解析姓名/手机/省市区等 → 回填本页（待实现）
          </text>
        </view>
      </view>
    </view>

    <view class="card card--last">
      <view class="cell cell--switch-row">
        <text class="cell-label">设为默认</text>
        <view class="cell-switch-spacer" />
        <view class="switch-slot">
          <switch
            :checked="isDefaultAddress"
            color="#3c9cff"
            @change="onDefaultSwitch"
          />
        </view>
      </view>
      <view class="cell-line" />
      <view class="cell cell--tags">
        <text class="cell-label cell-label--tags">标签</text>
        <view class="tags-wrap">
          <view
            v-for="opt in tagOptions"
            :key="opt.key"
            class="tag-chip"
            :class="{ 'tag-chip--active': addressTagPreset === opt.key }"
            @tap="selectTagPreset(opt.key)"
          >
            <text class="tag-chip-text">{{ opt.label }}</text>
          </view>
        </view>
      </view>
      <template v-if="addressTagPreset === 'custom'">
        <view class="cell-line" />
        <view class="cell">
          <text class="cell-label">自定义</text>
          <input
            v-model="customTagText"
            class="cell-input"
            type="text"
            placeholder="请输入标签名称"
            placeholder-class="input-ph"
            maxlength="12"
          />
        </view>
      </template>
    </view>
      </view>
    </scroll-view>

    <view class="footer-bar">
      <view class="save-btn" @tap="onSaveAddress">
        <text class="save-btn-text">保存收货地址</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/**
 * TODO（后端阶段）
 * - 粘贴框：POST 原始文本到解析接口，返回结构化字段后写入 receiverName / phoneNumber / deliveryAddress 等
 * - 可选：前端「一键识别」按钮调同一接口；词库与算法放服务端，见 docs/TODO-PLACEHOLDERS.md
 */

// 区号选项：展示「+86 中国大陆」便于辨认，输入侧仍用纯 +xx
const dialCodes = ['+86', '+852', '+853', '+886', '+81', '+65', '+44', '+1'] as const
const dialLabels = dialCodes.map(code => `${code} ${dialHint(code)}`)

function dialHint(code: string): string {
  const m: Record<string, string> = {
    '+86': '中国大陆',
    '+852': '中国香港',
    '+853': '中国澳门',
    '+886': '中国台湾',
    '+81': '日本',
    '+65': '新加坡',
    '+44': '英国',
    '+1': '美国/加拿大',
  }
  return m[code] ?? ''
}

const dialIndex = ref(0)
const receiverName = ref('')
const phoneNumber = ref('')

const deliveryAddress = ref('')
const buildingDetail = ref('')
const pasteText = ref('')

const isDefaultAddress = ref(false)

const tagOptions = [
  { key: 'home', label: '家' },
  { key: 'school', label: '学校' },
  { key: 'company', label: '公司' },
  { key: 'custom', label: '自定义' },
] as const

type AddressTagPreset = (typeof tagOptions)[number]['key']

const addressTagPreset = ref<AddressTagPreset>('home')
const customTagText = ref('')

function onDefaultSwitch(e: { detail?: { value?: boolean | string } }) {
  const v = e.detail?.value
  isDefaultAddress.value = typeof v === 'boolean' ? v : v === true || v === 'true'
}

function selectTagPreset(key: AddressTagPreset) {
  addressTagPreset.value = key
  if (key !== 'custom')
    customTagText.value = ''
}

function onDialChange(e: { detail: { value: string } }) {
  dialIndex.value = Number(e.detail.value) || 0
}

function onMapPick() {
  uni.chooseLocation({
    success(res) {
      const name = (res.name || '').trim()
      const addr = (res.address || '').trim()
      deliveryAddress.value = [name, addr].filter(Boolean).join(' ').trim()
        || addr
        || name
    },
    fail(err: { errMsg?: string }) {
      const msg = err?.errMsg || ''
      if (msg.includes('cancel') || msg.includes('取消'))
        return
      if (msg.includes('auth deny') || msg.includes('permission') || msg.includes('authorize'))
        uni.showToast({ title: '需要位置权限才能选点', icon: 'none' })
      else
        uni.showToast({ title: '地图选点失败', icon: 'none' })
    },
  })
}

function onSaveAddress() {
  // TODO: 校验后 POST 收货地址，成功后 uni.navigateBack
  uni.showToast({ title: '敬请期待', icon: 'none' })
}

// TODO: 提交字段：区号、手机、地址、门牌号、粘贴框、isDefaultAddress、标签等；粘贴智能识别见上文 TODO
</script>

<style scoped lang="scss">
.page-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f7f7f7;
  box-sizing: border-box;
}

.form-scroll {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.page-inner {
  padding: 24rpx 24rpx 32rpx;
  box-sizing: border-box;
}

.footer-bar {
  flex-shrink: 0;
  width: 100%;
  padding: 20rpx 40rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background-color: #ffffff;
  border-top: 2px solid #f7f7f7;
  box-sizing: border-box;
}

.save-btn {
  height: 88rpx;
  border-radius: 9999rpx;
  background-color: #3c9cff;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.save-btn-text {
  font-size: 30rpx;
  font-weight: 500;
  color: #ffffff;
}

.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.card--last {
  margin-bottom: 0;
}

.cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-height: 100rpx;
  padding: 20rpx 28rpx;
  box-sizing: border-box;
}

.cell--phone {
  align-items: center;
}

.cell-label {
  width: 168rpx;
  flex-shrink: 0;
  font-size: 30rpx;
  color: #333333;
}

.cell-input {
  flex: 1;
  min-width: 0;
  height: 60rpx;
  font-size: 30rpx;
  color: #333333;
  text-align: right;
}

.cell-input--phone {
  text-align: left;
}

.input-ph {
  color: #bbbbbb;
  font-size: 30rpx;
}

.cell-line {
  height: 1rpx;
  margin-left: 28rpx;
  margin-right: 28rpx;
  background-color: #f0f0f0;
}

.phone-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.dial-trigger {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  padding: 8rpx 0;
  padding-right: 16rpx;
}

.dial-code {
  font-size: 30rpx;
  color: #333333;
  margin-right: 8rpx;
}

.dial-arrow {
  font-size: 20rpx;
  color: #999999;
  line-height: 1;
  transform: scale(0.85);
}

.dial-sep {
  width: 1rpx;
  height: 36rpx;
  flex-shrink: 0;
  background-color: #e8e8e8;
  margin-right: 20rpx;
}

.cell--address {
  align-items: center;
}

.cell-input--address {
  text-align: left;
  margin-right: 12rpx;
}

.map-pick-btn {
  flex-shrink: 0;
  padding: 10rpx 20rpx;
  border-radius: 9999rpx;
  border: 1rpx solid #3c9cff;
  box-sizing: border-box;
}

.map-pick-text {
  font-size: 24rpx;
  color: #3c9cff;
}

.cell--paste {
  align-items: flex-start;
  min-height: 200rpx;
  padding-top: 24rpx;
  padding-bottom: 24rpx;
}

.cell-label--paste {
  padding-top: 6rpx;
}

.paste-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.paste-textarea {
  width: 100%;
  min-height: 160rpx;
  font-size: 28rpx;
  line-height: 1.5;
  color: #333333;
  box-sizing: border-box;
}

.paste-backend-hint {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.45;
  color: #999999;
}

.cell--switch-row {
  position: relative;
  z-index: 1;
  background-color: #ffffff;
}

.cell-switch-spacer {
  flex: 1;
  min-width: 0;
}

/* 裁剪原生 switch 异常绘制层，避免开启后左侧出现白条遮挡 */
.switch-slot {
  width: 120rpx;
  height: 56rpx;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.cell--tags {
  align-items: flex-start;
  padding-top: 24rpx;
  padding-bottom: 24rpx;
}

.cell-label--tags {
  padding-top: 10rpx;
}

.tags-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16rpx;
}

.tag-chip {
  padding: 12rpx 28rpx;
  border-radius: 9999rpx;
  border: 1rpx solid #e5e5e5;
  background-color: #fafafa;
  box-sizing: border-box;
}

.tag-chip--active {
  border-color: #3c9cff;
  background-color: #f0f7ff;
}

.tag-chip-text {
  font-size: 26rpx;
  color: #666666;
}

.tag-chip--active .tag-chip-text {
  color: #3c9cff;
  font-weight: 500;
}
</style>
