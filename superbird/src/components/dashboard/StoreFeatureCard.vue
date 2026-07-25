<script setup lang="ts">
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'
</script>

<template>
  <section class="flex flex-1 flex-col items-center justify-center gap-3.5 rounded-xl border px-8 text-center">
    <span class="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
      <IconUi name="store" size="size-4" />
    </span>
    <p class="text-sm font-medium text-foreground">Sell online</p>
    <p class="text-[11px] leading-relaxed text-secondary">
      Turn on the store to add products, take payments with Stripe, and manage orders &amp; customers.
    </p>
    <ButtonUi variant="solid" size="sm" class="mt-1 w-full" to="/settings?tab=store">
      Activate store
      <IconUi name="arrow-right" size="size-3" />
    </ButtonUi>
  </section>
</template>

