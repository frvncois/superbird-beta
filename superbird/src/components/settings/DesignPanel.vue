<script setup lang="ts">
import { ref } from 'vue'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import SettingsSection from './SettingsSection.vue'
import SettingsPanel from './SettingsPanel.vue'
import InputUi from '@/components/ui/InputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import ButtonUi from '@/components/ui/ButtonUi.vue'
import IconButtonUi from '@/components/ui/IconButtonUi.vue'
import IconUi from '@/components/ui/IconUi.vue'

const store = useGlobalStylesStore()

// Colors
const newColorName = ref('')
const newColorValue = ref('#000000')
function addColor() {
  const name = newColorName.value.trim()
  if (!name) return
  store.addGlobalColor(name, newColorValue.value)
  newColorName.value = ''
  newColorValue.value = '#000000'
}

// Sizes
const newSizeName = ref('')
const newSizeValue = ref('')
function addSize() {
  const name = newSizeName.value.trim()
  if (!name || !newSizeValue.value) return
  store.addGlobalSize(name, newSizeValue.value)
  newSizeName.value = ''
  newSizeValue.value = ''
}
</script>

<template>
  <SettingsPanel title="Design">
    <!-- Colors -->
    <SettingsSection title="Color palette" description="Reusable colors available across the editor.">
      <div
        v-for="(value, name) in store.globalStyles.colors"
        :key="name"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <span class="w-28 shrink-0 truncate font-mono text-xs text-foreground">{{ name }}</span>
        <ColorInputUi
          class="min-w-0 flex-1"
          :model-value="value"
          @update:model-value="store.setGlobalColor(name as string, $event)"
        />
        <IconButtonUi size="sm" variant="danger" title="Remove color" @click="store.removeGlobalColor(name as string)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <ColorInputUi v-model="newColorValue" class="w-28 shrink-0" />
        <InputUi v-model="newColorName" placeholder="Color name" class="flex-1" @keydown.enter="addColor" />
        <ButtonUi size="sm" @click="addColor">Add</ButtonUi>
      </div>
    </SettingsSection>

    <!-- Sizes -->
    <SettingsSection title="Size scale" description="Named spacing/size tokens.">
      <div
        v-for="(value, name) in store.globalStyles.sizes"
        :key="name"
        class="flex items-center gap-3 px-4 py-2.5"
      >
        <span class="w-16 shrink-0 font-mono text-xs text-secondary">{{ name }}</span>
        <InputUi
          class="min-w-0 flex-1"
          :model-value="value"
          placeholder="16px"
          @update:model-value="store.setGlobalSize(name as string, $event)"
        />
        <IconButtonUi size="sm" variant="danger" title="Remove size" @click="store.removeGlobalSize(name as string)">
          <IconUi name="close" size="size-3" />
        </IconButtonUi>
      </div>
      <div class="flex items-center gap-2 bg-secondary/5 px-4 py-3">
        <InputUi v-model="newSizeName" placeholder="name" class="w-24 shrink-0" />
        <InputUi v-model="newSizeValue" placeholder="16px" class="flex-1" @keydown.enter="addSize" />
        <ButtonUi size="sm" @click="addSize">Add</ButtonUi>
      </div>
    </SettingsSection>

    </SettingsPanel>
</template>
