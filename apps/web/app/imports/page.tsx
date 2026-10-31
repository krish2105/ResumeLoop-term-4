"use client";
import ImportPanel from '../ImportPanel';
import {PageHead} from '@/components/AppShell';
import {LocalOnly} from '@/components/LocalOnly';
import {API, DEMO} from '@/lib/client';

export default function ImportsPage() {
  if (DEMO) return <LocalOnly title="Imports" />;
  return <>
    <PageHead eyebrow="Data" title="Imports" intro="Validate, preview and save fictional CSV records with a SHA-256 receipt. Exact retries never write twice." />
    <ImportPanel api={API} onSaved={async () => {}} />
  </>;
}
