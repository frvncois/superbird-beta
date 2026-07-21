<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import { COLLECTION_SOURCES, getCollectionSource } from '@/constants/canvas'
import type { NodeVisibility, NodeLink, NodeAccessibility, NodeAdvanced } from '@/types/canvas'
import InputUi from '@/components/ui/InputUi.vue'
import SelectUi from '@/components/ui/SelectUi.vue'
import PropertySectionUi from '@/components/ui/PropertySectionUi.vue'

const store = useCanvasStore()
const node = computed(() => store.selectedNode)

const isBody = computed(() => node.value?.type === 'body')
const isTextNode = computed(() =>
  node.value && ['text', 'heading', 'button'].includes(node.value.type),
)
const isImage = computed(() => node.value?.type === 'image')
const isCollectionList = computed(() => node.value?.type === 'collection-list')
const isInsideCollection = computed(() => {
  if (!node.value) return false
  if (node.value.type === 'collection-item') return true
  // Walk up to see if inside a collection-item
  let current = store.getParentId(node.value.id)
  while (current) {
    const parent = store.bodyNode.id === current ? store.bodyNode : store.findNode(store.bodyNode.children, current)
    if (parent?.type === 'collection-item') return true
    current = store.getParentId(current)
  }
  return false
})
const collectionFields = computed(() => {
  if (!isInsideCollection.value && !isCollectionList.value) return []
  // Find the collection-list ancestor to get the source
  let searchId = node.value?.id
  while (searchId) {
    const n = searchId === store.bodyNode.id ? store.bodyNode : store.findNode(store.bodyNode.children, searchId)
    if (n?.type === 'collection-list') {
      const source = getCollectionSource(n.props.source as any)
      return source?.fields ?? []
    }
    searchId = store.getParentId(searchId) ?? undefined
  }
  return []
})
const hasFields = computed(() => store.activePageFields.length > 0 || collectionFields.value.length > 0)

const collectionSourceOptions = COLLECTION_SOURCES.map((s) => ({ value: s.key, label: s.label }))
const collectionOrderByOptions = [
  { value: 'date', label: 'Date' },
  { value: 'title', label: 'Title' },
  { value: 'price', label: 'Price' },
  { value: 'random', label: 'Random' },
]
const collectionOrderOptions = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' },
]

const boundField = computed(() => {
  if (!node.value?.dynamicField) return null
  return store.activePageFields.find((f) => f.key === node.value!.dynamicField)
    ?? collectionFields.value.find((f) => f.key === node.value!.dynamicField)
    ?? null
})

// --- Updaters ---

function updateLabel(value: string) {
  if (!node.value) return
  store.updateNode(node.value.id, { label: value })
}

function updateTag(value: string) {
  if (!node.value) return
  store.updateNode(node.value.id, { tag: value })
}

function updatePropValue(key: string, value: string) {
  if (!node.value) return
  const props = { ...node.value.props, [key]: value }
  store.updateNode(node.value.id, { props })
}

function updateContent(value: string) {
  if (!node.value) return
  store.setNodeContent(node.value.id, value)
}

const nodeContent = computed(() => {
  if (!node.value) return ''
  return store.getNodeContent(node.value)
})

function removeNode() {
  if (!node.value) return
  store.removeNode(node.value.id)
}

function bindField(fieldKey: string) {
  if (!node.value) return
  if (fieldKey === '') {
    store.unbindDynamicField(node.value.id)
  } else {
    store.bindDynamicField(node.value.id, fieldKey)
  }
}

// Generic prop updaters using updateNode with direct assignment
function updateProp<K extends keyof import('@/types/canvas').CanvasNode>(key: K, value: any) {
  if (!node.value) return
  ;(node.value as any)[key] = value
}

function updateVisibility(partial: Partial<NodeVisibility>) {
  if (!node.value) return
  node.value.visibility = { ...(node.value.visibility ?? {}), ...partial }
}

function updateLink(partial: Partial<NodeLink>) {
  if (!node.value) return
  node.value.link = { ...(node.value.link ?? {}), ...partial }
}

