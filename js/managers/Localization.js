'use strict';

/* ============================== i18n ================================== */
const L = {
  en: {
    title: 'THE HAUNTED HOUSE', subtitle: 'The Five Convolutions',
    play: 'PLAY', options: 'OPTIONS', language: 'LANGUAGE', exit: 'EXIT', back: 'BACK',
    sound: 'SOUND', music: 'MUSIC', resume: 'RESUME', restart: 'RESTART', mainMenu: 'MAIN MENU', paused: 'PAUSED',
    skip: 'Press ENTER to skip', next: 'SPACE / CLICK: next', cont: 'CONTINUE',
    spellFound: 'SPELL DISCOVERED', bookTitle: 'SPELLBOOK', cast: 'CAST ON GHOST',
    left: 'left', tipLens: 'Magical lens [L]', tipBook: 'Spellbook [B]', tipHelp: 'Help / intro', tipPause: 'Pause [ESC]',
    keys: 'WASD move · MOUSE look · F collect · L lens · B book · CLICK shoot · TAB free cursor',
    collect: '[F] Collect Spell', identify: '[B] Open spellbook to identify', shootIt: 'CLICK to capture!',
    lensOn: 'LENS ON', lensOff: 'LENS OFF', wrong: 'WRONG SPELL!', attemptsLeft: 'attempt left',
    attemptsLbl: 'ATTEMPTS', captured: 'GHOST CAPTURED!', spellGot: 'SPELL COLLECTED!', identified: 'GHOST REVEALED!',
    needReveal: 'Reveal it with the right spell first!', detected: 'GHOST DETECTED!', noGhostLooked: 'Nothing to capture here',
    locked: 'LOCKED', lockedHint: 'Find this spell somewhere in the mansion to unlock it.',
    selectHint: 'Select a spell, then cast it on the ghost.', browseHint: 'Look at a ghost through the lens [L], then open the book to cast.',
    clickHint: 'CLICK to capture the mouse', colorLbl: 'COLOR', normLbl: 'Normalization',
    winTitle: 'THE MANSION IS FREE!', winMsg: 'You have captured every spirit and restored peace to the haunted mansion.',
    playAgain: 'PLAY AGAIN', loseTitle: 'THE SPIRITS HAVE WON...', loseMsg: 'The mansion remains haunted. Your time is over.',
    rTime: 'The clock reached zero.', rSpell: 'Two wrong spells on the same ghost.',
    sGhosts: 'Ghosts captured', sTime: 'Time remaining', sSpells: 'Spells collected',
    thanks: 'THANKS FOR PLAYING!', byeMsg: 'You can now close this tab.',
    cs: [
      'You have entered a mansion haunted by five kinds of spirits. They hide from ordinary vision, wandering through its corridors unseen.',
      'Fortunately, you possess an enchanted lens capable of revealing supernatural entities. But seeing them is not enough.',
      'Each ghost is bound to a particular convolution spell. To reveal its true form, you must discover the correct spell and apply it.',
      'Five ancient spells are hidden throughout the mansion. Find them, collect them, and study their properties. Your spellbook will preserve every spell you discover.',
      'Use your lens, identify the ghosts, apply the correct spells, and capture every spirit.',
      'But be careful... time is running out. Catch them all before the clock reaches zero.'
    ]
  },
  ar: {
    title: 'البيت المسكون', subtitle: 'الالتفافات الخمس',
    play: 'ابدأ اللعب', options: 'الخيارات', language: 'اللغة', exit: 'خروج', back: 'رجوع',
    sound: 'الصوت', music: 'الموسيقى', resume: 'متابعة', restart: 'إعادة', mainMenu: 'القائمة الرئيسية', paused: 'إيقاف مؤقت',
    skip: 'اضغط ENTER للتخطي', next: 'SPACE / نقرة: التالي', cont: 'متابعة',
    spellFound: 'تم اكتشاف تعويذة', bookTitle: 'كتاب التعاويذ', cast: 'أطلق التعويذة',
    left: 'متبقي', tipLens: 'العدسة السحرية [L]', tipBook: 'كتاب التعاويذ [B]', tipHelp: 'مساعدة / المقدمة', tipPause: 'إيقاف مؤقت [ESC]',
    keys: 'WASD حركة · الفأرة نظر · F جمع · L عدسة · B كتاب · نقرة إطلاق · TAB تحرير المؤشر',
    collect: '[F] اجمع التعويذة', identify: '[B] افتح الكتاب لتحديد الشبح', shootIt: 'انقر لأسر الشبح!',
    lensOn: 'العدسة: تعمل', lensOff: 'العدسة: متوقفة', wrong: 'تعويذة خاطئة!', attemptsLeft: 'محاولة متبقية',
    attemptsLbl: 'المحاولات', captured: 'تم أسر الشبح!', spellGot: 'تم جمع التعويذة!', identified: 'تم كشف الشبح!',
    needReveal: 'اكشفه بالتعويذة الصحيحة أولاً!', detected: 'تم رصد شبح!', noGhostLooked: 'لا يوجد ما يمكن أسره هنا',
    locked: 'مقفلة', lockedHint: 'اعثر على هذه التعويذة في القصر لفتحها.',
    selectHint: 'اختر تعويذة ثم أطلقها على الشبح.', browseHint: 'انظر إلى شبح عبر العدسة [L] ثم افتح الكتاب لإطلاق التعويذة.',
    clickHint: 'انقر للتحكم بالفأرة', colorLbl: 'اللون', normLbl: 'عامل التطبيع',
    winTitle: 'القصر تحرر!', winMsg: 'لقد أسرت كل الأرواح وأعدت السلام إلى القصر المسكون.',
    playAgain: 'العب مجددًا', loseTitle: 'الأرواح انتصرت...', loseMsg: 'ما زال القصر مسكونًا. انتهى وقتك.',
    rTime: 'انتهى الوقت.', rSpell: 'تعويذتان خاطئتان على الشبح نفسه.',
    sGhosts: 'الأشباح المأسورة', sTime: 'الوقت المتبقي', sSpells: 'التعاويذ المجموعة',
    thanks: 'شكرًا للعب!', byeMsg: 'يمكنك الآن إغلاق هذه الصفحة.',
    cs: [
      'لقد دخلتَ قصرًا تسكنه خمسة أنواع من الأرواح. تختبئ عن الأنظار العادية، وتجول في ممراته دون أن تُرى.',
      'لحسن الحظ، تملك عدسة مسحورة قادرة على كشف الكائنات الخارقة. لكن رؤيتها لا تكفي.',
      'كل شبح مرتبط بتعويذة التفاف معيّنة. ولكشف هيئته الحقيقية عليك أن تجد التعويذة الصحيحة وتطبّقها.',
      'خمس تعاويذ قديمة مخبأة في أرجاء القصر. اعثر عليها واجمعها وادرس خصائصها. وسيحفظ كتاب التعاويذ كل تعويذة تكتشفها.',
      'استخدم عدستك، وحدّد الأشباح، وطبّق التعاويذ الصحيحة، وأسِر كل روح.',
      'لكن احذر... الوقت ينفد. أسِرهم جميعًا قبل أن تصل الساعة إلى الصفر.'
    ]
  }
};

