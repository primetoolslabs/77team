import {APP_CONFIG} from './core/config.js';
import {mountVersionChip} from './components/version-chip.js';
document.documentElement.dataset.appVersion=APP_CONFIG.version;
document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('v30-foundation');mountVersionChip();window.V30_FOUNDATION=Object.freeze({config:APP_CONFIG,ready:true});document.dispatchEvent(new CustomEvent('v30:ready',{detail:APP_CONFIG}))});
