export const state={
  user:null,profile:null,guest:false,members:[],attendance:[],users:[],audit:[]
};
export function canEdit(){return state.profile?.role==="owner"||state.profile?.role==="staff"}
export function isOwner(){return state.profile?.role==="owner"}
