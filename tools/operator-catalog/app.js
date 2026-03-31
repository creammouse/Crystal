/**
 * Crystal 经营者资料小工具 — 纯前端，数据存浏览器 + 可导出 JSON
 */
const STORAGE_KEY = 'crystal-operator-catalog-v1'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function emptyState() {
  return {
    version: 1,
    diy: {
      majors: [],
      subs: [],
      items: [],
    },
    mall: {
      categories: [],
      products: [],
    },
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw)
      return emptyState()
    const data = JSON.parse(raw)
    if (!data.diy)
      data.diy = emptyState().diy
    if (!data.mall)
      data.mall = emptyState().mall
    data.diy.majors = data.diy.majors || []
    data.diy.subs = data.diy.subs || []
    data.diy.items = data.diy.items || []
    data.mall.categories = data.mall.categories || []
    data.mall.products = data.mall.products || []
    return data
  }
  catch {
    return emptyState()
  }
}

let state = loadState()
let editingDiyItemId = null
let editingMallProductId = null

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function toast(msg) {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(el._t)
  el._t = setTimeout(() => el.classList.remove('show'), 2200)
}

function majorName(id) {
  const m = state.diy.majors.find(x => x.id === id)
  return m ? m.name : '（未选大类）'
}

function subName(id) {
  const s = state.diy.subs.find(x => x.id === id)
  return s ? s.name : '（未选子类）'
}

function mallCatName(id) {
  const c = state.mall.categories.find(x => x.id === id)
  return c ? c.name : '（未选分类）'
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('is-active', t.dataset.tab === name)
  })
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('is-visible', p.id === `panel-${name}`)
  })
}

