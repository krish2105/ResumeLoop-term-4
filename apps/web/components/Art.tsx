import {ART, type ArtName} from '@/lib/art';

const src = (name: ArtName, w: 640 | 1280) => `/images/art/${name}-${w}.webp`;

/** A responsive illustration. With `dark`, the second image replaces the first while the dark theme is on.
 *  `decorative` hides it from screen readers when the heading next to it already says the same thing. */
export function Art({name, dark, className = '', sizes = '(max-width: 760px) 100vw, 480px', eager = false, decorative = false}: {
  name: ArtName; dark?: ArtName; className?: string; sizes?: string; eager?: boolean; decorative?: boolean;
}) {
  const img = (n: ArtName, extra: string) => <img className={'art ' + extra} src={src(n, 1280)} srcSet={`${src(n, 640)} 640w, ${src(n, 1280)} 1280w`}
    sizes={sizes} width={ART[n].w} height={ART[n].h} alt={decorative ? '' : ART[n].alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />;
  return <figure className={'artFrame ' + className}>
    {img(name, dark ? 'artLight' : '')}
    {dark && img(dark, 'artDark')}
  </figure>;
}
