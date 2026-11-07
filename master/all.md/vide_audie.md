# Master Production Blueprint: Video, Image & Audio Generation Guide (`vide_audie.md`)

This document is the **definitive reference manual** for reproducing the exact audio, voiceover pacing, visual style, character design, and 3D environment architecture used in the **Critical Minerals Animated Short** series (*India's Lithium Paradox*).

In a new session, provide this document directly to any AI agent to replicate the exact same creative and technical output.

---

## Part 1: Audio Production & Voiceover Engineering

### 1.1 The Algorithm Sweet Spot: Pacing & Duration
* **The 30–60 Second Algorithmic Window:** While platforms allow longer shorts, creator analytics prove that educational/explainer content achieves maximum completion rate (APV > 80%) when kept between **35 and 55 seconds**.
* **Target Word Count:** 105 to 125 words total.
* **Target Cadence:** ~160 words per minute (WPM). At standard speed (~135 WPM), narration sounds lethargic on vertical video feeds.

### 1.2 The Engine: Why `en-US-GuyNeural` Succeeded
* **The Problem with Legacy SAPI / Formant Synthesis:**
  * Built-in Windows SAPI voices (`Microsoft David Desktop`) operate on legacy rule-based formant synthesis. Without complex SSML, they synthesize at a flat fundamental frequency (\(F_0\)), producing a monotonous robotic drone with zero breath control or emotional variance.
* **The Solution: Deep Neural Vocoder:**
  * **Engine:** Microsoft Edge TTS (`edge-tts`) powered by Azure Speech.
  * **Voice Model:** **`en-US-GuyNeural`** (Voice Persona: *News, Novel | Passion*).
  * **Acoustic Qualities:** Conversational confidence, natural sentence stresses, native breathing, and authentic intonation rises on questions and dips on revelations.
  * **Rate Adjustment:** Boosted to **`+15%`**. The neural vocoder performs time compression without altering vocal pitch (no "chipmunk" distortion), creating an energetic, crisp documentary delivery.

### 1.3 Step-by-Step Audio Generation Procedure

#### Prerequisites
Ensure `uv` (or Python) is installed:
```powershell
uv --version
```

#### Step 1: Write the Structured Script (`short_script.txt`)
Punctuation directly controls neural breathing pauses. Use periods for full stops, commas for micro-breaths, and line breaks between curiosity beats:

```text
India announced 5.9 million tonnes of lithium in Jammu.
But there was a catch.
It wasn't 5.9 million tonnes of lithium.
It was early-stage ore, with an average grade of just 583 parts per million.
That is zero point zero five percent.
And finding ore is only step one.
Raw rock cannot enter a battery.
To turn that ore into battery chemicals, it must be crushed, concentrated, roasted at a thousand degrees, chemically leached, and purified.
Only then do you get battery-grade materials.
Here is the twist:
China refines 65% of the world's lithium.
Indonesia refines 40% of its nickel.
The real monopoly isn't the rocks in the ground. It is the refineries.
That is why India approved a 2,814 crore rupee scheme for four future processing plants, with a 30 percent capital subsidy.
Because discovering a mineral gives you potential.
Processing it gives you power.
```

#### Step 2: Execute Audio & Subtitle Generation
Run the official one-liner in PowerShell:
```powershell
uvx edge-tts `
  --file "short_script.txt" `
  --voice "en-US-GuyNeural" `
  --rate="+15%" `
  --write-media "voice.mp3" `
  --write-subtitles "words.vtt"
```

#### Step 3: Verify Audio Runtime & Quality
Use FFmpeg to confirm the audio lands in the 30–60s sweet spot:
```powershell
ffmpeg -i voice.mp3 2>&1 | Select-String "Duration"
# Expected output: Duration: 00:00:56.86 (Exact: 56.86 seconds = 1,706 frames @ 30 FPS)
```

---

## Part 2: Image Generation & Visual Style Bible

### 2.1 The Core Hybrid Aesthetic Formula
The signature look is **"Flat 2D cartoon characters living inside a 3D painted world"**:
* **Characters:** Hand-drawn 2D vector bean-head characters, flat shading with painted crescent shadows, dark ink outlines, squat proportions.
* **Environment:** Stylized 3D low-poly geometry with hand-painted textures, two-tone cel lighting, and black ink outlines on geometry silhouettes.
* **Lighting & Atmosphere:** Cinematic warm golden-hour key light, peach specular highlights, cool violet-blue ambient shadows, and shallow depth of field (DoF).

### 2.2 Character Design Rules (The Geologist)
* **Head & Proportions:** Bean-head shape, wide eye spacing, minimalist expressive face (e.g. skeptical eyebrow raise), squat proportions (~3.5 head-heights tall).
* **Outline:** Subtle dark plum ink contour (`#241726`), 3–5px stroke weight.
* **Limbs:** Expressive dark stick limbs with circular ink-dot hands.
* **Costume & Gear:**
  * White safety hard hat (`#ffffff`) with ink ridge.
  * High-visibility orange safety vest (`#ff6f10`) with reflective white cross-straps and brass buttons (`#fbbf24`).
  * Dark grey utility trousers (`#374151`) and black work boots (`#18181b`).
* **Handheld Props:**
  * Wooden field clipboard with inspection notes.
  * Rock sample tray containing real-world dull, earthy reddish-brown bauxite/laterite rock fragments.
* **Strict Scientific Negative Rule:** **NO** glowing sci-fi blue crystals, gems, or futuristic plasma. The ore must look like genuine geological earth/rock.

### 2.3 Environment & World Rules
* **Terrain:** Stepped open-cast bauxite/laterite quarry benches in Jammu with terracotta, clay red, and ochre cliff faces (`#7c2d18`, `#a84b2e`, `#c26544`).
* **Industrial Background:** Distant chemical refining plant featuring tall concrete smokestacks with red hazard stripes, cylindrical rotary kilns, and stainless steel leaching tanks.
* **Atmospheric Post-Processing:** Soft lens blur / thin-lens bokeh in the background, keeping the character and foreground razor-sharp.
* **Ground Contact:** Soft elliptical contact shadow blob (`rgba(20, 10, 12, 0.65)`) directly beneath the feet—never a hard rectangular border.
* **Aspect Ratio:** Strict **9:16 vertical** format (1080×1920).

### 2.4 Ready-to-Execute Hero Frame Generation Prompt

Copy and paste this exact prompt into an image generator to produce matching hero frames:

```text
Generate a 9:16 vertical (1080x1920) animated cartoon short hero frame in the signature '2D cartoon characters in a 3D painted world' style from the Claude Animated Shorts style bible.

Visual specifications:
1. Art Style:
- Hybrid 2D/3D storybook / graphic novel aesthetic.
- 2D character: A flat bean-head cartoon character with a subtle dark plum ink outline (#241726), stick limbs, ink-dot hands, and squat proportions (~3.5 head-heights tall). Minimalist expressive face with wide eye spacing and a puzzled/skeptical eyebrow raise.
- Character Outfit: Indian geologist wearing a white hard hat, high-vis orange/yellow reflective safety vest over work clothes, holding a wooden clipboard in one hand and a geological sample tray containing real-world dull, earthy reddish-brown bauxite/laterite rock samples (definitely NOT glowing crystals).
- On the clipboard or floating next to him is a small graphic reading '5.9M TONNES LITHIUM?' with a big question mark.
- 3D Environment: Earthy, warm terracotta and rich red-brown laterite/bauxite quarry cliff, with painted rock textures and selective clean black ink line accents on rock ridges.
- Background & Lighting: In the far distance, visible under a golden-hour peach/orange sky, is a stylized smoking industrial chemical refining facility (tall chimneys, stainless steel chemical tanks, rotary kiln) softened with cinematic depth-of-field lens blur.
- Color & Lighting: Rich, warm golden-hour key light creating peach highlights and cool violet-blue shadows on the rocks and ground, with a sharp contact ground shadow under the geologist's feet.
- Vertical composition (9:16 aspect ratio), clean, sharp, colorful, no photographic realism, strictly 2D/3D animated cartoon explainer look.
```

---

## Part 3: 3D Scene Architecture & Common Pitfalls

### 3.1 9-Shot Narrative & Visual Breakdown
Each shot must have dedicated camera choreography and thematic props:
1. **Shot 1 (Hook):** Jammu quarry ledge, Geologist inspecting sample, floating `"5.9M TONNES LITHIUM?"` title card.
2. **Shot 2 (Fracture):** Title card fractures to `"ORE ≠ PURE LITHIUM"`; Geologist gives a skeptical eyebrow raise.
3. **Shot 3 (Macro Science):** Optical zoom into laterite ore cross-section with high-contrast `"583 PPM (0.05% Li)"` stat card.
4. **Shot 4 (Mining):** Open-cast haulage featuring heavy yellow mining dump trucks and excavators on quarry terraces.
5. **Shot 5 (Thermal Activation):** Jaw crushers feeding a glowing 1,000°C industrial rotary kiln cylinder on steel support plinths.
6. **Shot 6 (Chemical Refining):** Stainless steel acid-leaching vats and battery cells filling with >99.5% pure lithium powder.
7. **Shot 7 (Dual Geopolitical Hubs):** Low-poly 3D globe showing two separate dominant centers: **China (65% Lithium refining)** in red vs. **Indonesia (40% Nickel smelting)** in green.
8. **Shot 8 (The Scheme):** Architectural drafting table with cyan grid blueprint of the ₹2,814 Crore Scheme and 4 rising 3D plants (2 blue lithium + 2 green nickel).
9. **Shot 9 (The Future):** Finished Indian refinery under sunset, sleek electric vehicle, and final punchline banner: *"RESOURCES ARE POTENTIAL. PROCESSING IS POWER."*

### 3.2 Key Technical Bugs & Verified Fixes

| Issue Encountered | Root Cause | Verified Permanent Fix |
| :--- | :--- | :--- |
| **Old template assets showing (e.g. British Bridge)** | Cached build state or runtime error halting Remotion bundle update. | Purge legacy files (e.g. `Bridge.tsx`), restart Remotion Studio with `npm start`, and verify clean compilation. |
| **`TypeError: fx.ink.dispose is not a function`** | Custom postprocessing pass missing standard dispose interface. | Guard unmount hooks with optional chaining: `(fx.ink as any)?.dispose?.()`. |
| **`bodyFront` Canvas Crash** | Argument ordering mismatch in `cast.ts`: passing seed number where Outfit object was expected. | Ensure signature strictly matches: `bodyFront(p, GEOLOGIST, { expr, blink, mode, seed: 1 })`. |
| **White Box Around Shadow Blob** | `fxBlob` filling canvas with solid `WHITE` before multiply blend. | Use transparent radial gradient `rgba(20, 10, 12, 0.65)` to `rgba(20, 10, 12, 0)` with no white background fill. |
| **Cards Cropped in 9:16 Portrait** | High horizontal FOV assumption; 9:16 portrait viewport has narrow horizontal visible width (~4.8 units at z=0). | Keep card widths $\le 2.8$ units when co-existing with characters, or center them above characters. |

---

## Part 4: How to Instruct an AI Agent in a New Session

When starting a new session, paste the following prompt to the AI:

> *"Act as the lead technical animator and sound director for our 3D animated explainer series. Follow the master blueprint in `master/all.md/vide_audie.md`. For audio, use Microsoft Edge TTS `en-US-GuyNeural` at `+15%` rate, targeting a 35–55 second script with word-level subtitles. For visuals, follow the 2D bean-head character in a 3D painted world aesthetic with two-tone lighting, ink edge outlines, and 9:16 vertical composition. Refer to `STYLE_BIBLE.md` and `SCRIPT.md` in `master/all.md/` for all factual and stylistic benchmarks."*
