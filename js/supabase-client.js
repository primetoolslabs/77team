import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,SUPABASE_MIGRATION_MODE} from "./supabase-config.js";

const STORAGE_KEY="77team-supabase-session-v1";

function loadSession(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch{return null}
}
function saveSession(session){
  if(session)localStorage.setItem(STORAGE_KEY,JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}
function headers(extra={}){
  const session=loadSession();
  return {
    apikey:SUPABASE_PUBLISHABLE_KEY,
    Authorization:`Bearer ${session?.access_token||SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type":"application/json",
    ...extra
  };
}
async function request(path,{method="GET",body,prefer,auth=false}={}){
  const url=`${SUPABASE_URL}${path}`;
  const response=await fetch(url,{
    method,
    headers:auth?{
      apikey:SUPABASE_PUBLISHABLE_KEY,
      "Content-Type":"application/json"
    }:headers(prefer?{Prefer:prefer}:{}),
    body:body===undefined?undefined:JSON.stringify(body)
  });
  let data=null;
  const text=await response.text();
  if(text){try{data=JSON.parse(text)}catch{data=text}}
  if(!response.ok){
    const message=data?.msg||data?.message||data?.error_description||data?.error||`HTTP ${response.status}`;
    const error=new Error(message);
    error.status=response.status;
    error.data=data;
    throw error;
  }
  return data;
}

export const SupabaseShadow={
  mode:SUPABASE_MIGRATION_MODE,
  getSession:loadSession,
  isConnected(){return Boolean(loadSession()?.access_token)},
  async login(email,password){
    const data=await request("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password},auth:true});
    saveSession(data);
    return data;
  },
  async logout(){saveSession(null)},
  async refresh(){
    const session=loadSession();
    if(!session?.refresh_token)return null;
    const data=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:{refresh_token:session.refresh_token},auth:true});
    saveSession(data);
    return data;
  },
  async profile(){
    const session=loadSession();
    if(!session?.user?.id)return null;
    const rows=await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id)}&select=*`);
    return Array.isArray(rows)?rows[0]||null:null;
  },
  async health(){
    const rows=await request("/rest/v1/public_home?select=id&limit=1");
    return {ok:true,rows};
  },
  async query(table,query="select=*"){
    return request(`/rest/v1/${table}?${query}`);
  },
  async insert(table,row,{returning=true}={}){
    return request(`/rest/v1/${table}`,{
      method:"POST",body:row,
      prefer:returning?"return=representation":"return=minimal"
    });
  },
  async upsert(table,row,onConflict="legacy_id"){
    return request(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,{
      method:"POST",body:row,
      prefer:"resolution=merge-duplicates,return=representation"
    });
  },
  async update(table,filter,row){
    return request(`/rest/v1/${table}?${filter}`,{
      method:"PATCH",body:row,prefer:"return=representation"
    });
  }
};

window.SupabaseShadow=SupabaseShadow;
