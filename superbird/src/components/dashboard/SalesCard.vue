<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiGet } from '@/lib/api'
import CardUi from '@/components/ui/CardUi.vue'
import BadgeUi from '@/components/ui/BadgeUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

interface OrderItem { title: string; qty: number }
interface Order { id: string; email: string; status: string; total: number; createdAt: string; items: OrderItem[] }

const emit = defineEmits<{ view: [] }>()

const orders = ref<Order[]>([])
const currency = ref('usd')

onMounted(async () => {
  try {
    const [cfg, res] = await Promise.all([
      apiGet<{ currency: string }>('/api/store/config'),
      apiGet<{ orders: Order[] }>('/api/store/orders'),
    ])
    currency.value = cfg.currency
    orders.value = res.orders
  } catch {
    // store not active
  }
})

const SPENT = new Set(['paid', 'shipped', 'completed'])
const total = computed(() => orders.value.filter((o) => SPENT.has(o.status)).reduce((s, o) => s + o.total, 0))
const recent = computed(() => orders.value.slice(0, 4))

const money = computed(() => (cents: number) => {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.value.toUpperCase() }).format(cents / 100) } catch { return `$${(cents / 100).toFixed(2)}` }
})
function summary(o: Order) { return o.items.map((i) => `${i.title} × ${i.qty}`).join(', ') || '—' }
</script>

<template>
  <CardUi size="sm" icon="sales" title="Recent sales">
    <template #header-action>
      <BadgeUi v-if="orders.length" variant="neutral" size="xs">{{ orders.length }}</BadgeUi>
    </template>

    <div class="flex flex-col gap-3">
      <div class="flex items-baseline gap-2">
        <span class="text-xl font-semibold text-foreground">{{ money(total) }}</span>
        <span class="text-[10px] text-secondary">revenue</span>
      </div>

      <div v-if="recent.length" class="flex flex-col gap-1">
        <div
          v-for="o in recent"
          :key="o.id"
          class="flex items-center gap-2 rounded-xl bg-background px-3 py-2.5"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-medium text-foreground">{{ o.email || 'Guest' }}</p>
            <p class="truncate text-[10px] text-secondary">{{ summary(o) }}</p>
          </div>
          <span class="shrink-0 text-xs font-medium text-green-fg">{{ money(o.total) }}</span>
        </div>
      </div>
      <p v-else class="rounded-xl bg-background px-3 py-4 text-center text-[10px] text-secondary">No sales yet.</p>
    </div>

    <template #actions>
      <ButtonUi variant="outline" size="sm" class="flex-1" @click="emit('view')">
        Manage sales
        <IconUi name="arrow-right" size="size-3" />
      </ButtonUi>
    </template>
  </CardUi>
</template>
