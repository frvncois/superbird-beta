<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCollectionsStore } from '@/stores/collections'
import { useCanvasStore } from '@/stores/canvas'
import { useToast } from '@/composables/useToast'
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api'
import InputUi from '@/components/ui/InputUi.vue'
import ModalUi from '@/components/ui/ModalUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ToggleUi from '@/components/ui/ToggleUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

interface ProductDTO {
  id: string
  entryId?: string
  title: string
  price: number
  stock: number | null
  active: boolean
  archived: boolean
  hasOrders: boolean
}

const router = useRouter()
const collections = useCollectionsStore()
const canvas = useCanvasStore()
const toast = useToast()

const currency = ref('usd')
const commerce = ref<ProductDTO[]>([])

const productsCol = computed(() => collections.productsCollection())

const commerceByEntry = computed(() => {
  const m = new Map<string, ProductDTO>()
  for (const p of commerce.value) if (p.entryId) m.set(p.entryId, p)
  return m
})

// Products = the Products collection's entries, merged with their commerce row.
const rows = computed(() => {
  const col = productsCol.value
  if (!col) return []
  return collections
    .entriesByCollection(col.id)
    .map((e) => {
      const c = commerceByEntry.value.get(e.id)
      return {
        entryId: e.id,
        title: e.title,
        price: c?.price ?? 0,
        stock: c?.stock ?? null,
        active: c?.active ?? true,
        hasOrders: c?.hasOrders ?? false,
        archived: c?.archived ?? false,
      }
    })
    .filter((p) => !p.archived)
})

async function loadCommerce() {
  const [cfg, list] = await Promise.all([
    apiGet<{ currency: string }>('/api/store/config'),
    apiGet<{ products: ProductDTO[] }>('/api/store/products'),
  ])
  currency.value = cfg.currency
  commerce.value = list.products
}
onMounted(loadCommerce)

const currencySymbol = computed(() => {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value.toUpperCase() }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? '$'
  } catch {
    return '$'
  }
})

// ── Set up (create the Products collection + its template page) ──
function setUpProducts() {
  const page = canvas.addPage('Product', 'product', 'collection')
  collections.addCollection({ name: 'Products', templatePageId: page.id, isProducts: true })
  toast.success('Products set up')
}

function addProduct() {
  const col = productsCol.value
  if (!col) return
  const entry = collections.addEntry(col.id)
  canvas.openEntry(entry.id)
  router.push('/editor')
}

function editProduct(entryId: string) {
  canvas.openEntry(entryId)
  router.push('/editor')
}

// ── Inline edits (debounced upsert) ──
const timers = new Map<string, ReturnType<typeof setTimeout>>()
function saveField(entryId: string, title: string, patch: { price?: number; stock?: number | null; active?: boolean }) {
  const t = timers.get(entryId)
  if (t) clearTimeout(t)
  timers.set(
    entryId,
    setTimeout(async () => {
      const res = await apiPut<ProductDTO>('/api/store/products', { entryId, title, ...patch })
      const i = commerce.value.findIndex((p) => p.entryId === entryId)
      if (i === -1) commerce.value.push(res)
      else commerce.value[i] = res
    }, 500),
  )
}

function onPrice(row: { entryId: string; title: string }, dollars: string) {
  saveField(row.entryId, row.title, { price: Math.round((Number(dollars) || 0) * 100) })
}
function onStock(row: { entryId: string; title: string }, value: string) {
  saveField(row.entryId, row.title, { stock: value.trim() === '' ? null : Math.max(0, Math.floor(Number(value) || 0)) })
}
function onActive(row: { entryId: string; title: string }, active: boolean) {
  saveField(row.entryId, row.title, { active })
}

const pendingRemove = ref<{ entryId: string; title: string; hasOrders: boolean } | null>(null)
function removeProduct(row: { entryId: string; title: string; hasOrders: boolean }) {
  pendingRemove.value = row
}
async function doRemove() {
  const target = pendingRemove.value
  if (!target) return
  const { mode } = await apiDelete<{ mode: string }>(`/api/store/products/${target.entryId}`)
  if (mode === 'deleted') {
    collections.removeEntry(target.entryId)
    commerce.value = commerce.value.filter((p) => p.entryId !== target.entryId)
    toast.success('Product deleted')
  } else {
    await loadCommerce()
    toast.success('Product taken offline')
  }
  pendingRemove.value = null
}

