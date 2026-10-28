import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {describe,it,expect,vi,beforeEach} from 'vitest';
import {FeatureProvider,useFeatures} from '@/components/fitrah/feature-store';
const mocks=vi.hoisted(()=>({read:vi.fn(),write:vi.fn()}));
vi.mock('@/components/fitrah/auth-store',()=>({useAuth:()=>({user:{id:'owner'}})}));
vi.mock('@tanstack/react-start',()=>({useServerFn:(fn:unknown)=>fn}));
vi.mock('@/lib/features.functions',()=>({readFeatures:mocks.read,writeTodo:mocks.write,writePrayer:vi.fn(),removeTodo:vi.fn(),reorderTodos:vi.fn(),writeTask:vi.fn(),removeTask:vi.fn()}));
const empty={prayers:{},todos:[],tasks:[],timezone:'Asia/Kolkata'};
const todo={id:'9eec8d4e-b6fc-4bfb-8daf-7bdd363fe6a5',title:'Read',priority:'Medium' as const,due:'',time:'',completed:false};
function Consumer(){const {todos,saveTodo,busy}=useFeatures();return <><output aria-label="Saved count">{todos.length}</output><button disabled={busy} onClick={()=>saveTodo(todo)}>Save</button></>;}
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});client.setQueryData(['features','owner'],empty);render(<QueryClientProvider client={client}><FeatureProvider><Consumer/></FeatureProvider></QueryClientProvider>);return client;}
describe('Saved feature store',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('reads the persisted result after a successful owner save',async()=>{mocks.write.mockResolvedValue(true);mocks.read.mockResolvedValue({...empty,todos:[todo]});mount();fireEvent.click(screen.getByText('Save'));await waitFor(()=>expect(screen.getByLabelText('Saved count')).toHaveTextContent('1'));expect(mocks.write).toHaveBeenCalledWith({data:todo});});
 it('keeps prior data and reports a rejected save',async()=>{mocks.write.mockRejectedValue(new Error('offline'));mount();fireEvent.click(screen.getByText('Save'));await screen.findByRole('alert');expect(screen.getByLabelText('Saved count')).toHaveTextContent('0');expect(mocks.read).not.toHaveBeenCalled();expect(screen.getByText('Save')).not.toBeDisabled();});
});