import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readFeatures } from './features.functions';
export const featureQuery = (userId:string) => queryOptions({queryKey:['features',userId],queryFn:()=>readFeatures(),staleTime:60000,retry:1});
export async function loadFeatures({context}:{context:{queryClient:QueryClient}}) {
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return;
  await context.queryClient.ensureQueryData(featureQuery(user.id));
}