/** 载入 DIY 配料编辑并滚到表单 */
function beginEditDiyItem(id, { quiet } = {}) {
  const it = state.diy.items.find(x => x.id === id)
  if (!it)
    return
  switchTab('diy')
  editingDiyItemId = it.id
  document.getElementById('diy-item-major').value = it.majorId || ''
  fillDiySelects()
  document.getElementById('diy-item-sub').value = it.subId || ''
  document.getElementById('diy-item-name').value = it.name || ''
  document.getElementById('diy-item-material').value = it.material || ''
  document.getElementById('diy-item-intro').value = it.intro || ''
  document.getElementById('diy-item-sizes').value = it.sizes || ''
  document.getElementById('diy-item-price').value = it.price || ''
  document.getElementById('diy-item-remark').value = it.remark || ''
  document.getElementById('diy-item-bead').checked = !!it.isBead
  document.getElementById('diy-sizes-wrap').classList.toggle('hidden', !it.isBead)
  diyItemImages = Array.isArray(it.images) ? [...it.images] : []
  renderDiyImageThumbs()
  document.getElementById('diy-form-submit').textContent = '保存修改'
  requestAnimationFrame(() => {
    const el = document.getElementById('diy-edit-anchor')
    if (el)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  if (!quiet)
    toast('已在左侧打开编辑表单')
}

/** 载入商城商品编辑并滚到表单 */
function beginEditMallProduct(id, { quiet } = {}) {
  const p = state.mall.products.find(x => x.id === id)
  if (!p)
    return
  switchTab('mall')
  editingMallProductId = p.id
  fillMallProductCategorySelect()
  document.getElementById('mall-product-category').value = p.categoryId || ''
  document.getElementById('mall-product-name').value = p.name || ''
  document.getElementById('mall-product-intro').value = p.intro || ''
  document.getElementById('mall-product-material').value = p.material || ''
  document.getElementById('mall-product-price').value = p.price || ''
  document.getElementById('mall-product-remark').value = p.remark || ''
  mallProductImages = Array.isArray(p.images) ? [...p.images] : []
  renderMallImageThumbs()
  document.getElementById('mall-form-submit').textContent = '保存修改'
  requestAnimationFrame(() => {
    const el = document.getElementById('mall-edit-anchor')
    if (el)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
  if (!quiet)
    toast('已在左侧打开编辑表单')
}

function sideMajorLine(text) {
  const d = document.createElement('div')
  d.className = 'side-line side-line-major'
  d.textContent = text
  return d
}

function sideSubLine(text) {
  const d = document.createElement('div')
  d.className = 'side-line side-line-sub'
  d.textContent = text
  return d
}

function sideDiyItemButton(it) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'side-line side-line-item side-click'
  const bits = [it.name || '（无名称）']
  if (it.isBead)
    bits.push('珠')
  if (it.price)
    bits.push(`¥${it.price}`)
  b.textContent = bits.join(' · ')
  b.addEventListener('click', () => beginEditDiyItem(it.id))
  return b
}

function renderSidebar() {
  const diyRoot = document.getElementById('sidebar-diy-tree')
  const mallRoot = document.getElementById('sidebar-mall-tree')
  if (!diyRoot || !mallRoot)
    return

  diyRoot.innerHTML = ''
  mallRoot.innerHTML = ''

  const majors = state.diy.majors
  const subs = state.diy.subs
  const items = state.diy.items
  const listedDiy = new Set()

  if (!majors.length && !subs.length && !items.length) {
    const p = document.createElement('p')
    p.className = 'side-empty'
    p.textContent = '暂无'
    diyRoot.appendChild(p)
  }
  else {
    majors.forEach((major) => {
      diyRoot.appendChild(sideMajorLine(`大类：${major.name || '（无名称）'}`))
      const subsHere = subs.filter(s => s.majorId === major.id)
      subsHere.forEach((sub) => {
        diyRoot.appendChild(sideSubLine(`└ 子类：${sub.name || '（无名称）'}`))
        items
          .filter(i => i.majorId === major.id && i.subId === sub.id)
          .forEach((it) => {
            listedDiy.add(it.id)
            diyRoot.appendChild(sideDiyItemButton(it))
          })
      })
      const orphanUnderMajor = items.filter(
        i =>
          i.majorId === major.id
          && (!i.subId || !subsHere.some(s => s.id === i.subId))
          && !listedDiy.has(i.id),
      )
      if (orphanUnderMajor.length) {
        diyRoot.appendChild(sideSubLine('└ 仅归本大类（未对应子类）'))
        orphanUnderMajor.forEach((it) => {
          listedDiy.add(it.id)
          diyRoot.appendChild(sideDiyItemButton(it))
        })
      }
    })

    const unSubs = subs.filter(
      s => !s.majorId || !majors.some(m => m.id === s.majorId),
    )
    if (unSubs.length) {
      diyRoot.appendChild(sideMajorLine('未指定大类 · 子类'))
      unSubs.forEach((sub) => {
        diyRoot.appendChild(sideSubLine(`└ ${sub.name || '（无名称）'}`))
        items
          .filter(i => i.subId === sub.id && !listedDiy.has(i.id))
          .forEach((it) => {
            listedDiy.add(it.id)
            diyRoot.appendChild(sideDiyItemButton(it))
          })
      })
    }

    const restDiy = items.filter(i => !listedDiy.has(i.id))
    if (restDiy.length) {
      diyRoot.appendChild(sideMajorLine('其他配料（未选大类或数据不齐）'))
      restDiy.forEach((it) => {
        listedDiy.add(it.id)
        diyRoot.appendChild(sideDiyItemButton(it))
      })
    }
  }

  const cats = state.mall.categories
  const prods = state.mall.products
  const listedProd = new Set()

  if (!cats.length && !prods.length) {
    const p = document.createElement('p')
    p.className = 'side-empty'
    p.textContent = '暂无'
    mallRoot.appendChild(p)
  }
  else {
    cats.forEach((cat) => {
      mallRoot.appendChild(sideMajorLine(`分类：${cat.name || '（无名称）'}`))
      prods
        .filter(p => p.categoryId === cat.id)
        .forEach((p) => {
          listedProd.add(p.id)
          const b = document.createElement('button')
          b.type = 'button'
          b.className = 'side-line side-line-item side-click'
          const tail = p.price ? ` · ¥${p.price}` : ''
          b.textContent = `${p.name || '（无名称）'}${tail}`
          b.addEventListener('click', () => beginEditMallProduct(p.id))
          mallRoot.appendChild(b)
        })
    })
    const loose = prods.filter(p => !listedProd.has(p.id))
    if (loose.length) {
      mallRoot.appendChild(sideMajorLine('未选分类 · 商品'))
      loose.forEach((p) => {
        listedProd.add(p.id)
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'side-line side-line-item side-click'
        const tail = p.price ? ` · ¥${p.price}` : ''
        b.textContent = `${p.name || '（无名称）'}${tail}`
        b.addEventListener('click', () => beginEditMallProduct(p.id))
        mallRoot.appendChild(b)
      })
    }
  }
}

// ---------- render DIY ----------
function renderDiyMajors() {
  const ul = document.getElementById('diy-major-list')
  ul.innerHTML = ''
  state.diy.majors.forEach((m) => {
    const li = document.createElement('li')
    li.innerHTML = `<span>${escapeHtml(m.name || '（无名称）')}</span>`
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn-danger btn-sm'
    btn.textContent = '删除'
    btn.addEventListener('click', () => {
      state.diy.majors = state.diy.majors.filter(x => x.id !== m.id)
      state.diy.subs = state.diy.subs.filter(s => s.majorId !== m.id)
      saveState()
      renderAll()
    })
    li.appendChild(btn)
    ul.appendChild(li)
  })
}

function renderDiySubs() {
  const ul = document.getElementById('diy-sub-list')
  ul.innerHTML = ''
  state.diy.subs.forEach((s) => {
    const li = document.createElement('li')
    li.innerHTML = `<span>${escapeHtml(majorName(s.majorId))} → ${escapeHtml(s.name || '（无名称）')}</span>`
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn-danger btn-sm'
    btn.textContent = '删除'
    btn.addEventListener('click', () => {
      state.diy.subs = state.diy.subs.filter(x => x.id !== s.id)
      saveState()
      renderAll()
    })
    li.appendChild(btn)
    ul.appendChild(li)
  })
}

function fillDiySelects() {
  const majorSel = document.getElementById('diy-item-major')
  const subSel = document.getElementById('diy-item-sub')
  const subAddMajor = document.getElementById('diy-sub-major')

  const curMajor = majorSel.value
  const curSub = subSel.value
  const curAddMajor = subAddMajor.value

  majorSel.innerHTML = '<option value="">— 可不选 —</option>'
  subAddMajor.innerHTML = '<option value="">— 可不选 —</option>'
  state.diy.majors.forEach((m) => {
    const o = document.createElement('option')
    o.value = m.id
    o.textContent = m.name || '（空名称）'
    majorSel.appendChild(o.cloneNode(true))
    subAddMajor.appendChild(o)
  })
  majorSel.value = state.diy.majors.some(m => m.id === curMajor) ? curMajor : ''
  subAddMajor.value = state.diy.majors.some(m => m.id === curAddMajor) ? curAddMajor : ''

  const majorId = majorSel.value
  subSel.innerHTML = '<option value="">— 可不选 —</option>'
  state.diy.subs.filter(s => !majorId || s.majorId === majorId).forEach((s) => {
    const o = document.createElement('option')
    o.value = s.id
    o.textContent = s.name || '（空名称）'
    subSel.appendChild(o)
  })
  subSel.value = state.diy.subs.some(s => s.id === curSub && (!majorId || s.majorId === majorId)) ? curSub : ''
}

function renderDiyItems() {
  const box = document.getElementById('diy-item-cards')
  box.innerHTML = ''
  state.diy.items.forEach((it) => {
    const div = document.createElement('div')
    div.className = 'item-card'
    const imgCount = (it.images && it.images.length) || 0
    div.innerHTML = `
      <div class="item-card-head">
        <div>
          <p class="item-card-title">${escapeHtml(it.name || '（无名称）')}</p>
          <p class="item-card-meta">${escapeHtml(majorName(it.majorId))} · ${escapeHtml(subName(it.subId))}
            ${it.isBead ? ' · 珠' : ''}
            ${it.price ? ` · ¥${escapeHtml(it.price)}` : ''}
            ${imgCount ? ` · 图${imgCount}张` : ''}</p>
        </div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-diy="${it.id}">编辑</button>
          <button type="button" class="btn btn-danger btn-sm" data-del-diy="${it.id}">删除</button>
        </div>
      </div>
    `
    box.appendChild(div)
  })
  box.querySelectorAll('[data-edit-diy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-diy')
      beginEditDiyItem(id, { quiet: true })
      toast('已载入编辑，改完点保存修改')
    })
  })
  box.querySelectorAll('[data-del-diy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del-diy')
      state.diy.items = state.diy.items.filter(x => x.id !== id)
      if (editingDiyItemId === id)
        resetDiyItemForm()
      saveState()
      renderAll()
      toast('已删除')
    })
  })
}

