import {PageHead} from './AppShell';

export function LocalOnly({title}: {title: string}) {
  return <>
    <PageHead eyebrow="Local app only" title={title} intro="This screen writes to the local database, so it is switched off in the public demo." />
    <section className="panel"><h2>Run it on your computer</h2><p>Clone the repository and follow PROGRESS.md to start the API and the web app. Everything here then works with your own fictional data.</p></section>
  </>;
}
