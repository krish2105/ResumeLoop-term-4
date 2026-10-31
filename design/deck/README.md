# Week 12 deck generator

Builds `submissions/ResumeLoop_Week12_Presentation.pptx` with pptxgenjs from the live-site screenshots in `submissions/screenshots/` and the illustrations (converted to JPEG into `img/`).

```bash
npm install pptxgenjs@3.12.0
NODE_PATH=./node_modules node build.js /path/to/ResumeLoop
```

The theme step uses the pptx skill's `apply_theme.js`; set `SKILL` at the top of `build.js` to its location.