let diyItemImages = []

function renderDiyImageThumbs() {
  const wrap = document.getElementById('diy-image-thumbs')
  wrap.innerHTML = ''
  diyItemImages.forEach((src, i) => {
    const d = document.createElement('div')
    d.className = 'thumb-wrap'
    const img = document.createElement('img')
    img.src = src
    img.alt = ''
    const rm = document.createElement('button')
    rm.type = 'button'
    rm.className = 'rm'
    rm.textContent = '×'
    rm.addEventListener('click', () => {
      diyItemImages.splice(i, 1)
      renderDiyImageThumbs()
    })
    d.appendChild(img)
    d.appendChild(rm)
    wrap.appendChild(d)
  })
}

function resetDiyItemForm() {
  editingDiyItemId = null
  document.getElementById('diy-item-name').value = ''
  document.getElementById('diy-item-material').value = ''
  document.getElementById('diy-item-intro').value = ''
  document.getElementById('diy-item-sizes').value = ''
  document.getElementById('diy-item-price').value = ''
  document.getElementById('diy-item-remark').value = ''
  document.getElementById('diy-item-bead').checked = false
  document.getElementById('diy-sizes-wrap').classList.add('hidden')
  diyItemImages = []
  renderDiyImageThumbs()
  document.getElementById('diy-form-submit').textContent = '添加配料项'
}

