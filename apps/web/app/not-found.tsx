import Link from 'next/link';
import {PageHead} from '@/components/AppShell';

export default function NotFound() {
  return <div className="notFound">
    <PageHead art="hero-dusk-road" eyebrow="Page not found" title="This page is off the path"
      intro="The link may be old or mistyped. Nothing you saved is affected." />
    <p><Link className="primaryBtn" href="/">Back to your journey</Link></p>
  </div>;
}
