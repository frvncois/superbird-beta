<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { useGlobalStylesStore } from '@/stores/globalStyles'
import InputUi from '@/components/ui/InputUi.vue'
import UnitInputUi from '@/components/ui/UnitInputUi.vue'
import LinkedUnitInputUi from '@/components/ui/LinkedUnitInputUi.vue'
import ColorInputUi from '@/components/ui/ColorInputUi.vue'
import SizeTokenInputUi from '@/components/ui/SizeTokenInputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import ClassInputUi from '@/components/ui/ClassInputUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'
import DragLabelUi from '@/components/ui/DragLabelUi.vue'
import { CONTAINER_TYPES, TEXT_EDITABLE_TYPES } from '@/constants/canvas'
import type { StyleState } from '@/types/canvas'

const store = useCanvasStore()
const globalStylesStore = useGlobalStylesStore()
const node = computed(() => store.selectedNode)

const isTextNode = computed(() =>
  node.value && TEXT_EDITABLE_TYPES.includes(node.value.type),
)
const isContainer = computed(() =>
  node.value && CONTAINER_TYPES.includes(node.value.type),
)

const activeClass = computed(() => {
  if (!globalStylesStore.activeClassName) return null
  return globalStylesStore.styleClasses[globalStylesStore.activeClassName] ?? null
})

const hasClass = computed(() => !!activeClass.value)

// When a class is active, edit the class styles at the active breakpoint+state.
// Otherwise, edit instance styles directly.
const activeStyles = computed<Record<string, string>>(() => {
  if (activeClass.value) {
    const bpStyles = activeClass.value.styles[globalStylesStore.activeBreakpoint]
    return bpStyles?.[globalStylesStore.activeState] ?? {}
  }
  return node.value?.styles ?? {}
})

const isFlex = computed(() =>
  activeStyles.value.display === 'flex' || activeStyles.value.display === 'inline-flex',
)

const isGrid = computed(() => activeStyles.value.display === 'grid')

watch(() => node.value?.id, () => {
  if (node.value && node.value.classes.length > 0) {
    globalStylesStore.setActiveClass(node.value.classes[0]!)
  } else {
    globalStylesStore.setActiveClass(null)
  }
  globalStylesStore.setActiveState('default')
})

function addClass(name: string) {
  if (!node.value) return
  store.addClassToNode(node.value.id, name)
}

function removeClass(name: string) {
  if (!node.value) return
  store.removeClassFromNode(node.value.id, name)
}

function updateStyle(key: string, value: string) {
  // If a class is active, edit the class
  if (globalStylesStore.activeClassName) {
    globalStylesStore.updateClassStyle(globalStylesStore.activeClassName, key, value)
    return
  }
  // Otherwise, edit instance styles directly
  if (!node.value) return
  const styles = { ...node.value.styles }
  if (value) {
    styles[key] = value
  } else {
    delete styles[key]
  }
  store.updateNode(node.value.id, { styles })
}

function updateLinkedStyles(keys: [string, string, string, string], values: [string, string, string, string]) {
  keys.forEach((key, i) => updateStyle(key, values[i]!))
}

function getLinkedValues(keys: [string, string, string, string]): [string, string, string, string] {
  return keys.map((k) => activeStyles.value[k] ?? '') as [string, string, string, string]
}

function statesWithValues(keys: string[]): StyleState[] {
  if (!activeClass.value) return []
  const bpStyles = activeClass.value.styles[globalStylesStore.activeBreakpoint]
  if (!bpStyles) return []
  const states: StyleState[] = []
  for (const [state, styles] of Object.entries(bpStyles)) {
    if (state === 'default') continue
    if (keys.some((k) => (styles as Record<string, string>)[k])) {
      states.push(state as StyleState)
    }
  }
  return states
}

