import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { BarChart3, CheckSquare, Home, Moon, User, Sun, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { initializePwa } from '@/lib/pwa/register';

const ThemeContext = createContext({ dark: false, setDark: (_dark: boolean) => {} });
export const useTheme = () => useContext(ThemeContext);
export function FoundationProvider({ children }: { children: ReactNode }) {
 const [dark, setDarkState] = useState(false);
 useEffect(() => { setDarkState(localStorage.getItem('fitrah-theme') === 'dark'); void initializePwa(); }, []);
 useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
 const setDark = (value: boolean) => { setDarkState(value); localStorage.setItem('fitrah-theme', value ? 'dark' : 'light'); };
 return <ThemeContext.Provider value={{ dark, setDark }}><TooltipProvider delayDuration={200}>{children}</TooltipProvider></ThemeContext.Provider>;
}
export function StarMark({ className = '' }: { className?: string }) {
 return <svg viewBox="0 0 40 40" width="35" height="35" fill="none" aria-hidden="true" className={className}><path d="M20 3 25 10 33 7 30 15 37 20 30 25 33 33 25 30 20 37 15 30 7 33 10 25 3 20 10 15 7 7 15 10Z" stroke="currentColor" strokeWidth="1.5"/><path d="m20 11 9 9-9 9-9-9Z" stroke="currentColor" strokeWidth="1.3"/><path d="m20 16 4 4-4 4-4-4Z" fill="currentColor"/></svg>;
}
const navigation = [
 { to: '/dashboard', label: 'Home', icon: Home },
 { to: '/prayers', label: 'Prayers', icon: Moon },
 { to: '/tasks', label: 'Tasks', icon: CheckSquare },
 { to: '/progress', label: 'Progress', icon: BarChart3 },
 { to: '/profile', label: 'Profile', icon: User },
] as const;
export function AppShell({ children }: { children: ReactNode }) {
 const pathname = useRouterState({ select: state => state.location.pathname });
 const { dark, setDark } = useTheme();
 const active = (to: string) => pathname === to || (to === '/dashboard' && pathname === '/') || (to === '/tasks' && (pathname === '/todos' || pathname.startsWith('/tasks/')));
 return <><header className="app-header"><div className="header-inner"><Link to="/dashboard" className="brand" aria-label="Fitrah home"><StarMark/><div><div className="brand-name">fitrah<span className="text-gold">.</span></div><div className="brand-subtitle">ALIGN YOUR DAY WITH PURPOSE</div></div></Link><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(({to,label,icon:Icon}) => <Link key={to} to={to} className={`nav-link ${active(to) ? 'active' : ''}`} aria-current={active(to) ? 'page' : undefined}><Icon size={16} strokeWidth={1.7}/>{label}</Link>)}</nav><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark(!dark)} className="rounded-full text-muted-foreground">{dark ? <Sun/> : <Moon/>}</Button></TooltipTrigger><TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent></Tooltip></div></header><main className="page-container">{children}</main><nav className="bottom-nav" aria-label="Mobile navigation">{navigation.map(({to,label,icon:Icon}) => <Tooltip key={to}><TooltipTrigger asChild><Link to={to} aria-label={label} aria-current={active(to) ? 'page' : undefined} className={`bottom-link ${active(to) ? 'active' : ''}`}><Icon size={22} strokeWidth={1.6}/></Link></TooltipTrigger><TooltipContent side="top">{label}</TooltipContent></Tooltip>)}</nav></>;
}
export function useToday() {
 const [today, setToday] = useState<Date | null>(null);
 useEffect(() => { setToday(new Date()); }, []);
 return today;
}
export function PageHeading({ title, subtitle }: {title: string; subtitle: string}) {
 const today = useToday();
 return <div className="page-heading"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="date-badge"><Sun size={15}/>{today?.toLocaleDateString('en', {weekday:'long', month:'short', day:'numeric', year:'numeric'})}</div></div>;
}
export function PageFooter() { return <footer className="dashboard-footer"><Sparkles size={13}/><span>A little consistency. A more purposeful day.</span></footer>; }
export function pageHead(title: string, description: string) { return { meta: [{title:`${title} · Fitrah`},{name:'description',content:description},{property:'og:title',content:`${title} · Fitrah`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}] }; }
