/**
 * Footnote Popover — shows footnote content in a floating card
 * near the clicked reference number instead of jumping to the bottom.
 *
 * Falls back to default anchor-link behavior when JS is disabled.
 */

let activePopover: HTMLElement | null = null;

function dismiss() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}

function positionPopover(popover: HTMLElement, anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const popoverWidth = Math.min(400, window.innerWidth - 32);

  // Horizontal: center on anchor, clamp to viewport
  let left = rect.left + rect.width / 2 - popoverWidth / 2;
  left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));

  // Vertical: prefer above; fall below if not enough room
  popover.style.width = `${popoverWidth}px`;
  popover.style.position = 'fixed';
  popover.style.left = `${left}px`;
  popover.style.zIndex = '9999';

  // Temporarily place off-screen to measure height
  popover.style.top = '-9999px';
  popover.style.visibility = 'hidden';
  document.body.appendChild(popover);
  const popoverHeight = popover.offsetHeight;
  popover.style.visibility = '';

  const arrowEl = popover.querySelector('.footnote-popover-arrow') as HTMLElement | null;
  const gap = 8;

  if (rect.top - popoverHeight - gap > 8) {
    // Place above
    popover.style.top = `${rect.top - popoverHeight - gap}px`;
    if (arrowEl) {
      arrowEl.classList.remove('arrow-up');
      arrowEl.classList.add('arrow-down');
    }
  } else {
    // Place below
    popover.style.top = `${rect.bottom + gap}px`;
    if (arrowEl) {
      arrowEl.classList.remove('arrow-down');
      arrowEl.classList.add('arrow-up');
    }
  }

  // Position the arrow horizontally to point at the anchor center
  if (arrowEl) {
    const anchorCenter = rect.left + rect.width / 2;
    const popoverLeft = parseFloat(popover.style.left);
    const arrowLeft = Math.max(12, Math.min(anchorCenter - popoverLeft, popoverWidth - 12));
    arrowEl.style.left = `${arrowLeft}px`;
  }
}

function showPopover(ref: HTMLAnchorElement) {
  dismiss();

  const fnId = ref.getAttribute('href')?.replace('#fn-', '');
  if (!fnId) return;

  const fnItem = document.getElementById(`fn-${fnId}`);
  if (!fnItem) return;

  const popover = document.createElement('div');
  popover.className = 'footnote-popover';
  popover.innerHTML = `
    <div class="footnote-popover-arrow arrow-down"></div>
    <div class="footnote-popover-body">
      <span class="footnote-popover-content">${fnItem.innerHTML}</span>
      <button class="fn-close" aria-label="Close" title="Close">&times;</button>
    </div>
  `;

  popover.querySelector('.fn-close')!.addEventListener('click', (e) => {
    e.stopPropagation();
    dismiss();
  });

  // Prevent clicks inside popover from dismissing it
  popover.addEventListener('click', (e) => e.stopPropagation());

  activePopover = popover;
  positionPopover(popover, ref);
}

// Attach handlers
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.footnote-ref');
    if (ref) {
      e.preventDefault();
      showPopover(ref);
      return;
    }
    // Click outside dismisses
    if (activePopover && !(e.target as HTMLElement).closest('.footnote-popover')) {
      dismiss();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismiss();
  });
});