function updateAccessibility(partial: Partial<NodeAccessibility>) {
  if (!node.value) return
  node.value.accessibility = { ...(node.value.accessibility ?? {}), ...partial }
}

function updateAdvanced(partial: Partial<NodeAdvanced>) {
  if (!node.value) return
  node.value.advanced = { ...(node.value.advanced ?? {}), ...partial }
}

// --- Custom attributes ---

const newAttrKey = ref('')
const newAttrValue = ref('')

function addCustomAttribute() {
  if (!node.value || !newAttrKey.value.trim()) return
  if (!node.value.customAttributes) node.value.customAttributes = {}
  node.value.customAttributes[newAttrKey.value.trim()] = newAttrValue.value
  newAttrKey.value = ''
  newAttrValue.value = ''
}

function removeCustomAttribute(key: string) {
  if (!node.value?.customAttributes) return
  delete node.value.customAttributes[key]
}

// --- Options ---

const tagOptions = computed(() => {
  if (!node.value) return []
  switch (node.value.type) {
    case 'heading':
      return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((v) => ({ value: v, label: v.toUpperCase() }))
    case 'text':
      return [
        { value: 'p', label: 'Paragraph' },
        { value: 'span', label: 'Span' },
        { value: 'blockquote', label: 'Blockquote' },
      ]
    case 'container':
    case 'section':
      return [
        { value: 'div', label: 'Div' },
        { value: 'section', label: 'Section' },
        { value: 'article', label: 'Article' },
        { value: 'aside', label: 'Aside' },
        { value: 'nav', label: 'Nav' },
        { value: 'header', label: 'Header' },
        { value: 'footer', label: 'Footer' },
      ]
    default:
      return []
  }
})

const targetOptions = [
  { value: '_self', label: 'Same tab' },
  { value: '_blank', label: 'New tab' },
]

const conditionOperatorOptions = [
  { value: '', label: 'None' },
  { value: 'exists', label: 'Field exists' },
  { value: 'not_exists', label: 'Field is empty' },
  { value: 'equals', label: 'Field equals' },
  { value: 'not_equals', label: 'Field not equals' },
]

const roleOptions = [
  { value: '', label: 'None' },
  { value: 'banner', label: 'Banner' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'main', label: 'Main' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'contentinfo', label: 'Content Info' },
  { value: 'search', label: 'Search' },
  { value: 'form', label: 'Form' },
  { value: 'region', label: 'Region' },
  { value: 'alert', label: 'Alert' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'tablist', label: 'Tab List' },
  { value: 'tab', label: 'Tab' },
  { value: 'tabpanel', label: 'Tab Panel' },
  { value: 'button', label: 'Button' },
  { value: 'presentation', label: 'Presentation' },
]
</script>

