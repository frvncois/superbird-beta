<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { apiGet, apiPatch } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import SelectUi from '@/components/ui/SelectUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

interface OrderItem { title: string; unitPrice: number; qty: number }
interface Order {
  id: string
  email: string
  status: string
  currency: string
  total: number
  createdAt: string
  items: OrderItem[]
}

const toast = useToast()
const orders = ref<Order[]>([])
const currency = ref('usd')
const status = ref('')
const expandedId = ref<string | null>(null)

const STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded']
const filterOptions = [{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: cap(s) }))]
const statusOptions = STATUSES.map((s) => ({ value: s, label: cap(s) }))

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

const badge: Record<string, string> = {
  pending: 'bg-muted-bg text-muted-fg',
  paid: 'bg-blue-bg text-blue-fg',
  shipped: 'bg-amber-bg text-amber-fg',
  completed: 'bg-green-bg text-green-fg',
  cancelled: 'bg-muted-bg text-muted-fg',
  refunded: 'bg-red-bg text-red-fg',
}

const fmt = computed(() => (cents: number) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value.toUpperCase() }).format(cents / 100) } catch { return `$${(cents / 100).toFixed(2)}` }
})
function fmtDate(iso: string) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'medium' }) }
function shortId(id: string) { return id.replace(/^order_/, '#').slice(0, 9) }
function summary(o: Order) { return o.items.map((i) => `${i.title} × ${i.qty}`).join(', ') || '—' }

async function load() {
  const [cfg, res] = await Promise.all([
    apiGet<{ currency: string }>('/api/store/config'),
    apiGet<{ orders: Order[] }>(`/api/store/orders${status.value ? `?status=${status.value}` : ''}`),
  ])
  currency.value = cfg.currency
  orders.value = res.orders
}
onMounted(load)
watch(status, load)

async function changeStatus(o: Order, next: string) {
  const updated = await apiPatch<Order>(`/api/store/orders/${o.id}`, { status: next })
  const i = orders.value.findIndex((x) => x.id === o.id)
  if (i !== -1) orders.value[i] = updated
  toast.success(`Order marked ${next}`)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs text-secondary">{{ orders.length }} order{{ orders.length === 1 ? '' : 's' }}</p>
      <div class="w-40"><SelectUi v-model="status" :options="filterOptions" /></div>
    </div>

    <EmptyStateUi v-if="!orders.length" compact message="No orders yet." class="rounded-xl border border-border/70 py-12" />

    <div v-else class="overflow-hidden rounded-xl border border-border/70 bg-background divide-y divide-border/60">
      <div v-for="o in orders" :key="o.id">
        <div class="grid grid-cols-[1fr_auto_8rem_6rem] items-center gap-3 px-4 py-2.5">
          <button class="min-w-0 text-left" @click="expandedId = expandedId === o.id ? null : o.id">
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs text-secondary">{{ shortId(o.id) }}</span>
              <span class="truncate text-sm font-medium">{{ o.email || 'Guest' }}</span>
            </div>
            <div class="truncate text-xs text-secondary">{{ summary(o) }}</div>
          </button>
          <span class="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider" :class="badge[o.status]">{{ o.status }}</span>
          <div class="w-32 shrink-0"><SelectUi :model-value="o.status" :options="statusOptions" @update:model-value="changeStatus(o, $event)" /></div>
          <div class="text-right text-sm">
            <div class="font-medium">{{ fmt(o.total) }}</div>
            <div class="text-[10px] text-secondary">{{ fmtDate(o.createdAt) }}</div>
          </div>
        </div>
        <div v-if="expandedId === o.id" class="space-y-1 border-t border-border/60 bg-secondary/5 px-4 py-3 text-xs">
          <div v-for="(it, i) in o.items" :key="i" class="flex justify-between">
            <span>{{ it.title }} × {{ it.qty }}</span>
            <span class="text-secondary">{{ fmt(it.unitPrice * it.qty) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
