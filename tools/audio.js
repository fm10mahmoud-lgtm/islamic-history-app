        // محرك صوت مبني على Web Audio API (بدون مكتبات) ويتفعّل عند أول لمسة
        let audioCtx = null;
        function getAudioCtx() {
            if (!audioCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                try { audioCtx = new AC(); } catch (e) { return null; }
            }
            return audioCtx;
        }
        ['pointerdown', 'touchend', 'click'].forEach(function (ev) {
            document.addEventListener(ev, function () {
                const c = getAudioCtx();
                if (c && c.state !== 'running') c.resume().catch(function () {});
            }, { passive: true });
        });
        function beep(freq, startAt, dur, wave, vol) {
            const c = getAudioCtx();
            if (!c) return;
            const t = c.currentTime + startAt;
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.type = wave || 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain);
            gain.connect(c.destination);
            osc.start(t);
            osc.stop(t + dur + 0.05);
        }
        function playNow(type) {
            if (type === 'success') {
                beep(523.25, 0, 0.18, 'triangle', 0.22); beep(659.25, 0.1, 0.18, 'triangle', 0.22);
                beep(783.99, 0.2, 0.18, 'triangle', 0.22); beep(1046.5, 0.3, 0.45, 'triangle', 0.24);
            } else if (type === 'error') {
                beep(196, 0, 0.18, 'sawtooth', 0.12); beep(146.83, 0.14, 0.35, 'sawtooth', 0.12);
            } else if (type === 'click') {
                beep(440, 0, 0.07, 'sine', 0.18);
            } else if (type === 'pop') {
                beep(587.33, 0, 0.09, 'sine', 0.18);
            }
        }
        function playSound(type) {
            if (!soundEnabled) return;
            const c = getAudioCtx();
            if (!c) return;
            try {
                if (c.state === 'running') playNow(type);
                else c.resume().then(function () { playNow(type); }).catch(function () {});
            } catch (e) {}
        }
