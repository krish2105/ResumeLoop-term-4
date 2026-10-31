"use client";
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

/** Local-only screens are not offered on the public site; an old link goes to the journey instead. */
export function LocalOnly() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, [router]);
  return <p className="empty" role="status">Opening your journey…</p>;
}
