'use client';

import { useEffect } from 'react';

/**
 * Minimal, jQuery-free replacement for the Bootstrap dropdown behavior the admin
 * uses. We set inline styles directly on the menu so we don't depend on the LBD
 * dropdown animation CSS (which keys off Bootstrap's JS). Modals are handled by
 * React state in their own components.
 */
export default function BootstrapBehaviors() {
  useEffect(() => {
    // LBD applies a CSS animation to `.dropdown-menu` that ends hidden; only
    // `!important` inline props win, so use setProperty with the priority flag.
    function show(menu: HTMLElement) {
      menu.style.setProperty('animation', 'none', 'important');
      menu.style.setProperty('visibility', 'visible', 'important');
      menu.style.setProperty('opacity', '1', 'important');
      menu.style.setProperty('transform', 'none', 'important');
      menu.style.setProperty('display', 'block', 'important');
      menu.dataset.open = 'true';
    }
    function hide(menu: HTMLElement) {
      ['animation', 'visibility', 'opacity', 'transform', 'display'].forEach((p) =>
        menu.style.removeProperty(p),
      );
      delete menu.dataset.open;
      menu.closest('.dropdown')?.classList.remove('show');
    }
    function closeAll(except?: Element) {
      document
        .querySelectorAll<HTMLElement>('.dropdown-menu[data-open="true"]')
        .forEach((menu) => {
          if (menu !== except && !menu.contains(except ?? null)) hide(menu);
        });
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const toggle = target.closest<HTMLElement>('[data-toggle="dropdown"]');
      if (toggle) {
        e.preventDefault();
        const parent = toggle.closest('.dropdown');
        const menu = parent?.querySelector<HTMLElement>('.dropdown-menu');
        const isOpen = menu?.dataset.open === 'true';
        closeAll();
        if (menu && !isOpen) {
          parent?.classList.add('show');
          show(menu);
        }
        return;
      }
      closeAll();
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