// ---------- render Mall ----------
function renderMallCategories() {
  const ul = document.getElementById('mall-cat-list')
  ul.innerHTML = ''
  state.mall.categories.forEach((c) => {
    const li = document.createElement('li')
    li.innerHTML = `<span>${escapeHtml(c.name || '（无名称）')}</span>`
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn btn-danger btn-sm'
    btn.textContent = '删除'
    btn.addEventListener('click', () => {
      state.mall.categories = state.mall.categories.filter(x => x.id !== c.id)
      saveState()
      renderAll()
    })
    li.appendChild(btn)
    ul.appendChild(li)
  })
}

function fillMallProductCategorySelect() {
  const sel = document.getElementById('mall-product-category')
  const cur = sel.value
  sel.innerHTML = '<option value="">— 可不选 —</option>'
  state.mall.categories.forEach((c) => {
    const o = document.createElement('option')
    o.value = c.id
    o.textContent = c.name || '（空名称）'
    sel.appendChild(o)
  })
  sel.value = state.mall.categories.some(c => c.id === cur) ? cur : ''
}

let mallProductImages = []

function renderMallImageThumbs() {
  const wrap = document.getElementById('mall-image-thumbs')
  wrap.innerHTML = ''
  mallProductImages.forEach((src, i) => {
    const d = document.createElement('div')
    d.className = 'thumb-wrap'
    const img = document.createElement('img')
    img.src = src
    img.alt = ''
    const rm = document.createElement('button')
    rm.type = 'button'
    rm.className = 'rm'
    rm.textContent = '×'
    rm.addEventListener('click', () => {
      mallProductImages.splice(i, 1)
      renderMallImageThumbs()
    })
    d.appendChild(img)
    d.appendChild(rm)
    wrap.appendChild(d)
  })
}

function resetMallProductForm() {
  editingMallProductId = null
  document.getElementById('mall-product-name').value = ''
  document.getElementById('mall-product-intro').value = ''
  document.getElementById('mall-product-material').value = ''
  document.getElementById('mall-product-price').value = ''
  document.getElementById('mall-product-remark').value = ''
  mallProductImages = []
  renderMallImageThumbs()
  document.getElementById('mall-form-submit').textContent = '添加商品'
}

