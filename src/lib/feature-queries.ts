import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { readFeatures } from './features.functions';
import { currentUser } from './current-user';
import { isNativeBuild } from './native/client';
import { loadFeaturesLocalFirst } from './native/sync';
import type { FeatureData } from './sync-model';
export const featureQuery = (userId:string) => queryOptions<FeatureData>({
  queryKey:['features',userId],
  // The phone app reads its on-device copy first and syncs in the background; the website reads the server.
  queryFn:isNativeBuild?()=>loadFeaturesLocalFirst(userId):()=>readFeatures(),
  staleTime:isNativeBuild?Infinity:60000,
  retry:1,
});
export async function loadFeatures({context}:{context:{queryClient:QueryClient}}) {
  const user=await currentUser();
  if(!user) return;
  await context.queryClient.ensureQueryData(featureQuery(user.id));
}
