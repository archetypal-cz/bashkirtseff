import { watch, nextTick, type Ref } from 'vue';

/**
 * useDialog — shared modal-dialog focus behavior (A11y WS-C/C1).
 *
 * Extracted from the reference implementation: ParagraphToolbar's Teleported
 * bottom sheet (Escape close, Tab focus-trap, focus-move-on-open, focus
 * restore to the trigger on close). Give the dialog element `role="dialog"`,
 * `aria-modal="true"`, a translated `aria-label` and `tabindex="-1"`, bind
 * `@keydown="onDialogKeydown"` on it, and call this composable with the open
 * state and the element ref.
 */
export function useDialog(
  isOpen: Ref<boolean>,
  dialogEl: Ref<HTMLElement | null>,
  opts?: { close?: () => void },
) {
  let lastFocused: HTMLElement | null = null;

  function getFocusable(): HTMLElement[] {
    if (!dialogEl.value) return [];
    return Array.from(
      dialogEl.value.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
      // getClientRects: skip elements hidden inside collapsed sections
    ).filter(el => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
  }

  function close() {
    if (opts?.close) opts.close();
    else isOpen.value = false;
  }

  function onDialogKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || active === dialogEl.value)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // flush:'post' — run after the DOM settles so the isConnected guard sees the
  // real world. Example (a pinnable sidebar): pinning flips the dialog state off AND
  // removes the original trigger in the same flush; restoring focus to that
  // vanishing trigger would strand keyboard focus on <body>. With the guard,
  // focus simply stays where the user put it (e.g. on the pin button).
  watch(isOpen, async open => {
    if (open) {
      lastFocused = document.activeElement as HTMLElement | null;
      await nextTick();
      // Focus the dialog itself (tabindex="-1"); Tab then enters its controls.
      dialogEl.value?.focus();
    } else {
      if (lastFocused?.isConnected) lastFocused.focus();
      lastFocused = null;
    }
  }, { flush: 'post' });

  return { onDialogKeydown, closeDialog: close };
}