function renderMallProducts() {
  const box = document.getElementById('mall-product-cards')
  box.innerHTML = ''
  state.mall.products.forEach((p) => {
    const div = document.createElement('div')
    div.className = 'item-card'
    const imgCount = (p.images && p.images.length) || 0
    div.innerHTML = `
      <div class="item-card-head">
        <div>
          <p class="item-card-title">${escapeHtml(p.name || '（无名称）')}</p>
          <p class="item-card-meta">${escapeHtml(mallCatName(p.categoryId))}
            ${p.price ? ` · ¥${escapeHtml(p.price)}` : ''}
            ${imgCount ? ` · 图${imgCount}张` : ''}</p>
        </div>
        <div class="item-card-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-mall="${p.id}">编辑</button>
          <button type="button" class="btn btn-danger btn-sm" data-del-mall="${p.id}">删除</button>
        </div>
      </div>
    `
    box.appendChild(div)
  })
  box.querySelectorAll('[data-edit-mall]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-mall')
      beginEditMallProduct(id, { quiet: true })
      toast('已载入编辑')
    })
  })
  box.querySelectorAll('[data-del-mall]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-del-mall')
      state.mall.products = state.mall.products.filter(x => x.id !== id)
      if (editingMallProductId === id)
        resetMallProductForm()
      saveState()
      renderAll()
      toast('已删除')
    })
  })
}

function escapeHtml(s) {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function renderAll() {
  renderDiyMajors()
  renderDiySubs()
  fillDiySelects()
  renderDiyItems()
  renderMallCategories()
  fillMallProductCategorySelect()
  renderMallProducts()
  renderSidebar()
}

// ---------- events ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab)
  })
})

document.getElementById('diy-add-major').addEventListener('click', () => {
  const input = document.getElementById('diy-major-name')
  const name = input.value.trim()
  state.diy.majors.push({ id: uid(), name })
  input.value = ''
  saveState()
  renderAll()
  toast('已添加大类')
})

document.getElementById('diy-add-sub').addEventListener('click', () => {
  const majorId = document.getElementById('diy-sub-major').value || ''
  const input = document.getElementById('diy-sub-name')
  const name = input.value.trim()
  state.diy.subs.push({ id: uid(), majorId, name })
  input.value = ''
  saveState()
  renderAll()
  toast('已添加子类')
})

document.getElementById('diy-item-major').addEventListener('change', () => {
  fillDiySelects()
})

document.getElementById('diy-item-bead').addEventListener('change', (e) => {
  document.getElementById('diy-sizes-wrap').classList.toggle('hidden', !e.target.checked)
})

document.getElementById('diy-image-input').addEventListener('change', (e) => {
  const files = e.target.files
  if (!files || !files.length)
    return
  let left = files.length
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!f.type.startsWith('image/')) {
      left--
      if (left === 0)
        e.target.value = ''
      continue
    }
    const r = new FileReader()
    r.onload = () => {
      diyItemImages.push(r.result)
      left--
      if (left === 0) {
        renderDiyImageThumbs()
        e.target.value = ''
      }
    }
    r.readAsDataURL(f)
  }
})

document.getElementById('diy-form-cancel').addEventListener('click', () => {
  resetDiyItemForm()
  fillDiySelects()
  toast('已清空表单')
})

document.getElementById('diy-item-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const wasEdit = !!editingDiyItemId
  const majorId = document.getElementById('diy-item-major').value || ''
  const subId = document.getElementById('diy-item-sub').value || ''
  const name = document.getElementById('diy-item-name').value
  const material = document.getElementById('diy-item-material').value
  const intro = document.getElementById('diy-item-intro').value
  const sizes = document.getElementById('diy-item-sizes').value
  const price = document.getElementById('diy-item-price').value
  const remark = document.getElementById('diy-item-remark').value
  const isBead = document.getElementById('diy-item-bead').checked

  const payload = {
    id: editingDiyItemId || uid(),
    majorId,
    subId,
    name,
    material,
    intro,
    images: [...diyItemImages],
    sizes: isBead ? sizes : '',
    price,
    remark,
    isBead,
  }

  if (editingDiyItemId) {
    const idx = state.diy.items.findIndex(x => x.id === editingDiyItemId)
    if (idx >= 0)
      state.diy.items[idx] = payload
  }
  else {
    state.diy.items.push(payload)
  }
  saveState()
  resetDiyItemForm()
  document.getElementById('diy-item-major').value = ''
  fillDiySelects()
  renderAll()
  toast(wasEdit ? '已保存' : '已添加配料项')
})

document.getElementById('mall-add-cat').addEventListener('click', () => {
  const input = document.getElementById('mall-cat-name')
  const name = input.value.trim()
  state.mall.categories.push({ id: uid(), name })
  input.value = ''
  saveState()
  renderAll()
  toast('已添加分类')
})

