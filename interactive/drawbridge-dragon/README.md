# Drawbridge / Dragon — interactive prototype

Open `index.html` to review the self-contained four-turn experience. The page loads one continuous 1248×720 H.264 video and pauses at exact 16 fps turn boundaries; it needs no framework or build step. Nothing is published.

| Turn | Visible action | Source frames | Timeline |
| --- | --- | --- | --- |
| 1 | Sever the chain and lower the drawbridge | 01: 0–128 | 0–8.0625 s |
| 2 | Cross the drawbridge | 02: 0–128 | 8.0625–16.125 s |
| 3 | Look left and find the red dragon | 03: 0–128 | 16.125–24.1875 s |
| 4 | Raise the sword, then block dragonfire | 04: 0–59, then 05: 0–68 | 24.1875–32.25 s |

The keyboard playback shortcuts are `E`, `W`, `J`, and `E`; click the small target ring where shown or use the compact action button below the video. The `01`–`04` progress bars are buttons: clicking one jumps to and plays that turn, including backwards jumps. `R` restarts. These are editorial controls for this prerecorded demonstration, not a claim about the original model-conditioning prompts, which were not provided. `I` is not used for forward motion.

The video is silent, matching the source clips. `app.js` contains all cue times and labels. Keep `assets/drawbridge-dragon.mp4` and `cue_1.jpg` beside the page when integrating it into the website.