<template>
  <div v-if="!node" class="flex items-center justify-center py-12 text-xs text-secondary">
    Select an element to edit
  </div>

  <div v-else class="p-3">
    <!-- Element info (not an accordion) -->
    <section class="space-y-2 pb-3">
      <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Element</div>
      <div class="space-y-1.5">
        <InputUi
          :model-value="node.label"
          placeholder="Label"
          @update:model-value="updateLabel"
        />
        <SelectUi
          v-if="tagOptions.length > 0"
          :model-value="node.tag"
          :options="tagOptions"
          @update:model-value="updateTag"
        />
      </div>
    </section>

    <!-- Collection List settings -->
    <section v-if="isCollectionList" class="space-y-2 pb-3">
      <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Collection</div>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="w-14 text-[10px] text-secondary">Source</span>
          <SelectUi
            :model-value="node.props.source ?? 'posts'"
            :options="collectionSourceOptions"
            @update:model-value="updatePropValue('source', $event)"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-14 text-[10px] text-secondary">Limit</span>
          <InputUi
            :model-value="node.props.limit ?? '3'"
            placeholder="3"
            @update:model-value="updatePropValue('limit', $event)"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-14 text-[10px] text-secondary">Order by</span>
          <SelectUi
            :model-value="node.props.orderBy ?? 'date'"
            :options="collectionOrderByOptions"
            @update:model-value="updatePropValue('orderBy', $event)"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-14 text-[10px] text-secondary">Order</span>
          <SelectUi
            :model-value="node.props.order ?? 'desc'"
            :options="collectionOrderOptions"
            @update:model-value="updatePropValue('order', $event)"
          />
        </div>
      </div>
    </section>

    <!-- Collection field binding (inside collection item) -->
    <section v-if="isInsideCollection && collectionFields.length > 0 && !isCollectionList" class="space-y-2 pb-3">
      <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Collection Field</div>
      <div v-if="boundField" class="flex items-center gap-2 rounded-xl bg-amber-bg/50 px-3 py-2">
        <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-amber-bg">
          <span class="text-[10px] text-amber-fg">&#8634;</span>
        </span>
        <span class="flex-1 text-xs font-medium text-amber-fg">{{ boundField.label }}</span>
        <button
          class="text-[10px] text-amber-fg/60 cursor-pointer hover:text-amber-fg transition-colors duration-100"
          @click="bindField('')"
        >
          Unbind
        </button>
      </div>
      <SelectUi
        v-else
        :model-value="node.dynamicField ?? ''"
        :options="[
          { value: '', label: 'None (static)' },
          ...collectionFields.map((f) => ({ value: f.key, label: f.label })),
        ]"
        @update:model-value="bindField"
      />
    </section>

    <!-- Dynamic field binding (template pages) -->
    <section v-if="hasFields && !isInsideCollection && !isCollectionList" class="space-y-2 pb-3">
      <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Dynamic Field</div>
      <div v-if="boundField" class="flex items-center gap-2 rounded-xl bg-purple-bg/50 px-3 py-2">
        <span class="flex size-5 shrink-0 items-center justify-center rounded-md bg-purple-bg">
          <svg class="size-3 text-purple-fg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
            <path d="M7.768 15.768a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 0 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3Z" />
          </svg>
        </span>
        <span class="flex-1 text-xs font-medium text-purple-fg">{{ boundField.label }}</span>
        <button
          class="text-[10px] text-purple-fg/60 cursor-pointer hover:text-purple-fg transition-colors duration-100"
          @click="bindField('')"
        >
          Unbind
        </button>
      </div>
      <SelectUi
        v-else
        :model-value="''"
        :options="[
          { value: '', label: 'None (static content)' },
          ...store.activePageFields.map((f) => ({ value: f.key, label: f.label })),
        ]"
        @update:model-value="bindField"
      />
    </section>

    <!-- Content -->
    <section v-if="isTextNode && !boundField" class="space-y-2 pb-3">
      <div class="flex items-center justify-between">
        <div class="text-[10px] font-mono uppercase tracking-wider text-secondary">Content</div>
        <span v-if="!store.isDefaultLocale" class="text-[9px] font-mono font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded">{{ store.activeLocale.toUpperCase() }}</span>
      </div>
      <textarea
        :value="nodeContent"
        placeholder="Text content"
        rows="3"
        class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10"
        @input="updateContent(($event.target as HTMLTextAreaElement).value)"
      />
    </section>

    <!-- Accordion sections -->
    <div class="border-t pt-1">

      <!-- Visibility -->
      <PropertySectionUi title="Visibility" icon="effects" :default-open="false">
        <div class="space-y-2">
          <!-- Breakpoint toggles -->
          <div class="space-y-1.5">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-xs text-foreground">Hide on Desktop</span>
              <button
                :class="[
                  'relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer',
                  node.visibility?.hideDesktop ? 'bg-foreground' : 'bg-foreground/20',
                ]"
                @click="updateVisibility({ hideDesktop: !node.visibility?.hideDesktop })"
              >
                <span
                  :class="[
                    'absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200',
                    node.visibility?.hideDesktop && 'translate-x-4',
                  ]"
                />
              </button>
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-xs text-foreground">Hide on Tablet</span>
              <button
                :class="[
                  'relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer',
                  node.visibility?.hideTablet ? 'bg-foreground' : 'bg-foreground/20',
                ]"
                @click="updateVisibility({ hideTablet: !node.visibility?.hideTablet })"
              >
                <span
                  :class="[
                    'absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200',
                    node.visibility?.hideTablet && 'translate-x-4',
                  ]"
                />
              </button>
            </label>
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-xs text-foreground">Hide on Mobile</span>
              <button
                :class="[
                  'relative h-5 w-9 rounded-full transition-colors duration-200 cursor-pointer',
                  node.visibility?.hideMobile ? 'bg-foreground' : 'bg-foreground/20',
                ]"
                @click="updateVisibility({ hideMobile: !node.visibility?.hideMobile })"
              >
                <span
                  :class="[
                    'absolute top-0.5 left-0.5 size-4 rounded-full bg-background shadow transition-transform duration-200',
                    node.visibility?.hideMobile && 'translate-x-4',
                  ]"
                />
              </button>
            </label>
          </div>

          <!-- Conditional logic -->
          <div v-if="hasFields" class="space-y-1.5 pt-1">
            <span class="text-[10px] text-secondary">Conditional Logic</span>
            <SelectUi
              :model-value="node.visibility?.condition?.operator ?? ''"
              :options="conditionOperatorOptions"
              @update:model-value="(v: string) => updateVisibility({
                condition: v ? { field: node?.visibility?.condition?.field ?? '', operator: v as any, value: node?.visibility?.condition?.value } : undefined
              })"
            />
            <template v-if="node.visibility?.condition?.operator">
              <SelectUi
                :model-value="node.visibility?.condition?.field ?? ''"
                :options="[
                  { value: '', label: 'Select field...' },
                  ...store.activePageFields.map((f) => ({ value: f.key, label: f.label })),
                ]"
                @update:model-value="(v: string) => updateVisibility({
                  condition: { ...node!.visibility!.condition!, field: v }
                })"
              />
              <InputUi
                v-if="node.visibility?.condition?.operator === 'equals' || node.visibility?.condition?.operator === 'not_equals'"
                :model-value="node.visibility?.condition?.value ?? ''"
                placeholder="Value"
                @update:model-value="(v: string) => updateVisibility({
                  condition: { ...node!.visibility!.condition!, value: v }
                })"
              />
            </template>
          </div>
        </div>
      </PropertySectionUi>

      <!-- Custom Attributes -->
      <PropertySectionUi title="Attributes" icon="settings" :default-open="false">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">ID</span>
            <InputUi
              :model-value="node.htmlId ?? ''"
              placeholder="element-id"
              @update:model-value="updateProp('htmlId', $event || undefined)"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Title</span>
            <InputUi
              :model-value="node.htmlTitle ?? ''"
              placeholder="Tooltip text"
              @update:model-value="updateProp('htmlTitle', $event || undefined)"
            />
          </div>

          <!-- Custom key/value attributes -->
          <div class="pt-1.5">
            <span class="text-[10px] text-secondary">Custom Attributes</span>
            <!-- Existing attributes -->
            <div v-if="node.customAttributes" class="space-y-1 mt-1">
              <div
                v-for="(val, key) in node.customAttributes"
                :key="key"
                class="flex items-center gap-1"
              >
                <span class="flex-1 truncate rounded-lg bg-secondary/8 px-2 py-1 text-[10px] font-mono">
                  {{ key }}="{{ val }}"
                </span>
                <button
                  class="flex size-5 shrink-0 items-center justify-center rounded text-secondary cursor-pointer hover:text-red-fg hover:bg-red-bg transition-colors duration-100"
                  @click="removeCustomAttribute(key as string)"
                >
                  <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            </div>
            <!-- Add new -->
            <div class="mt-1 space-y-1">
              <input
                v-model="newAttrKey"
                placeholder="key"
                class="h-7 w-full rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none"
              />
              <div class="flex items-center gap-1">
                <input
                  v-model="newAttrValue"
                  placeholder="value"
                  class="h-7 min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-2 text-[10px] font-mono text-foreground placeholder:text-foreground/30 focus:border-foreground/40 outline-none"
                  @keydown.enter="addCustomAttribute"
                />
                <button
                  class="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-foreground px-2 text-[10px] font-medium text-background cursor-pointer hover:bg-foreground/85 transition-colors duration-150"
                  @click="addCustomAttribute"
                >
                  <svg class="size-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </PropertySectionUi>

      <!-- Link -->
      <PropertySectionUi title="Link" icon="settings" :default-open="false">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">URL</span>
            <InputUi
              :model-value="node.link?.url ?? ''"
              placeholder="https://..."
              @update:model-value="updateLink({ url: $event || undefined })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Target</span>
            <SelectUi
              :model-value="node.link?.target ?? '_self'"
              :options="targetOptions"
              @update:model-value="updateLink({ target: $event as '_self' | '_blank' })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Rel</span>
            <InputUi
              :model-value="node.link?.rel ?? ''"
              placeholder="nofollow noopener"
              @update:model-value="updateLink({ rel: $event || undefined })"
            />
          </div>
        </div>
      </PropertySectionUi>

      <!-- Accessibility -->
      <PropertySectionUi title="Accessibility" icon="settings" :default-open="false">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Role</span>
            <SelectUi
              :model-value="node.accessibility?.role ?? ''"
              :options="roleOptions"
              @update:model-value="updateAccessibility({ role: $event || undefined })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Label</span>
            <InputUi
              :model-value="node.accessibility?.ariaLabel ?? ''"
              placeholder="Accessible label"
              @update:model-value="updateAccessibility({ ariaLabel: $event || undefined })"
            />
          </div>
          <div v-if="isImage" class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Alt</span>
            <InputUi
              :model-value="node.accessibility?.altText ?? ''"
              placeholder="Image description"
              @update:model-value="updateAccessibility({ altText: $event || undefined })"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="w-12 text-[10px] text-secondary">Tab</span>
            <InputUi
              :model-value="node.accessibility?.tabIndex !== undefined ? String(node.accessibility.tabIndex) : ''"
              placeholder="0"
              @update:model-value="updateAccessibility({ tabIndex: $event ? Number($event) : undefined })"
            />
          </div>
        </div>
      </PropertySectionUi>

      <!-- Advanced -->
      <PropertySectionUi title="Advanced" icon="settings" :default-open="false">
        <div class="space-y-1.5">
          <div class="space-y-1">
            <span class="text-[10px] text-secondary">Custom CSS Classes</span>
            <InputUi
              :model-value="node.advanced?.customCssClass ?? ''"
              placeholder="my-class another-class"
              @update:model-value="updateAdvanced({ customCssClass: $event || undefined })"
            />
          </div>
          <div class="space-y-1">
            <span class="text-[10px] text-secondary">Code Before Element</span>
            <textarea
              :value="node.advanced?.codeBefore ?? ''"
              placeholder="<!-- HTML or script -->"
              rows="2"
              class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[10px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10"
              @input="updateAdvanced({ codeBefore: ($event.target as HTMLTextAreaElement).value || undefined })"
            />
          </div>
          <div class="space-y-1">
            <span class="text-[10px] text-secondary">Code After Element</span>
            <textarea
              :value="node.advanced?.codeAfter ?? ''"
              placeholder="<!-- HTML or script -->"
              rows="2"
              class="w-full resize-none rounded-xl border border-foreground/15 bg-transparent px-2.5 py-2 text-[10px] font-mono text-foreground placeholder:text-foreground/40 focus:border-foreground/40 outline-3 outline-transparent focus:outline-secondary/10"
              @input="updateAdvanced({ codeAfter: ($event.target as HTMLTextAreaElement).value || undefined })"
            />
          </div>
        </div>
      </PropertySectionUi>
    </div>

    <!-- Delete -->
    <section v-if="!isBody" class="pt-3">
      <button
        class="w-full h-8 rounded-xl border border-red-border bg-red-bg text-xs font-medium text-red-fg cursor-pointer hover:bg-red-bg/80 transition-colors duration-150"
        @click="removeNode"
      >
        Delete element
      </button>
    </section>
  </div>
</template>
