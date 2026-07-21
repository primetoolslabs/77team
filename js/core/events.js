const bus=new EventTarget();
export const events={on:(name,fn)=>bus.addEventListener(name,fn),off:(name,fn)=>bus.removeEventListener(name,fn),emit:(name,detail={})=>bus.dispatchEvent(new CustomEvent(name,{detail}))};
