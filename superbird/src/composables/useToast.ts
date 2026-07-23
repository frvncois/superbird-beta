import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  handler: () => void
}

export interface Toast {
  id: number
  type: ToastType
  message: string
  action?: ToastAction
}

export interface ToastOptions {
  action?: ToastAction
  // 0 keeps the toast until dismissed manually.
  duration?: number
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  error: 6000,
}

// Module-scope singleton: one queue shared by every useToast() caller, so the
// host mounted in App.vue renders toasts pushed from anywhere (stores, actions).
const toasts = ref<Toast[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let seq = 0

function clearTimer(id: number) {
  const t = timers.get(id)
  if (t) {
    clearTimeout(t)
    timers.delete(id)
  }
}

function dismiss(id: number) {
  clearTimer(id)
  const i = toasts.value.findIndex((t) => t.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}

function push(type: ToastType, message: string, opts: ToastOptions = {}): number {
  const id = ++seq
  toasts.value.push({ id, type, message, action: opts.action })
  const duration = opts.duration ?? DEFAULT_DURATION[type]
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration))
  return id
}

// Run a toast action then dismiss the toast (used by the "Undo" affordance).
function runAction(toast: Toast) {
  toast.action?.handler()
  dismiss(toast.id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    runAction,
    success: (message: string, opts?: ToastOptions) => push('success', message, opts),
    error: (message: string, opts?: ToastOptions) => push('error', message, opts),
    info: (message: string, opts?: ToastOptions) => push('info', message, opts),
  }
}
