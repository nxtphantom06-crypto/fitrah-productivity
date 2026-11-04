import { createFileRoute } from '@tanstack/react-router';
import { NATIVE_AUTH_SCHEME, NATIVE_AUTH_HOST } from '@/lib/native/auth-callback';

// Hosted page opened by the Android app in the phone's browser. It runs the normal Google sign-in,
// then hands the new session back to the app through its own link. It never loads the website's
// sign-in state, so a website session in the same browser is left untouched.
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Signing in to Fitrah</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0F766E;color:#fff;font:16px system-ui,sans-serif;text-align:center;padding:24px}a{color:#fff}</style></head>
<body><main><h1 style="font-weight:500">fitrah.</h1><p id="m">Connecting to Google…</p><p id="l" hidden><a id="a" href="#">Return to the Fitrah app</a></p></main>
<script>(function(){
var KEY='fitrah-native-app-state',BROKER='fitrah-native-broker-state',CALLBACK='${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_HOST}';
var q=new URLSearchParams(location.search),h=new URLSearchParams(location.hash.replace(/^#/,''));
function back(params){var url=CALLBACK+'#'+new URLSearchParams(params).toString();history.replaceState(null,'',location.pathname);document.getElementById('m').textContent='Returning to the app…';var a=document.getElementById('a');a.href=url;document.getElementById('l').hidden=false;location.replace(url);}
function rand(){var b=new Uint8Array(16);crypto.getRandomValues(b);return Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2)}).join('');}
var token=h.get('access_token')||q.get('access_token'),err=h.get('error_description')||h.get('error')||q.get('error_description')||q.get('error');
if(token||err){var app=sessionStorage.getItem(KEY)||'',expected=sessionStorage.getItem(BROKER),got=h.get('state')||q.get('state');sessionStorage.removeItem(KEY);sessionStorage.removeItem(BROKER);
 if(!app){document.getElementById('m').textContent='This sign-in link has expired. Please return to the app and try again.';return;}
 if(err){back({state:app,error:'Google sign-in was cancelled or failed. Please try again.'});return;}
 if(got&&expected&&got!==expected){back({state:app,error:'This sign-in link has expired. Please try Google sign-in again.'});return;}
 back({state:app,access_token:token,refresh_token:h.get('refresh_token')||q.get('refresh_token')||''});return;}
var state=q.get('state');
if(!state||!/^[a-f0-9]{32}$/.test(state)){document.getElementById('m').textContent='Open Google sign-in from the Fitrah app.';return;}
var broker=rand();sessionStorage.setItem(KEY,state);sessionStorage.setItem(BROKER,broker);
location.replace('/~oauth/initiate?'+new URLSearchParams({provider:'google',redirect_uri:location.origin+'${'/native-auth'}',state:broker,prompt:'select_account'}).toString());
})();</script></body></html>`;

export const Route = createFileRoute('/native-auth')({
 server: {
  handlers: {
   GET: () => new Response(page, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-frame-options': 'DENY' } }),
  },
 },
});
