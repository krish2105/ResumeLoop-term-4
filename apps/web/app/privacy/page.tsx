import {PageHead} from '@/components/AppShell';
import {ART_CREDIT} from '@/lib/art';

export default function PrivacyPage() {
  return <>
    <PageHead art="privacy-local" eyebrow="Privacy" title="How ResumeLoop handles data" intro="A plain statement of what the app stores, where, and the controls you have. This is a student prototype, not a commercial service." />
    <article className="panel report">
      <section><h2>What is stored</h2><ul>
        <li>Course structure and notes that a coordinator imports, and learner progress (completed tasks, time budget, notes).</li>
        <li>Research records that you enter: participant codes, consent flags, anonymised notes, codes, themes and study results. Names and contact details are rejected.</li>
        <li>An AI log of each AI call (feature, model, outcome). Prompts are stored only as hashes.</li>
        <li>An audit log of changes (who, what, when) when accounts are switched on.</li></ul></section>
      <section><h2>Where it is stored</h2><ul>
        <li>Local app: an SQLite file on the computer running the API. AI runs on the same computer through Ollama; nothing is sent to a cloud model.</li>
        <li>Public demo: only in your browser's local storage, with fictional data and recorded answers.</li></ul></section>
      <section><h2>Your controls</h2><ul>
        <li>Organisation admins can export all of their organisation's data as JSON, and delete it permanently, from Settings and account.</li>
        <li>Participants can withdraw: mark them withdrawn in Research ops and delete their notes.</li>
        <li>Clear the demo's browser data from Settings.</li></ul></section>
      <section><h2>What is not in place yet</h2><ul>
        <li>No encryption at rest beyond the operating system's disk encryption, no hosted backups, and no formal security review.</li>
        <li>Do not store real learner records in this prototype without your institution's approval.</li></ul></section>
      <section><h2>Image credits</h2><p>{ART_CREDIT}</p></section>
    </article>
  </>;
}
