# Image brief and master prompts

Prepared 1 November 2026. Generate the images with Nano Banana (Gemini app, Nano Banana Pro if you have it) or ChatGPT,
save them with the file names below, and hand them over; I resize, convert to WebP, add alt text, wire the light and
dark versions and test them.

## The visual idea
ResumeLoop's signature is the ember road at dusk: tasks are lit stones on a winding path, and the next one glows. Every
image extends that one idea in a **layered paper-cut illustration** style: soft risograph grain, a warm limited palette,
calm dusk light. It should feel hand-made and quiet, not like stock "AI startup" art. The 3D road stays the hero of the
journey screen; these images support the other screens, the Week 12 deck and link previews.

## Rules for every image
- **No words, letters or numbers inside the art.** Generated text is unreliable; I set all text in code.
- **No logos or marks:** no SP Jain, UN, SDG wheel, IDEO or app-store marks. The UN restricts use of its emblem and SDG icons.
- **No photos of people.** People appear only as simple, faceless paper-cut figures of mixed ages and skin tones.
- **Never an image that looks like evidence:** no "photo of an interview", no fake app screenshots with data, no charts
  with values. Images illustrate; the research data stays in the app.
- One focal point per image, generous empty space (text sits beside or on top).

## Palette (paste the hex values; they match the app)
| Role | Light (dusk paper) | Dark (ember night) |
|---|---|---|
| Background paper | `#FAF6F0` | `#121011` |
| Raised paper | `#F2EBE2` | `#262023` |
| Line and shadow (graphite) | `#22160F` | `#F1EAE5` (light lines on dark) |
| Ember (main accent) | `#B5401F` | `#FF8E6B` |
| Soft ember wash | `#FBE6DE` | `#3A211B` |
| Done (moss green, small touches) | `#1D7A4F` | `#7BD3A8` |
| Unverified (amber, small touches) | `#8A5A00` | `#F4C76B` |

## How to generate (do this order)
1. **Make the style anchor first:** generate `hero-dusk-road` with the master style block and its prompt. Regenerate
   until you love it. This image sets the style for all the others.
2. **For every other image,** attach the anchor as a reference and start the prompt with:
   *"Use the attached image only as the style reference: match its paper-cut layers, grain, palette, line weight and dusk
   lighting. Do not copy its composition."* Then paste the master style block and the image's prompt.
3. **Dark versions** (marked ◐ below): open the finished light image and send the dark-version edit prompt. Same
   composition, night palette.
4. Ask for the largest size offered (2K or 4K in Nano Banana; the largest size in ChatGPT). Save as PNG.
5. If a result contains text or a logo, reply: *"Remove all text, letters and logos; keep everything else exactly the
   same."*

## Master style block (paste at the top of every prompt)
```
Create a layered paper-cut illustration with a soft risograph grain, in a calm, hand-made editorial style. Flat cut-paper
shapes stacked in shallow layers, with thin soft shadows between layers, as if lit by low warm light at dusk. Limited
palette only: warm paper #FAF6F0, raised sand paper #F2EBE2, graphite #22160F for fine lines and shadows, ember orange
#B5401F as the single strong accent, soft ember wash #FBE6DE, and tiny touches of moss green #1D7A4F. The only light
source is a small glowing ember. Matte paper texture everywhere, no gloss, no gradients beyond the paper grain, no 3D
render look. The image contains no words, letters, numbers, logos or watermarks. People, if any, are simple faceless
cut-paper figures. Leave generous empty paper space.
```

## Dark-version edit prompt (◐)
```
Recolour this exact illustration for a dark theme. Keep the composition, shapes, layers and grain exactly the same.
Change the paper to night tones #121011 and #262023, turn graphite lines into warm light lines #F1EAE5 at low contrast,
make the ember accent glow #FF8E6B with a soft peach halo #FFC2AE, and keep green touches as #7BD3A8. Do not add any
text, logos or new objects.
```

---

## The images, in priority order
Size column: what to request. ◐ = also make the dark version.

### Priority 1: the set that changes how the project looks (12 images)
| # | File name | Size | Where it goes | Alt text I will use |
|---|---|---|---|---|
| 1 | `hero-dusk-road` ◐ | 16:9 | Style anchor; login screen, README banner, link preview background | A paper-cut ember path winding through a dusk landscape, its next stone glowing |
| 2 | `og-share` | 16:9 (I crop to 1200×630) | Preview card when you paste the Vercel link in WhatsApp, LinkedIn or Teams | (decorative; the card title is set in code) |
| 3 | `app-icon` | 1:1 | Home-screen icon on iPhone and Android, browser tab | ResumeLoop icon: a glowing ember stone on a curved path |
| 4–11 | `stop-cover`, `stop-empathise`, `stop-define`, `stop-ideate`, `stop-prototype`, `stop-test`, `stop-impact`, `stop-closing` ◐ | 16:9 | Week 12 slide deck and story mode, one per stop; reused as Design Studio page banners | One line per stop, below |
| 12 | `pilot-how-it-works` ◐ | 21:9 | Browser pilot page: how the course file and progress files travel | Course file goes from coordinator to learners' devices; progress files come back |