const pendingArchive = ref<{ entryId: string; title: string } | null>(null)
function archiveProduct(row: { entryId: string; title: string }) {
  pendingArchive.value = row
}
async function doArchive() {
  const target = pendingArchive.value
  if (!target) return
  await apiPost(`/api/store/products/${target.entryId}/archive`, { title: target.title })
  await loadCommerce()
  toast.success('Product archived')
  pendingArchive.value = null
}
</script>

<template>
  <div class="space-y-4">
    <!-- No products collection yet -->
    <EmptyStateUi v-if="!productsCol" class="rounded-xl border border-border/70 py-16">
      <IconUi name="store" size="size-10" class="text-secondary/30" />
      <p class="text-sm">No products yet</p>
      <p class="text-xs text-secondary">Create a Products collection to start adding products.</p>
      <ButtonUi size="sm" class="mt-2" @click="setUpProducts">Set up products</ButtonUi>
    </EmptyStateUi>

    <template v-else>
      <div class="flex items-center justify-between">
        <p class="text-xs text-secondary">{{ rows.length }} product{{ rows.length === 1 ? '' : 's' }}</p>
        <ButtonUi size="sm" @click="addProduct"><IconUi name="plus" size="size-3.5" /> Add product</ButtonUi>
      </div>

      <EmptyStateUi v-if="!rows.length" compact message="No products. Add your first one." class="rounded-xl border border-border/70 py-10" />

      <div v-else class="overflow-hidden rounded-xl border border-border/70 bg-background">
        <!-- Header -->
        <div class="grid grid-cols-[1fr_7rem_6rem_5rem_auto] items-center gap-3 border-b border-border/60 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-secondary">
          <span>Product</span><span>Price</span><span>Stock</span><span>Active</span><span></span>
        </div>
        <div class="divide-y divide-border/60">
          <div v-for="row in rows" :key="row.entryId" class="grid grid-cols-[1fr_7rem_6rem_5rem_auto] items-center gap-3 px-4 py-2.5">
            <div class="flex min-w-0 items-center gap-2">
              <span class="truncate text-sm font-medium">{{ row.title }}</span>
              <BadgeUi v-if="!row.active" variant="neutral" size="xs" mono>Offline</BadgeUi>
              <BadgeUi v-if="row.hasOrders" variant="neutral" size="xs" mono>Ordered</BadgeUi>
            </div>
            <div class="relative">
              <span class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-secondary">{{ currencySymbol }}</span>
              <InputUi :model-value="(row.price / 100).toString()" type="number" class="pl-5" @update:model-value="onPrice(row, $event)" />
            </div>
            <InputUi :model-value="row.stock === null ? '' : String(row.stock)" type="number" placeholder="∞" @update:model-value="onStock(row, $event)" />
            <ToggleUi :model-value="row.active" @update:model-value="onActive(row, $event)" />
            <div class="flex items-center justify-end gap-1">
              <IconButtonUi size="sm" title="Edit product" @click="editProduct(row.entryId)"><IconUi name="rename" size="size-3.5" /></IconButtonUi>
              <IconButtonUi v-if="row.hasOrders" size="sm" title="Archive" @click="archiveProduct(row)"><IconUi name="archive" size="size-3.5" /></IconButtonUi>
              <IconButtonUi size="sm" variant="danger" title="Remove product" @click="removeProduct(row)"><IconUi name="delete" size="size-3.5" /></IconButtonUi>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ModalUi
      :open="!!pendingRemove"
      variant="dialog"
      danger
      icon="alert"
      title="Remove product"
      :description="pendingRemove ? (pendingRemove.hasOrders ? `“${pendingRemove.title}” has orders, so it will be taken offline (not deleted) to keep order history intact.` : `Delete “${pendingRemove.title}” permanently? This can’t be undone.`) : ''"
      @update:open="pendingRemove = null"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingRemove = null">Cancel</ButtonUi>
        <ButtonUi variant="danger" @click="doRemove">{{ pendingRemove?.hasOrders ? 'Take offline' : 'Delete' }}</ButtonUi>
      </template>
    </ModalUi>

    <ModalUi
      :open="!!pendingArchive"
      variant="dialog"
      title="Archive product"
      :description="pendingArchive ? `Hide “${pendingArchive.title}” from the store? It stays available for existing orders and can’t be bought.` : ''"
      @update:open="pendingArchive = null"
    >
      <template #actions>
        <ButtonUi variant="ghost" @click="pendingArchive = null">Cancel</ButtonUi>
        <ButtonUi variant="default" @click="doArchive">Archive</ButtonUi>
      </template>
    </ModalUi>
  </div>
</template>