document.getElementById('mall-image-input').addEventListener('change', (e) => {
  const files = e.target.files
  if (!files || !files.length)
    return
  let left = files.length
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!f.type.startsWith('image/')) {
      left--
      if (left === 0)
        e.target.value = ''
      continue
    }
    const r = new FileReader()
    r.onload = () => {
      mallProductImages.push(r.result)
      left--
      if (left === 0) {
        renderMallImageThumbs()
        e.target.value = ''
      }
    }
    r.readAsDataURL(f)
  }
})

document.getElementById('mall-form-cancel').addEventListener('click', () => {
  resetMallProductForm()
  fillMallProductCategorySelect()
  toast('已清空表单')
})

document.getElementById('mall-product-form').addEventListener('submit', (e) => {
  e.preventDefault()
  const wasEdit = !!editingMallProductId
  const categoryId = document.getElementById('mall-product-category').value || ''
  const name = document.getElementById('mall-product-name').value
  const intro = document.getElementById('mall-product-intro').value
  const material = document.getElementById('mall-product-material').value
  const price = document.getElementById('mall-product-price').value
  const remark = document.getElementById('mall-product-remark').value

  const payload = {
    id: editingMallProductId || uid(),
    categoryId,
    name,
    images: [...mallProductImages],
    intro,
    material,
    price,
    remark,
  }

  if (editingMallProductId) {
    const idx = state.mall.products.findIndex(x => x.id === editingMallProductId)
    if (idx >= 0)
      state.mall.products[idx] = payload
  }
  else {
    state.mall.products.push(payload)
  }
  saveState()
  resetMallProductForm()
  renderAll()
  toast(wasEdit ? '已保存' : '已添加商品')
})

function buildCatalogExportFile() {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const filename = `crystal-catalog-${new Date().toISOString().slice(0, 10)}.json`
  const file = new File([blob], filename, { type: 'application/json' })
  return { blob, filename, file }
}

function triggerDownloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

document.getElementById('btn-export').addEventListener('click', () => {
  const { blob, filename } = buildCatalogExportFile()
  triggerDownloadBlob(blob, filename)
  toast('已下载 JSON 文件')
})

/**
 * 尽量走系统「分享」把 JSON 文件交给微信；需 HTTPS 或 localhost，且多数移动浏览器才支持带文件分享。
 * 无法分享时与导出相同：下载后请用户在微信里发文件。
 */
document.getElementById('btn-share-wechat').addEventListener('click', async () => {
  const { blob, filename, file } = buildCatalogExportFile()

  if (navigator.share && typeof navigator.canShare === 'function') {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Crystal 商品资料备份',
          text: '请选择「微信」发送给朋友或文件传输助手',
        })
        toast('在分享列表里点选微信即可')
        return
      }
    }
    catch (e) {
      if (e && e.name === 'AbortError')
        return
    }
  }

  triggerDownloadBlob(blob, filename)
  toast('本设备不支持直接分享到微信，已下载文件；请打开微信 → 聊天 → 文件 发送该 JSON')
})

document.getElementById('btn-import').addEventListener('click', () => {
  document.getElementById('import-file').click()
})

document.getElementById('import-file').addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f)
    return
  const r = new FileReader()
  r.onload = () => {
    try {
      const data = JSON.parse(r.result)
      if (!data.diy || !data.mall)
        throw new Error('格式不对')
      state = {
        version: data.version || 1,
        diy: {
          majors: data.diy.majors || [],
          subs: data.diy.subs || [],
          items: data.diy.items || [],
        },
        mall: {
          categories: data.mall.categories || [],
          products: data.mall.products || [],
        },
      }
      saveState()
      resetDiyItemForm()
      resetMallProductForm()
      renderAll()
      toast('导入成功')
    }
    catch {
      toast('导入失败：请选正确的 JSON')
    }
  }
  r.readAsText(f)
})

document.getElementById('btn-clear-storage').addEventListener('click', () => {
  if (!confirm('确定清空本浏览器里保存的全部资料？（可先导出 JSON 备份）'))
    return
  state = emptyState()
  saveState()
  resetDiyItemForm()
  resetMallProductForm()
  renderAll()
  toast('已清空')
})

// init
document.querySelector('.tab[data-tab="diy"]').classList.add('is-active')
document.getElementById('panel-diy').classList.add('is-visible')
renderAll()
