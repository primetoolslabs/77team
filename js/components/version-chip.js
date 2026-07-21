import {APP_CONFIG} from '../core/config.js';
export function mountVersionChip(){const target=document.querySelector('[data-v30-version-target], .topbar, .app-topbar');if(!target||target.querySelector('.v30-version-chip'))return;const chip=document.createElement('span');chip.className='v30-version-chip';chip.textContent=`${APP_CONFIG.label} • ${APP_CONFIG.status}`;target.appendChild(chip)}