const layoutKeys = ['display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap', 'grid-template-columns', 'grid-template-rows', 'overflow']
const positionKeys = ['position', 'top', 'right', 'bottom', 'left', 'z-index']
const sizeKeys = ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']
const spacingKeys = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left']
const typographyKeys = ['font-family', 'font-size', 'line-height', 'font-weight', 'font-style', 'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing', 'white-space', 'color']
const backgroundKeys = ['background-color', 'background-image', 'background-size', 'background-position', 'background-repeat']
const borderKeys = ['border-width', 'border-style', 'border-color', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius']
const effectsKeys = ['opacity', 'box-shadow', 'cursor', 'transition', 'transform']

const borderSideOptions = [
  { value: 'all', label: 'All Sides' },
  { value: 'individual', label: 'Per Side' },
]

const activeBorderMode = ref<'all' | 'individual'>('all')

// --- Options ---

const displayOptions = [
  { value: '', label: 'Default' },
  { value: 'block', label: 'Block' },
  { value: 'flex', label: 'Flex' },
  { value: 'grid', label: 'Grid' },
  { value: 'inline', label: 'Inline' },
  { value: 'inline-block', label: 'Inline Block' },
  { value: 'inline-flex', label: 'Inline Flex' },
  { value: 'none', label: 'None' },
]

const positionOptions = [
  { value: '', label: 'Default' },
  { value: 'static', label: 'Static' },
  { value: 'relative', label: 'Relative' },
  { value: 'absolute', label: 'Absolute' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'sticky', label: 'Sticky' },
]

const flexDirectionOptions = [
  { value: '', label: 'Default' },
  { value: 'row', label: 'Row' },
  { value: 'column', label: 'Column' },
  { value: 'row-reverse', label: 'Row Reverse' },
  { value: 'column-reverse', label: 'Column Reverse' },
]

const flexWrapOptions = [
  { value: '', label: 'Default' },
  { value: 'nowrap', label: 'No Wrap' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'wrap-reverse', label: 'Wrap Reverse' },
]

const alignOptions = [
  { value: '', label: 'Default' },
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'stretch', label: 'Stretch' },
  { value: 'baseline', label: 'Baseline' },
]

