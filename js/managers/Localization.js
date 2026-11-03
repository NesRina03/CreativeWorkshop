const translations = {
    en: {
        gameSettings: 'Game settings',
        language: 'العربية',
        languageLabel: 'Switch language to Arabic',
        soundOff: 'Sound: Off',
        soundOn: 'Sound: On',
        soundLabel: 'Toggle sound effects',
        musicOff: 'Music: Off',
        musicOn: 'Music: On',
        musicLabel: 'Toggle music',
        audioError: 'Audio is not available in this browser.',
        title: 'Ghost Game'
    },
    ar: {
        gameSettings: 'إعدادات اللعبة',
        language: 'English',
        languageLabel: 'Switch language to English',
        soundOff: 'المؤثرات: متوقفة',
        soundOn: 'المؤثرات: تعمل',
        soundLabel: 'تشغيل أو إيقاف المؤثرات الصوتية',
        musicOff: 'الموسيقى: متوقفة',
        musicOn: 'الموسيقى: تعمل',
        musicLabel: 'تشغيل أو إيقاف الموسيقى',
        audioError: 'الصوت غير متاح في هذا المتصفح.',
        title: 'لعبة الشبح'
    }
};

export class Localization {
    constructor(audioManager){
        this.audioManager = audioManager;
        this.language = localStorage.getItem('ghost-game-language') === 'ar' ? 'ar' : 'en';
        this.text = translations[this.language];
    }

    setLanguage(language){
        this.language = language;
        this.text = translations[language];
        localStorage.setItem('ghost-game-language', language);

        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.title = this.text.title;
        document.querySelector('#gameToolbar').setAttribute('aria-label', this.text.gameSettings);
        this.updateControls();
    }

    updateControls(){
        const languageButton = document.getElementById('languageButton');
        const soundButton = document.getElementById('soundButton');
        const musicButton = document.getElementById('musicButton');

        languageButton.textContent = this.text.language;
        languageButton.setAttribute('aria-label', this.text.languageLabel);
        soundButton.textContent = this.soundButtonText;
        soundButton.setAttribute('aria-label', this.text.soundLabel);
        soundButton.setAttribute('aria-pressed', String(this.audioManager.soundEnabled));
        musicButton.textContent = this.musicButtonText;
        musicButton.setAttribute('aria-label', this.text.musicLabel);
        musicButton.setAttribute('aria-pressed', String(this.audioManager.musicEnabled));
    }

    get soundButtonText(){
        return this.audioManager.soundEnabled ? this.text.soundOn : this.text.soundOff;
    }

    get musicButtonText(){
        return this.audioManager.musicEnabled ? this.text.musicOn : this.text.musicOff;
    }
}
