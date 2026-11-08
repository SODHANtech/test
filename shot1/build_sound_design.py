import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as signal
import subprocess
import os

sr = 44100
total_dur = 57.2
total_samples = int(total_dur * sr)
t_master = np.linspace(0, total_dur, total_samples, endpoint=False)

# Track buffers
sfx_track = np.zeros(total_samples, dtype=np.float32)
bgm_track = np.zeros(total_samples, dtype=np.float32)

def place(track, audio, start_sec):
    start_idx = int(start_sec * sr)
    end_idx = min(start_idx + len(audio), len(track))
    usable_len = end_idx - start_idx
    if usable_len > 0:
        track[start_idx:end_idx] += audio[:usable_len]

def env(n, a=0.01, d=0.1):
    na = int(a * sr)
    nd = n - na
    e = np.ones(n, dtype=np.float32)
    if na > 0:
        e[:na] = np.linspace(0, 1, na)
    if nd > 0:
        e[na:] = np.exp(-np.linspace(0, 5, nd))
    return e

# ----------------- 1. SFX Synthesis -----------------

# Shot 2: The Catch - Sharp stone fracture / crack
def make_crack():
    dur = 0.45
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    noise = np.random.uniform(-1, 1, n)
    # Bandpass 2.5k - 6k
    b, a = signal.butter(3, [2200 / (sr/2), 6500 / (sr/2)], btype='band')
    crack_noise = signal.lfilter(b, a, noise) * env(n, 0.002, 0.25)
    # Low thud
    thud = np.sin(2 * np.pi * np.linspace(120, 45, n) * t) * env(n, 0.005, 0.35)
    return (crack_noise * 0.7 + thud * 0.5) * 0.55

# Shot 3: 583 PPM - Digital HUD scanning telemetry chirp
def make_scan():
    dur = 0.3
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    f = np.linspace(1800, 2600, n)
    sig = np.sin(2 * np.pi * f * t) * env(n, 0.01, 0.2)
    sig += 0.3 * np.sin(2 * np.pi * (f * 1.5) * t) * env(n, 0.02, 0.15)
    return sig * 0.22

# Shot 4: Heavy Mining Haulage - Diesel rumble & shifting rock
def make_diesel_quarry():
    dur = 2.8
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    noise = np.random.uniform(-1, 1, n)
    b, a = signal.butter(2, 140 / (sr/2), btype='low')
    low_rumble = signal.lfilter(b, a, noise)
    # Diesel 8Hz pulse
    pulse = (0.6 + 0.4 * np.sin(2 * np.pi * 7.5 * t))
    engine = (np.sin(2 * np.pi * 48 * t) * 0.6 + low_rumble * 0.8) * pulse
    fade = signal.windows.tukey(n, alpha=0.35)
    return (engine * fade) * 0.32

# Shot 5: 1,000°C Rotary Kiln - Fiery thermal roar & whoosh
def make_furnace_whoosh():
    dur = 2.6
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    noise = np.random.uniform(-1, 1, n)
    # Swept bandpass
    center_freq = 280 + 550 * np.sin(np.pi * (t / dur))
    q = 3.0
    sig = np.zeros(n, dtype=np.float32)
    # Block processing for time-varying filter
    chunk = 512
    for i in range(0, n, chunk):
        end = min(i + chunk, n)
        cf = center_freq[i]
        b, a = signal.butter(2, [max(40, cf - 120)/(sr/2), min(sr/2 - 100, cf + 180)/(sr/2)], btype='band')
        sig[i:end] = signal.lfilter(b, a, noise[i:end])
    drone = np.sin(2 * np.pi * 95 * t) * 0.4
    fade = signal.windows.tukey(n, alpha=0.3)
    return ((sig * 0.75 + drone) * fade) * 0.35

# Shot 6: Chemical Leaching - Liquid bubbling & steam hiss
def make_leaching_hiss():
    dur = 2.2
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    noise = np.random.uniform(-1, 1, n)
    b, a = signal.butter(2, [1200 / (sr/2), 4800 / (sr/2)], btype='band')
    hiss = signal.lfilter(b, a, noise) * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * t))
    fade = signal.windows.tukey(n, alpha=0.3)
    return (hiss * fade) * 0.18

# Shot 6: Purity chime (>99.5%)
def make_purity_chime():
    dur = 1.0
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    e = np.exp(-t * 4.5)
    chime = (
        np.sin(2 * np.pi * 1318.5 * t) * 0.6 +
        np.sin(2 * np.pi * 1975.5 * t) * 0.4 +
        np.sin(2 * np.pi * 2637.0 * t) * 0.25
    ) * e
    return chime * 0.22

# Shot 7: Geopolitical Map - China ping (lower) & Indonesia ping (higher)
def make_map_ping(freq):
    dur = 0.45
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    e = np.exp(-t * 9.0)
    ping = (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * (freq * 2) * t)) * e
    return ping * 0.22

# Shot 8: ₹2,814 Cr Scheme - Solid policy stamp thud
def make_stamp():
    dur = 0.6
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    thud = np.sin(2 * np.pi * np.linspace(95, 38, n) * t) * np.exp(-t * 7.0)
    noise = np.random.uniform(-1, 1, n)
    b, a = signal.butter(2, [600 / (sr/2), 2400 / (sr/2)], btype='band')
    click = signal.lfilter(b, a, noise) * np.exp(-t * 25.0)
    return (thud * 0.75 + click * 0.4) * 0.42

