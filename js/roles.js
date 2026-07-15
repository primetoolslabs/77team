export const CLANS=["77 Team I","77 Team II","亗 DHM黑龙77 亗","DHM 亗 白龙 ②","Projeto X"];
export const MEMBER_ROLES=["Membros","PT TIME","PT BOOST","PT CORE"];
export const ALL_ROLES=["Staff",...MEMBER_ROLES];
export function roleBadge(role){
  const cls={"Staff":"role-staff","Membros":"role-member","Membro":"role-member","PT TIME":"role-time","PT BOOST":"role-boost","PT CORE":"role-core"}[role]||"role-member";
  return `<span class="role-badge ${cls}">${role||"Membros"}</span>`;
}
