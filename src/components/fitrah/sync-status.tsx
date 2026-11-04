import { useSyncExternalStore } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { syncStatus, dismissRejected } from '@/lib/native/sync';
import { isNativeBuild } from '@/lib/native/client';

const serverSnapshot = () => ({ online: true, syncing: false, pending: 0, rejected: 0 });

/** Phone app only: a small offline / syncing indicator at the top of signed-in screens. */
export function SyncStatus() {
 const status = useSyncExternalStore(syncStatus.subscribe, syncStatus.get, serverSnapshot);
 if (!isNativeBuild) return null;
 const waiting = status.pending === 1 ? '1 change waiting to sync' : `${status.pending} changes waiting to sync`;
 return <>
  {!status.online && <div className="sync-pill offline" role="status"><CloudOff size={13}/>Offline{status.pending ? ` · ${waiting}` : ' · saved on this phone'}</div>}
  {status.online && status.pending > 0 && <div className="sync-pill" role="status"><RefreshCw size={13} className={status.syncing ? 'animate-spin' : ''}/>{status.syncing ? 'Syncing…' : waiting}</div>}
  {status.rejected > 0 && <button type="button" className="sync-pill rejected" role="alert" onClick={dismissRejected}>{status.rejected === 1 ? '1 change' : `${status.rejected} changes`} couldn’t be saved and {status.rejected === 1 ? 'was' : 'were'} undone · Dismiss</button>}
 </>;
}
