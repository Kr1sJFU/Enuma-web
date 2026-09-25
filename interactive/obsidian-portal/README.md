# Obsidian Portal — interactive prototype

Open `index.html` in a browser to review the four-step experience. The folder is self-contained: `assets/obsidian-portal.mp4` is the 30.875-second master video, and `cue_1.jpg` is its opening poster. No build step or framework is required.

The page pauses the single video at these 32 fps frame boundaries:

| Step | Action | Video time |
| --- | --- | --- |
| 1 | Press the red button | 0–8.0625 s |
| 2 | Enter the mirror | 8.0625–17.4375 s |
| 3 | Cross the stars into the new scene | 17.4375–22.8125 s |
| 4 | Awaken the rune; flames appear | 22.8125–30.875 s |

The image stays unobstructed except for a small target ring. A single action row below the video shows the current step and key: click the highlighted object, use the action button, press `E` for the button/rune actions, or press `W` for the two movement acts. The numbered progress bars jump to and replay any turn. `I` is a camera-up input in other ENUMA examples and is intentionally not mapped to forward movement here. Enter/Space can activate the current action, and `R` restarts. The video is silent, matching the source clips.

The short action labels are editorial descriptions of the visible actions, not claims about the model's original conditioning text (which was not supplied with these clips).

`app.js` holds the cue times and stage labels. To use this inside the eventual website, copy this directory or port its player markup, styles, and stage controller into the site. Keep the video and poster paths together. The prototype does not publish anything.
