/**
 * Ctrl+Enter (Cmd+Enter on macOS) submits a form from its textarea; plain
 * Enter still inserts a newline. Used by the report dialog.
 */

/** Apple platforms use Cmd (⌘) where others use Ctrl */
export function isApplePlatform(nav: { platform?: string; userAgent?: string } | undefined): boolean {
  if (!nav) return false;
  return /Mac|iPhone|iPad|iPod/i.test(nav.platform || nav.userAgent || '');
}

/** The key combination as shown to the reader: "⌘+Enter" or "Ctrl+Enter" */
export function submitShortcutLabel(apple: boolean): string {
  return apple ? '⌘+Enter' : 'Ctrl+Enter';
}

type KeyLike = Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'isComposing'>;

/** Whether the key event is the submit shortcut (never while an IME composes) */
export function isSubmitShortcut(e: KeyLike, apple: boolean): boolean {
  if (e.key !== 'Enter' || e.isComposing || e.altKey || e.shiftKey) return false;
  return apple ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}
