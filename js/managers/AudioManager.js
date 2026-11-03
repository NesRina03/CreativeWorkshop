const MUSIC_NOTES = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];

export class AudioManager {
    constructor(){
        this.context = null;
        this.soundEnabled = false;
        this.musicEnabled = false;
        this.musicTimer = null;
        this.musicNoteIndex = 0;
    }

    async toggleSound(){
        await this.resumeContext();
        this.soundEnabled = !this.soundEnabled;

        if (this.soundEnabled){
            this.playTone(659.25, 0.12, 0.035, 'sine');
        }
    }

    async toggleMusic(){
        await this.resumeContext();
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled){
            this.playMusicNote();
            this.musicTimer = window.setInterval(() => this.playMusicNote(), 700);
        } else {
            window.clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    playMovementSound(){
        if (this.soundEnabled){
            this.playTone(440, 0.08, 0.018, 'triangle');
        }
    }

    async resumeContext(){
        if (!this.context){
            const AudioContextClass = window.AudioContext;
            if (!AudioContextClass){
                throw new Error('Web Audio API is not supported by this browser.');
            }
            this.context = new AudioContextClass();
        }

        if (this.context.state === 'suspended'){
            await this.context.resume();
        }
    }

    playMusicNote(){
        const frequency = MUSIC_NOTES[this.musicNoteIndex];
        this.musicNoteIndex = (this.musicNoteIndex + 1) % MUSIC_NOTES.length;
        this.playTone(frequency, 0.55, 0.018, 'sine');
    }

    playTone(frequency, duration, volume, type){
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const startTime = this.context.currentTime;
        const endTime = startTime + duration;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime);
        oscillator.addEventListener('ended', () => {
            oscillator.disconnect();
            gain.disconnect();
        }, { once: true });
    }
}
