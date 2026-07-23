import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface PromptOptions extends ConfirmOptions {
  placeholder?: string
  initialValue?: string
}

export interface ProcessOptions {
  title: string
  message?: string
  // when known ahead of time; otherwise call progress() as it streams
  progress?: { loaded: number; total: number }
}

export interface ProcessResult {
  title?: string
  message?: string
  // an external URL to surface (e.g. the published site) as a link
  link?: string
  closeLabel?: string
}

// The single active dialog. Only one shows at a time — confirm/prompt resolve a
// promise; process is imperative (returns a controller the caller drives).
interface DialogState {
  open: boolean
  kind: 'confirm' | 'prompt' | 'process'
  title: string
  message: string
  danger: boolean
  confirmLabel: string
  cancelLabel: string
  // prompt
  inputValue: string
  placeholder: string
  // process
  phase: 'busy' | 'success' | 'error'
  progress: { loaded: number; total: number } | null
  link: string | null
}

const state = reactive<DialogState>({
  open: false,
  kind: 'confirm',
  title: '',
  message: '',
  danger: false,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  inputValue: '',
  placeholder: '',
  phase: 'busy',
  progress: null,
  link: null,
})

let resolveFn: ((value: unknown) => void) | null = null

function settle(value: unknown) {
  const fn = resolveFn
  resolveFn = null
  state.open = false
  fn?.(value)
}

export interface ProcessController {
  progress(loaded: number, total: number): void
  update(message: string): void
  succeed(result?: ProcessResult): void
  fail(message: string): void
  close(): void
}

export function useDialog() {
  function confirm(opts: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      resolveFn = resolve as (v: unknown) => void
      Object.assign(state, {
        open: true,
        kind: 'confirm',
        title: opts.title,
        message: opts.message ?? '',
        danger: opts.danger ?? false,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
      })
    })
  }

  function prompt(opts: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      resolveFn = resolve as (v: unknown) => void
      Object.assign(state, {
        open: true,
        kind: 'prompt',
        title: opts.title,
        message: opts.message ?? '',
        danger: opts.danger ?? false,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel: opts.cancelLabel ?? 'Cancel',
        inputValue: opts.initialValue ?? '',
        placeholder: opts.placeholder ?? '',
      })
    })
  }

  // Imperative status modal. The returned controller drives it to completion.
  function process(opts: ProcessOptions): ProcessController {
    resolveFn = null
    Object.assign(state, {
      open: true,
      kind: 'process',
      title: opts.title,
      message: opts.message ?? '',
      phase: 'busy',
      progress: opts.progress ?? null,
      link: null,
      confirmLabel: 'Done',
    })
    return {
      progress(loaded, total) {
        state.progress = { loaded, total }
      },
      update(message) {
        state.message = message
      },
      succeed(result) {
        state.phase = 'success'
        state.progress = null
        if (result?.title) state.title = result.title
        state.message = result?.message ?? ''
        state.link = result?.link ?? null
        state.confirmLabel = result?.closeLabel ?? 'Done'
      },
      fail(message) {
        state.phase = 'error'
        state.progress = null
        state.message = message
        state.confirmLabel = 'Close'
      },
      close() {
        state.open = false
      },
    }
  }

  // Called by the dialog component.
  function accept() {
    if (state.kind === 'prompt') {
      const value = state.inputValue.trim()
      settle(value.length ? value : null)
    } else {
      settle(true)
    }
  }

  function cancel() {
    if (state.kind === 'prompt') settle(null)
    else settle(false)
  }

  function close() {
    state.open = false
    settle(state.kind === 'confirm' ? false : null)
  }

  return { state, confirm, prompt, process, accept, cancel, close }
}