### Priority 2: empty, error and offline states (10 images, 1:1, ◐ each)
| # | File name | Where it goes | Alt text |
|---|---|---|---|
| 13 | `empty-plan` | Plan and journey when nothing fits the time budget | An unlit path with one stone waiting for more time |
| 14 | `empty-coach` | Coach before the first question | A small lantern beside an open course notebook |
| 15 | `empty-queue` | Coordinator queue with no questions | An empty letter tray with one ember envelope seal |
| 16 | `empty-notes` | Observe and Research ops before any note | A clipboard and a consent card, blank and ready |
| 17 | `empty-synthesis` | Synthesis board with no themes | Scattered paper sticky notes waiting to be grouped |
| 18 | `empty-reflection` | Reflection journal before an entry | An open journal with a pen and a small ember bookmark |
| 19 | `empty-pilot` | Pilot roll-up before any progress file | An open folder waiting for files |
| 20 | `digest-nothing-changed` | What changed, when nothing changed | A calm path with every stone the same, unchanged |
| 21 | `offline` | Offline page and "the road could not load" | A path fading into dusk mist, one stone still lit |
| 22 | `not-found` | 404 page | A path that forks, with one branch leading back home |

### Priority 3: nice to have (4 images)
| # | File name | Size | Where it goes |
|---|---|---|---|
| 23 | `no-webgl-road` ◐ | 16:9 | Journey screen when the browser cannot draw 3D (instead of a plain message) |
| 24 | `privacy-local` ◐ | 4:3 | Privacy page: data stays on your device |
| 25 | `sdg4-lifelong-learning` ◐ | 4:3 | Course hub SDG canvas and the impact slide (our own art, not the UN icon) |
| 26 | `github-social` | 2:1 | GitHub repository social preview (I can also crop `hero-dusk-road`) |

---

## Prompts (paste after the master style block)

**1. `hero-dusk-road`** (style anchor)
```
A wide dusk landscape of layered paper hills in sand and warm paper tones. An ember-orange path of flat round paper
stepping stones winds from the lower left towards the horizon on the right. The first four stones are pressed flat and
quiet, marked with a tiny moss-green stitch as done; the fifth stone glows softly from within like a coal, casting a
warm halo on the paper around it; the stones beyond it are pale and unlit. A few tiny cut-paper stars sit low in the sky.
Wide, calm composition with the glowing stone just left of centre and open sky on the right two thirds for a headline.
16:9.
```

**2. `og-share`**
```
A close, simple version of an ember stepping-stone path at dusk: three flat paper stones curve gently from the lower left,
the third one glowing softly. Large empty warm-paper area across the top and right for a title set later. Bold, simple
shapes that still read when shown small. 16:9.
```

**3. `app-icon`**
```
A single app icon: on a night background #121011, one flat round ember-orange paper stone that glows softly from within,
resting on a short curved paper path in sand tone that sweeps under it. Centred, bold, simple, readable at small sizes,
with even padding of about 15 percent on every side so it survives a circular crop. 1:1.
```

**4. `stop-cover`** (deck title slide)
```
The ember path seen from slightly above, winding across layered paper hills towards a soft glowing horizon. Along the path
stand six small paper waymarkers of different simple shapes, evenly spaced, each in sand paper, the first one catching the
ember light. Right half left mostly empty for the title. 16:9.
```

**5. `stop-empathise`** (alt: Listening and observing, learners and a researcher at a table)
```
Three faceless cut-paper figures of different ages sit at a low round paper table, one speaking with an open hand, one
listening and taking notes on a small card, one holding a cup. A small ember lantern on the table lights the figures
warmly from the centre. Speech is shown only as simple empty paper shapes. Calm, respectful, attentive mood. Subject on the left
third, empty paper on the right. 16:9.
```

**6. `stop-define`** (alt: Notes clustered into themes, one theme highlighted)
```
Many small paper sticky notes in sand tones are arranged into four loose clusters on a paper wall. Thin graphite threads
link notes inside each cluster. One cluster is lifted slightly forward and edged with ember orange, its thread glowing
faintly. No writing on the notes, only short graphite scribble marks. Subject on the left two thirds, calm space on the
right. 16:9.
```

**7. `stop-ideate`** (alt: Many quick sketches with one idea lit and voted)
```
A paper table seen from above covered with eight small sketch cards laid in a loose grid, each with a different simple
doodle shape. Three small ember dot stickers sit on one card, which glows slightly. A faceless hand holds a pencil at the
edge. Playful but tidy. Subject fills the left two thirds. 16:9.
```

**8. `stop-prototype`** (alt: A paper phone showing the ember path being assembled)
```
A large paper-cut mobile phone lying at an angle, its screen made of layered paper showing a tiny winding ember path with
one glowing stone. Around it lie scissors, a few cut paper pieces and a strip of masking tape, as if the prototype is being
assembled by hand. Subject on the left two thirds. 16:9.
```

