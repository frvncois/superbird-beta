<script setup lang="ts">
import { computed, ref } from 'vue'
import SegmentedControlUi from '@/components/ui/SegmentedControlUi.vue'
import StoreSettingsSection from './StoreSettingsSection.vue'
import ProductsSection from './ProductsSection.vue'
import OrdersSection from './OrdersSection.vue'
import CustomersSection from './CustomersSection.vue'

type Tab = 'settings' | 'products' | 'orders' | 'customers'
const tab = ref<Tab>('settings')
const tabProxy = computed<string>({ get: () => tab.value, set: (v) => (tab.value = v as Tab) })
const tabOptions = [
  { value: 'settings', label: 'Settings' },
  { value: 'products', label: 'Products' },
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
]
</script>

<template>
  <div class="space-y-8">
    <SegmentedControlUi v-model="tabProxy" :options="tabOptions" />

    <StoreSettingsSection v-if="tab === 'settings'" />
    <ProductsSection v-else-if="tab === 'products'" />
    <OrdersSection v-else-if="tab === 'orders'" />
    <CustomersSection v-else-if="tab === 'customers'" />
  </div>
</template>
