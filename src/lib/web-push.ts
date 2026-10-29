export async function enableWebPush(){
 const appId=import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'];
 const vapidKey=import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'];
 const config={apiKey:import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'],projectId:import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'],appId,messagingSenderId:appId?.split(':')[1]??''};
 if(!config.apiKey||!config.projectId||!appId||!vapidKey)return {status:'not-configured' as const};
 if(window.top!==window.self)return {status:'open-in-new-tab' as const};
 const {getMessaging,getToken,isSupported}=await import('firebase/messaging');
 if(!('Notification' in window)||!(await isSupported()))return {status:'unsupported' as const};
 const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
 if(permission!=='granted')return {status:'denied' as const};
 const {initializeApp,getApps}=await import('firebase/app');
 const app=getApps().find(a=>a.name==='fitrah-push')??initializeApp(config,'fitrah-push');
 const query=new URLSearchParams(config).toString();
 const registration=await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`,{scope:'/push/'});
 const token=await getToken(getMessaging(app),{vapidKey,serviceWorkerRegistration:registration});
 return token?{status:'registered' as const,token}:{status:'denied' as const};
}
export function rememberPushToken(userId:string,token:string){localStorage.setItem(`fitrah-push-${userId}`,token);}
export function devicePushToken(userId:string){return localStorage.getItem(`fitrah-push-${userId}`);}
export function forgetPushToken(userId:string){localStorage.removeItem(`fitrah-push-${userId}`);}