**9. `stop-test`** (alt: A learner tries the prototype while an observer quietly times the task)
```
One faceless cut-paper figure sits holding a paper phone with a glowing ember stone on its screen. Beside them a second
figure sits slightly back, holding a small paper stopwatch and a blank clipboard, observing calmly. A soft ember lamp
lights the scene. Respectful, unhurried mood. Subject on the left two thirds. 16:9.
```

**10. `stop-impact`** (alt: Many paths converge on a lit learning building at dusk, lifelong learning)
```
Several thin ember paths from different directions across layered paper hills converge on a small, simple paper building
with warm lit windows, suggesting a place of learning. Faceless paper figures of different ages walk the paths at
different points. Hopeful, quiet dusk light. Wide composition, building right of centre, open sky above. 16:9.
```

**11. `stop-closing`**
```
The end of the ember path at dusk: the last stone glows warmly at a gentle hilltop, and the path behind it is fully lit,
a soft trail of ember light winding back towards the viewer. Calm, complete feeling, lots of open sky for a closing line.
16:9.
```

**12. `pilot-how-it-works`**
```
A wide, left-to-right paper-cut scene in three clear zones on warm paper. Left: a faceless coordinator figure at a desk
holds out one ember-edged paper document. Centre: that same document travels as three copies along thin dashed graphite
paths to three small paper phones and laptops held by faceless learner figures. Right: small paper documents with a moss-
green edge travel back along the dashed paths into an open paper folder on the coordinator's desk. No clouds, servers or
arrows with labels. 21:9.
```

**13–22. Empty and error states.** Use this frame, then the line for each image:
```
A small, centred still-life spot illustration on a plain raised-paper background #F2EBE2, the subject taking about 60
percent of the frame, with soft shadow under it and generous even margins. Quiet, friendly, encouraging mood. 1:1.
Subject:
```
- **13 `empty-plan`:** a short paper path with one unlit stone and a small paper hourglass beside it, sand mostly in the
  top half.
- **14 `empty-coach`:** an open paper notebook with blank pages and a small ember lantern glowing beside it.
- **15 `empty-queue`:** an empty paper letter tray with a single envelope seal in ember orange resting on its edge.
- **16 `empty-notes`:** a paper clipboard with blank lined paper and a small separate card with a moss-green tick, ready
  to be filled.
- **17 `empty-synthesis`:** a handful of blank paper sticky notes scattered loosely, one ember-edged note on top.
- **18 `empty-reflection`:** an open journal with blank pages, a pencil lying across it and an ember ribbon bookmark.
- **19 `empty-pilot`:** an open paper folder, empty, with a single dashed graphite line leading into it.
- **20 `digest-nothing-changed`:** a short straight paper path of identical calm stones, one softly lit, all neatly aligned.
- **21 `offline`:** a short paper path fading into soft sand-coloured mist, the nearest stone still glowing.
- **22 `not-found`:** a paper path that forks in two; one branch fades out, the other curves back with a glowing stone.

**23. `no-webgl-road`**
```
The ember path seen from above as a flat, map-like paper-cut composition: a winding path across layered paper hills with
twelve small stones, the first few moss-green stitched as done, one glowing ember as next, the rest pale. Calm and
legible, like an illustrated trail map without any labels. 16:9.
```

**24. `privacy-local`**
```
A faceless paper figure sits with a paper laptop inside a small, warmly lit paper house with an open door. A few small
paper documents rest on the desk beside them, safely inside. Outside, quiet dusk hills. Feeling: your work stays with you.
4:3.
```

**25. `sdg4-lifelong-learning`**
```
Faceless paper figures of very different ages, a young adult, a working parent and an older learner, each walking their
own short ember path towards one shared open book drawn as layered paper, its pages glowing softly. Inclusive, hopeful,
calm. Not any official emblem or icon. 4:3.
```

**26. `github-social`**
```
The same ember stepping-stone path at dusk, simplified, with the glowing stone on the left third and wide empty warm
paper across the right for the repository name set later. 2:1.
```

---

## Handover checklist (what to send me)
- PNG files named exactly as above; dark versions end in `-dark` (for example `stop-define-dark.png`).
- Tell me which tool made them (Nano Banana or ChatGPT). Both add an invisible AI watermark: Google's SynthID and
  C2PA content credentials. That is fine; I will add an "Illustrations generated with …" line to the credits.
- If some are missing, send what you have; each slot falls back to the current design.

## What I will do with them
- Resize and convert to WebP (and keep a PNG for the share card and icon), aiming for under 150 KB each.
- Light and dark versions switch with the theme, including System mode.
- Alt text as in the tables; purely decorative art gets empty alt text so screen readers skip it.
- Link preview: `og-share` plus the title set in code, at 1200×630, checked with a card preview.
- Icons: 180 px Apple touch icon, 192 px and 512 px (maskable) for Android, favicon.
- Re-run the browser and accessibility suites so contrast and layout stay clean on phones, tablet and desktop.
- Replace the old purple `empty-recovery-plan.png`, which does not match the current palette.
