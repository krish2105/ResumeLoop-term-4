export function AiBadge({mode, model, recordedAt}: {mode: string; model: string | null; recordedAt?: string}) {
  const text = recordedAt && (mode === 'ai' || mode === 'abstained')
    ? `Recorded answer · ${model || 'local model'} · ${recordedAt.slice(0, 10)}`
    : mode === 'ai' ? `AI · ${model} · runs on this computer`
    : mode === 'abstained' ? 'AI declined to answer (not in the sources)'
    : mode === 'demo' ? 'Demo limit'
    : 'AI offline · deterministic text';
  return <span className={'aiBadge ' + mode}>{text}</span>;
}
