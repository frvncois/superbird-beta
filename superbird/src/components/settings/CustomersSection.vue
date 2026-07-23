<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiGet } from '@/lib/api'
import IconUi from '@/components/ui/IconUi.vue'
import EmptyStateUi from '@/components/ui/EmptyStateUi.vue'

interface Customer {
  id: string
  email: string
  name: string
  createdAt: string
  orderCount: number
  totalSpent: number
  currency: string
}
interface OrderItem { title: string; unitPrice: number; qty: number }
interface Order { id: string; status: string; total: number; currency: string; createdAt: string; items: OrderItem[] }

const customers = ref<Customer[]>([])
const expandedId = ref<string | null>(null)
const orderCache = ref<Record<string, Order[]>>({})
const currency = ref('usd')

const fmt = computed(() => (cents: number) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value.toUpperCase() }).format(cents / 100) } catch { return `$${(cents / 100).toFixed(2)}` }
})
function fmtDate(iso: string) { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { dateStyle: 'medium' }) }
function initials(c: Customer) { return (c.name || c.email).split(/[\s@.]+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() }

async function load() {
  const res = await apiGet<{ customers: Customer[] }>('/api/store/customers')
  customers.value = res.customers
  if (res.customers[0]) currency.value = res.customers[0].currency
}
onMounted(load)

async function toggle(c: Customer) {
  if (expandedId.value === c.id) { expandedId.value = null; return }
  expandedId.value = c.id
  if (!orderCache.value[c.id]) {
    const res = await apiGet<{ orders: Order[] }>(`/api/store/customers/${c.id}/orders`)
    orderCache.value[c.id] = res.orders
  }
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-xs text-secondary">{{ customers.length }} customer{{ customers.length === 1 ? '' : 's' }}</p>

    <EmptyStateUi v-if="!customers.length" compact message="No customers yet." class="rounded-xl border border-border/70 py-12" />

    <div v-else class="overflow-hidden rounded-xl border border-border/70 bg-background divide-y divide-border/60">
      <div v-for="c in customers" :key="c.id">
        <button class="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-secondary/5" @click="toggle(c)">
          <span class="flex size-8 items-center justify-center rounded-full bg-secondary/10 font-mono text-[10px] font-medium text-secondary">{{ initials(c) }}</span>
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">{{ c.name || c.email }}</div>
            <div class="truncate text-xs text-secondary">{{ c.email }}</div>
          </div>
          <div class="text-right text-xs">
            <div class="font-medium text-foreground">{{ fmt(c.totalSpent) }}</div>
            <div class="text-secondary">{{ c.orderCount }} order{{ c.orderCount === 1 ? '' : 's' }}</div>
          </div>
          <IconUi name="chevron-down" size="size-4" class="text-secondary transition-transform duration-150" :class="expandedId === c.id && 'rotate-180'" />
        </button>
        <div v-if="expandedId === c.id" class="space-y-2 border-t border-border/60 bg-secondary/5 px-4 py-3">
          <div class="text-[10px] text-secondary">Joined {{ fmtDate(c.createdAt) }}</div>
          <div v-if="orderCache[c.id]?.length" class="space-y-1">
            <div v-for="o in orderCache[c.id]" :key="o.id" class="flex items-center justify-between text-xs">
              <span class="text-secondary">{{ fmtDate(o.createdAt) }} · <span class="capitalize">{{ o.status }}</span></span>
              <span>{{ o.items.map((i) => `${i.title} × ${i.qty}`).join(', ') }}</span>
              <span class="font-medium">{{ fmt(o.total) }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-secondary">No orders.</p>
        </div>
      </div>
    </div>
  </div>
</template>
