import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import courtyard from '@/assets/courtyard.jpg';
import { Button } from '@/components/ui/button';
import { StarMark } from './foundation';

export function FitrahNotFound() {
  return <main className="missing-page"><img src={courtyard} alt="Quiet mosque courtyard with arches"/><div className="missing-content"><StarMark/><p className="eyebrow">FITRAH · 404</p><h1>A little off the path.</h1><p>This page could not be found.</p><Button asChild><Link to="/dashboard"><ArrowLeft/>Go to Dashboard</Link></Button></div></main>;
}
export function FitrahError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return <main className="splash-screen"><StarMark/><h2 className="font-display text-2xl mt-6">A moment to reconnect.</h2><p>This page could not be loaded.</p><Button className="mt-6" onClick={() => { void router.invalidate(); reset(); }}><RotateCcw/>Try again</Button></main>;
}