# Shot 9: Pre-climax Riser (51.5s - 54.5s)
def make_riser():
    dur = 3.0
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    ramp = (t / dur) ** 2
    noise = np.random.uniform(-1, 1, n)
    b, a = signal.butter(2, [300 / (sr/2), 3500 / (sr/2)], btype='band')
    filtered = signal.lfilter(b, a, noise) * ramp
    pitch = np.linspace(120, 580, n)
    saw = (2 * (t * pitch - np.floor(0.5 + t * pitch))) * ramp * 0.3
    return (filtered * 0.7 + saw) * 0.28

# Shot 9: Climax - Futuristic EV whirr + Deep sub-bass boom
def make_climax_impact():
    dur = 2.8
    n = int(dur * sr)
    t = np.linspace(0, dur, n)
    # EV motor accelerating pitch sweep
    ev_freq = 190 + 720 * (1 - np.exp(-t * 1.8))
    ev = np.sin(2 * np.pi * ev_freq * t) * np.exp(-t * 1.1)
    ev_harm = 0.35 * np.sin(2 * np.pi * (ev_freq * 2.02) * t) * np.exp(-t * 1.3)
    # Sub boom
    sub = np.sin(2 * np.pi * np.linspace(65, 34, n) * t) * np.exp(-t * 2.5)
    return (ev * 0.55 + ev_harm * 0.35 + sub * 0.8) * 0.48

# ----------------- 2. BGM Bed Synthesis (Documentary Pulse) -----------------
# 120 BPM = 0.5s per beat.
bpm = 120.0
spb = 60.0 / bpm
beats = int(total_dur / spb)

# Chord progression root freqs: D2 (73.4), Bb1 (58.3), G1 (49.0), A1 (55.0)
prog = [73.42, 58.27, 49.00, 55.00] # each held for 4 bars (16 beats = 8s)

for beat in range(beats):
    t_beat = beat * spb
    bar = int(beat / 4)
    chord_idx = int(bar / 4) % len(prog)
    root = prog[chord_idx]
    
    # 1. Subtle clock tick / shaker on every beat
    tick_n = int(0.04 * sr)
    tick_t = np.linspace(0, 0.04, tick_n)
    tick = np.random.uniform(-1, 1, tick_n) * np.exp(-tick_t * 120.0) * (0.04 if beat % 2 == 0 else 0.02)
    place(bgm_track, tick, t_beat)
    
    # 2. Warm sub-bass note on beat 0 and 2
    if beat % 2 == 0:
        bass_n = int(0.38 * sr)
        bass_t = np.linspace(0, 0.38, bass_n)
        bass = (np.sin(2 * np.pi * root * bass_t) + 0.3 * np.sin(2 * np.pi * (root * 2) * bass_t)) * np.exp(-bass_t * 5.0)
        place(bgm_track, bass * 0.12, t_beat)

# Apply gentle low-pass filter on BGM to keep it completely out of dialogue range
b_bgm, a_bgm = signal.butter(2, 2800 / (sr/2), btype='low')
bgm_track = signal.lfilter(b_bgm, a_bgm, bgm_track)
# Master fade in and out on BGM
bgm_track[:int(1.5 * sr)] *= np.linspace(0, 1, int(1.5 * sr))
bgm_track[-int(2.5 * sr):] *= np.linspace(1, 0, int(2.5 * sr))
bgm_track *= 0.18 # low background level (-22 dB relative to dialogue)

# ----------------- 3. Place SFX at exact VTT Timestamps -----------------

place(sfx_track, make_crack(), 3.85)             # "But there was a catch"
place(sfx_track, make_scan(), 10.3)              # "just 583 parts per million"
place(sfx_track, make_diesel_quarry(), 18.3)     # "Raw rock cannot enter a battery"
place(sfx_track, make_furnace_whoosh(), 23.4)    # "roasted at a thousand degrees"
place(sfx_track, make_leaching_hiss(), 26.6)     # "chemically leached and purified"
place(sfx_track, make_purity_chime(), 29.8)      # "battery-grade materials"
place(sfx_track, make_map_ping(1480), 33.2)      # "China refines 65%"
place(sfx_track, make_map_ping(1960), 36.4)      # "Indonesia refines 40%"
place(sfx_track, make_stamp(), 44.4)             # "approved a 2,814 crore rupee scheme"
place(sfx_track, make_riser(), 51.5)             # Riser into punchline
place(sfx_track, make_climax_impact(), 54.5)     # "Processing it gives you power."

# Combine SFX + BGM
sfx_bgm_mix = sfx_track + bgm_track

# Clip check
max_val = np.max(np.abs(sfx_bgm_mix))
if max_val > 0.95:
    sfx_bgm_mix = sfx_bgm_mix / max_val * 0.95

# Export 16-bit WAV
sfx_bgm_int16 = (sfx_bgm_mix * 32767).astype(np.int16)
wavfile.write("sfx_and_bed.wav", sr, sfx_bgm_int16)
print("Successfully generated sfx_and_bed.wav")
