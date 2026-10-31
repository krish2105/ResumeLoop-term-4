// Illustrations generated with ChatGPT (OpenAI gpt-image) from the prompts in docs/IMAGE_BRIEF.md.
// They illustrate the process; none of them is research evidence. Built by design/images/build.sh.
export const ART = {
  'hero-dusk-road': {w: 1672, h: 941, alt: 'A paper-cut ember path winding through dusk hills, the next stone glowing'},
  'no-webgl-road': {w: 1672, h: 941, alt: 'An illustrated trail map: done stones stitched green, the next one glowing, the rest waiting'},
  'pilot-how-it-works': {w: 1911, h: 819, alt: 'A coordinator sends one course file to three learners on their own devices; their progress files come back into a folder'},
  'privacy-local': {w: 1448, h: 1086, alt: 'A person works at a laptop inside a small lit house, their papers kept beside them'},
  'sdg4-lifelong-learning': {w: 1448, h: 1086, alt: 'Learners of different ages walk their own glowing paths towards one open book'},
  'stop-cover': {w: 1672, h: 941, alt: 'An ember path winds over hills past six waymarkers, the first one lit'},
  'stop-empathise': {w: 1672, h: 941, alt: 'Three people talk around a lantern-lit table, one taking notes'},
  'stop-define': {w: 1671, h: 941, alt: 'Paper notes grouped into four clusters, one cluster highlighted'},
  'stop-ideate': {w: 1671, h: 941, alt: 'Eight quick idea sketches on a table, the lit one marked with three votes'},
  'stop-prototype': {w: 1671, h: 941, alt: 'A paper phone showing the ember path, with scissors and tape beside it'},
  'stop-test': {w: 1670, h: 941, alt: 'A learner tries a phone prototype while an observer times the task'},
  'stop-impact': {w: 1672, h: 941, alt: 'People of all ages walk glowing paths towards a lit place of learning'},
  'stop-closing': {w: 1672, h: 941, alt: 'The ember path fully lit, ending at a glowing stone on a hilltop'},
  'empty-plan': {w: 1254, h: 1254, alt: 'A short path with one unlit stone beside an hourglass'},
  'initial-hero-dusk-road-concept': {w: 1536, h: 1024, alt: 'A learner with a backpack looks along a path of stones, the nearest one glowing'},
  'initial-paper-cut-light-style': {w: 1536, h: 1024, alt: 'A learner reads a glowing book under a tree at dusk'},
  'initial-paper-cut-dark-style': {w: 1536, h: 1024, alt: 'A learner reads a glowing book under a tree at night'},
} as const;
export type ArtName = keyof typeof ART;

export const STOP_ART: Record<string, ArtName> = {
  empathise: 'stop-empathise', define: 'stop-define', ideate: 'stop-ideate', prototype: 'stop-prototype', test: 'stop-test', impact: 'stop-impact',
};
export const ART_CREDIT = 'Illustrations generated with ChatGPT (OpenAI) for ResumeLoop. They illustrate the process and are not research photos.';
