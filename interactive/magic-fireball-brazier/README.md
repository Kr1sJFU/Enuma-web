# Fireball / Brazier — interactive prototype

Open `index.html` for the three-turn experience. One continuous, silent 1248×720 H.264 video pauses at the original 16 fps turn boundaries. The original clips remain untouched.

| Turn | Source | Frames | Action |
| --- | --- | --- | --- |
| 1 | `turn1_hold_fireball_walk_to_brazier.mp4` | 0–128 | `W` approach the brazier |
| 2 | `turn2_throw_fireball_light_brazier.mp4` | 0–128 | `E` cast the fireball |
| 3 | `turn3_step_back_daylight.mp4` | 0–128 | `S` step back into daylight |

The action button and keyboard keys advance the prerecorded sequence; the numbered progress bars jump to and replay any turn, and `R` restarts. The keys and labels are editorial UI cues inferred from the clips, pending original conditioning prompts. The master is 387 frames / 24.1875 seconds, joined without re-encoding. `build.py` reproduces the master and first-frame poster.