const justifyOptions = [
  { value: '', label: 'Default' },
  { value: 'flex-start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'flex-end', label: 'End' },
  { value: 'space-between', label: 'Space Between' },
  { value: 'space-around', label: 'Space Around' },
  { value: 'space-evenly', label: 'Space Evenly' },
]

const overflowOptions = [
  { value: '', label: 'Default' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'auto', label: 'Auto' },
]

const textAlignOptions = [
  { value: '', label: 'Default' },
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
  { value: 'justify', label: 'Justify' },
]

const fontWeightOptions = [
  { value: '', label: 'Default' },
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
]

const fontStyleOptions = [
  { value: '', label: 'Default' },
  { value: 'normal', label: 'Normal' },
  { value: 'italic', label: 'Italic' },
]

const textDecorationOptions = [
  { value: '', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' },
  { value: 'overline', label: 'Overline' },
]

const textTransformOptions = [
  { value: '', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
]

const whiteSpaceOptions = [
  { value: '', label: 'Default' },
  { value: 'normal', label: 'Normal' },
  { value: 'nowrap', label: 'No Wrap' },
  { value: 'pre', label: 'Pre' },
  { value: 'pre-wrap', label: 'Pre Wrap' },
]

const backgroundSizeOptions = [
  { value: '', label: 'Default' },
  { value: 'auto', label: 'Auto' },
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
]

const backgroundRepeatOptions = [
  { value: '', label: 'Default' },
  { value: 'repeat', label: 'Repeat' },
  { value: 'no-repeat', label: 'No Repeat' },
  { value: 'repeat-x', label: 'Repeat X' },
  { value: 'repeat-y', label: 'Repeat Y' },
]

const backgroundPositionOptions = [
  { value: '', label: 'Default' },
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

const borderStyleOptions = [
  { value: '', label: 'Default' },
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
  { value: 'groove', label: 'Groove' },
  { value: 'ridge', label: 'Ridge' },
]

const cursorOptions = [
  { value: '', label: 'Default' },
  { value: 'auto', label: 'Auto' },
  { value: 'pointer', label: 'Pointer' },
  { value: 'text', label: 'Text' },
  { value: 'move', label: 'Move' },
  { value: 'not-allowed', label: 'Not Allowed' },
  { value: 'grab', label: 'Grab' },
  { value: 'crosshair', label: 'Crosshair' },
]
</script>

<template>
  <!-- No selection -->
  <div v-if="!node" class="flex items-center justify-center py-12 text-xs text-secondary">
    Select an element to edit
  </div>

  <!-- Properties panel -->
  <div v-else class="space-y-4 p-3">
    <!-- Selector -->
    <section class="space-y-2">
      <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Selector</div>
      <ClassInputUi
        :classes="node.classes"
        :active-class="globalStylesStore.activeClassName"
        :active-state="globalStylesStore.activeState"
        :all-class-names="globalStylesStore.allClassNames"
        @add="addClass"
        @remove="removeClass"
        @select="globalStylesStore.setActiveClass"
        @update:active-state="globalStylesStore.setActiveState"
      />
    </section>

    <!-- Style sections (always shown when node selected) -->
    <template v-if="activeStyles">
      <div class="border-t pt-1">

        <!-- Layout -->
        <PropertySectionUi v-if="isContainer" title="Layout" icon="layout" :states-with-values="statesWithValues(layoutKeys)">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Display</span>
              <SelectUi :model-value="activeStyles.display ?? ''" :options="displayOptions" @update:model-value="updateStyle('display', $event)" />
            </div>
            <template v-if="isFlex">
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Direction</span>
                <SelectUi :model-value="activeStyles['flex-direction'] ?? ''" :options="flexDirectionOptions" @update:model-value="updateStyle('flex-direction', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Wrap</span>
                <SelectUi :model-value="activeStyles['flex-wrap'] ?? ''" :options="flexWrapOptions" @update:model-value="updateStyle('flex-wrap', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Align</span>
                <SelectUi :model-value="activeStyles['align-items'] ?? ''" :options="alignOptions" @update:model-value="updateStyle('align-items', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Justify</span>
                <SelectUi :model-value="activeStyles['justify-content'] ?? ''" :options="justifyOptions" @update:model-value="updateStyle('justify-content', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Gap</span>
                <SizeTokenInputUi :model-value="activeStyles.gap ?? ''" placeholder="0" @update:model-value="updateStyle('gap', $event)" />
              </div>
            </template>
            <template v-if="isGrid">
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Columns</span>
                <InputUi :model-value="activeStyles['grid-template-columns'] ?? ''" placeholder="1fr 1fr" @update:model-value="updateStyle('grid-template-columns', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Rows</span>
                <InputUi :model-value="activeStyles['grid-template-rows'] ?? ''" placeholder="auto 1fr" @update:model-value="updateStyle('grid-template-rows', $event)" />
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Gap</span>
                <SizeTokenInputUi :model-value="activeStyles.gap ?? ''" placeholder="0" @update:model-value="updateStyle('gap', $event)" />
              </div>
            </template>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Overflow</span>
              <SelectUi :model-value="activeStyles.overflow ?? ''" :options="overflowOptions" @update:model-value="updateStyle('overflow', $event)" />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Position -->
        <PropertySectionUi title="Position" icon="position" :states-with-values="statesWithValues(positionKeys)" :default-open="false">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Position</span>
              <SelectUi :model-value="activeStyles.position ?? ''" :options="positionOptions" @update:model-value="updateStyle('position', $event)" />
            </div>
            <template v-if="activeStyles.position && activeStyles.position !== 'static' && activeStyles.position !== ''">
              <div class="grid grid-cols-2 gap-1.5">
                <div class="space-y-1">
                  <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.top ?? ''" @update:model-value="updateStyle('top', $event)">Top</DragLabelUi>
                  <UnitInputUi :model-value="activeStyles.top ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('top', $event)" />
                </div>
                <div class="space-y-1">
                  <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.right ?? ''" @update:model-value="updateStyle('right', $event)">Right</DragLabelUi>
                  <UnitInputUi :model-value="activeStyles.right ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('right', $event)" />
                </div>
                <div class="space-y-1">
                  <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.bottom ?? ''" @update:model-value="updateStyle('bottom', $event)">Bottom</DragLabelUi>
                  <UnitInputUi :model-value="activeStyles.bottom ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('bottom', $event)" />
                </div>
                <div class="space-y-1">
                  <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.left ?? ''" @update:model-value="updateStyle('left', $event)">Left</DragLabelUi>
                  <UnitInputUi :model-value="activeStyles.left ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('left', $event)" />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-16 text-[10px] text-secondary">Z-Index</span>
                <InputUi :model-value="activeStyles['z-index'] ?? ''" placeholder="auto" @update:model-value="updateStyle('z-index', $event)" />
              </div>
            </template>
          </div>
        </PropertySectionUi>

        <!-- Size -->
        <PropertySectionUi title="Size" icon="size" :states-with-values="statesWithValues(sizeKeys)">
          <div class="grid grid-cols-2 gap-1.5">
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.width ?? ''" @update:model-value="updateStyle('width', $event)">Width</DragLabelUi>
              <UnitInputUi :model-value="activeStyles.width ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('width', $event)" />
            </div>
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles.height ?? ''" @update:model-value="updateStyle('height', $event)">Height</DragLabelUi>
              <UnitInputUi :model-value="activeStyles.height ?? ''" placeholder="0" :allow-auto="true" @update:model-value="updateStyle('height', $event)" />
            </div>
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['min-width'] ?? ''" @update:model-value="updateStyle('min-width', $event)">Min W</DragLabelUi>
              <UnitInputUi :model-value="activeStyles['min-width'] ?? ''" placeholder="0" @update:model-value="updateStyle('min-width', $event)" />
            </div>
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['min-height'] ?? ''" @update:model-value="updateStyle('min-height', $event)">Min H</DragLabelUi>
              <UnitInputUi :model-value="activeStyles['min-height'] ?? ''" placeholder="0" @update:model-value="updateStyle('min-height', $event)" />
            </div>
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['max-width'] ?? ''" @update:model-value="updateStyle('max-width', $event)">Max W</DragLabelUi>
              <UnitInputUi :model-value="activeStyles['max-width'] ?? ''" placeholder="0" @update:model-value="updateStyle('max-width', $event)" />
            </div>
            <div class="space-y-1">
              <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['max-height'] ?? ''" @update:model-value="updateStyle('max-height', $event)">Max H</DragLabelUi>
              <UnitInputUi :model-value="activeStyles['max-height'] ?? ''" placeholder="0" @update:model-value="updateStyle('max-height', $event)" />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Spacing -->
        <PropertySectionUi title="Spacing" icon="spacing" :states-with-values="statesWithValues(spacingKeys)">
          <div class="space-y-3">
            <div class="space-y-1">
              <span class="text-[10px] text-secondary">Padding</span>
              <LinkedUnitInputUi
                :values="getLinkedValues(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'])"
                @update:values="updateLinkedStyles(['padding-top', 'padding-right', 'padding-bottom', 'padding-left'], $event)"
              />
            </div>
            <div class="space-y-1">
              <span class="text-[10px] text-secondary">Margin</span>
              <LinkedUnitInputUi
                :values="getLinkedValues(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])"
                :allow-auto="true"
                @update:values="updateLinkedStyles(['margin-top', 'margin-right', 'margin-bottom', 'margin-left'], $event)"
              />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Typography -->
        <PropertySectionUi v-if="isTextNode" title="Typography" icon="typography" :states-with-values="statesWithValues(typographyKeys)">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Family</span>
              <InputUi :model-value="activeStyles['font-family'] ?? ''" placeholder="inherit" @update:model-value="updateStyle('font-family', $event)" />
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <div class="space-y-1">
                <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['font-size'] ?? ''" @update:model-value="updateStyle('font-size', $event)">Size</DragLabelUi>
                <SizeTokenInputUi :model-value="activeStyles['font-size'] ?? ''" placeholder="16" :units="['px', 'em', 'rem', '%', 'vw']" @update:model-value="updateStyle('font-size', $event)" />
              </div>
              <div class="space-y-1">
                <DragLabelUi class="text-[10px] text-secondary" :model-value="activeStyles['line-height'] ?? ''" @update:model-value="updateStyle('line-height', $event)">Line Height</DragLabelUi>
                <SizeTokenInputUi :model-value="activeStyles['line-height'] ?? ''" placeholder="1.5" :units="['px', 'em', 'rem', '%']" @update:model-value="updateStyle('line-height', $event)" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Weight</span>
              <SelectUi :model-value="activeStyles['font-weight'] ?? ''" :options="fontWeightOptions" @update:model-value="updateStyle('font-weight', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Style</span>
              <SelectUi :model-value="activeStyles['font-style'] ?? ''" :options="fontStyleOptions" @update:model-value="updateStyle('font-style', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Align</span>
              <SelectUi :model-value="activeStyles['text-align'] ?? ''" :options="textAlignOptions" @update:model-value="updateStyle('text-align', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Decor</span>
              <SelectUi :model-value="activeStyles['text-decoration'] ?? ''" :options="textDecorationOptions" @update:model-value="updateStyle('text-decoration', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Transform</span>
              <SelectUi :model-value="activeStyles['text-transform'] ?? ''" :options="textTransformOptions" @update:model-value="updateStyle('text-transform', $event)" />
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <div class="space-y-1">
                <span class="text-[10px] text-secondary">Spacing</span>
                <SizeTokenInputUi :model-value="activeStyles['letter-spacing'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('letter-spacing', $event)" />
              </div>
              <div class="space-y-1">
                <span class="text-[10px] text-secondary">Word Spacing</span>
                <SizeTokenInputUi :model-value="activeStyles['word-spacing'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('word-spacing', $event)" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Wrap</span>
              <SelectUi :model-value="activeStyles['white-space'] ?? ''" :options="whiteSpaceOptions" @update:model-value="updateStyle('white-space', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Color</span>
              <ColorInputUi :model-value="activeStyles.color ?? ''" placeholder="#000" @update:model-value="updateStyle('color', $event)" />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Background -->
        <PropertySectionUi title="Background" icon="background" :states-with-values="statesWithValues(backgroundKeys)">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Color</span>
              <ColorInputUi :model-value="activeStyles['background-color'] ?? ''" placeholder="#fff" @update:model-value="updateStyle('background-color', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Image</span>
              <InputUi :model-value="activeStyles['background-image'] ?? ''" placeholder="url(...)" @update:model-value="updateStyle('background-image', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Size</span>
              <SelectUi :model-value="activeStyles['background-size'] ?? ''" :options="backgroundSizeOptions" @update:model-value="updateStyle('background-size', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Position</span>
              <SelectUi :model-value="activeStyles['background-position'] ?? ''" :options="backgroundPositionOptions" @update:model-value="updateStyle('background-position', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Repeat</span>
              <SelectUi :model-value="activeStyles['background-repeat'] ?? ''" :options="backgroundRepeatOptions" @update:model-value="updateStyle('background-repeat', $event)" />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Border -->
        <PropertySectionUi title="Border" icon="border" :states-with-values="statesWithValues(borderKeys)">
          <div class="space-y-2">
            <div class="flex rounded-md bg-foreground/5 p-0.5 mb-2">
              <button
                v-for="opt in borderSideOptions"
                :key="opt.value"
                :class="[
                  'flex-1 rounded px-1.5 py-0.5 text-[9px] font-mono cursor-pointer transition-all duration-100',
                  activeBorderMode === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-secondary hover:text-foreground',
                ]"
                @click="activeBorderMode = opt.value as 'all' | 'individual'"
              >
                {{ opt.label }}
              </button>
            </div>

            <template v-if="activeBorderMode === 'all'">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="w-16 text-[10px] text-secondary">Width</span>
                  <UnitInputUi :model-value="activeStyles['border-width'] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle('border-width', $event)" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-16 text-[10px] text-secondary">Style</span>
                  <SelectUi :model-value="activeStyles['border-style'] ?? ''" :options="borderStyleOptions" @update:model-value="updateStyle('border-style', $event)" />
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-16 text-[10px] text-secondary">Color</span>
                  <ColorInputUi :model-value="activeStyles['border-color'] ?? ''" placeholder="#e5e7eb" @update:model-value="updateStyle('border-color', $event)" />
                </div>
              </div>
            </template>

            <template v-else>
              <div v-for="side in ['top', 'right', 'bottom', 'left']" :key="side" class="space-y-1">
                <span class="text-[10px] text-secondary capitalize">{{ side }}</span>
                <div class="grid grid-cols-3 gap-1">
                  <UnitInputUi :model-value="activeStyles[`border-${side}-width`] ?? ''" placeholder="0" :units="['px', 'em', 'rem']" @update:model-value="updateStyle(`border-${side}-width`, $event)" />
                  <SelectUi :model-value="activeStyles[`border-${side}-style`] ?? ''" :options="borderStyleOptions" @update:model-value="updateStyle(`border-${side}-style`, $event)" />
                  <ColorInputUi :model-value="activeStyles[`border-${side}-color`] ?? ''" placeholder="#e5e7eb" @update:model-value="updateStyle(`border-${side}-color`, $event)" />
                </div>
              </div>
            </template>

            <div class="space-y-1 pt-1">
              <span class="text-[10px] text-secondary">Radius</span>
              <LinkedUnitInputUi
                :values="getLinkedValues(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'])"
                :labels="['TL', 'TR', 'BR', 'BL']"
                :units="['px', '%', 'em', 'rem']"
                @update:values="updateLinkedStyles(['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'], $event)"
              />
            </div>
          </div>
        </PropertySectionUi>

        <!-- Effects -->
        <PropertySectionUi title="Effects" icon="effects" :states-with-values="statesWithValues(effectsKeys)" :default-open="false">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Opacity</span>
              <InputUi :model-value="activeStyles.opacity ?? ''" placeholder="1" @update:model-value="updateStyle('opacity', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Shadow</span>
              <InputUi :model-value="activeStyles['box-shadow'] ?? ''" placeholder="0 1px 3px rgba(0,0,0,.1)" @update:model-value="updateStyle('box-shadow', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Cursor</span>
              <SelectUi :model-value="activeStyles.cursor ?? ''" :options="cursorOptions" @update:model-value="updateStyle('cursor', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Transition</span>
              <InputUi :model-value="activeStyles.transition ?? ''" placeholder="all 0.2s ease" @update:model-value="updateStyle('transition', $event)" />
            </div>
            <div class="flex items-center gap-2">
              <span class="w-16 text-[10px] text-secondary">Transform</span>
              <InputUi :model-value="activeStyles.transform ?? ''" placeholder="none" @update:model-value="updateStyle('transform', $event)" />
            </div>
          </div>
        </PropertySectionUi>

      </div>
    </template>
  </div>
</template>
