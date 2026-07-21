import {SYSTEM_ROLES} from './config.js';
export const ROLE_PERMISSIONS=Object.freeze({
 [SYSTEM_ROLES.DEV]:{home:true,operation:true,management:true,administration:true,devCenter:true},
 [SYSTEM_ROLES.LIDERANCA]:{home:true,operation:true,management:true,administration:true,devCenter:false},
 [SYSTEM_ROLES.STAFF]:{home:true,operation:true,management:true,administration:false,devCenter:false},
 [SYSTEM_ROLES.MEMBRO]:{home:true,operation:false,management:false,administration:false,devCenter:false}
});
export function normalizeRole(value=''){const v=String(value).trim().toLowerCase();if(v==='dev')return SYSTEM_ROLES.DEV;if(['liderança','lideranca','leadership'].includes(v))return SYSTEM_ROLES.LIDERANCA;if(v==='staff')return SYSTEM_ROLES.STAFF;return SYSTEM_ROLES.MEMBRO}
export function permissionsFor(role){return ROLE_PERMISSIONS[normalizeRole(role)]}
