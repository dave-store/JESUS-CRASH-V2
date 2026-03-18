const { cmd } = require('../command');
const config = require("../config");

// ==================== OPTIMIZED DETECTION SYSTEM ====================

// Pre-compiled regex for maximum speed
const createRegex = (words) => new RegExp(
  '\\b(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi'
);

// ==================== EXTENDED BAD WORDS DATABASE ====================
const badWordCategories = {
  // English - Common
  english: [
    "fuck", "fck", "fk", "fuk", "fuc", "fux", "fuq", "fcking", "fking",
    "shit", "sht", "sh1t", "shiit", "shiet", "shitt",
    "bitch", "btch", "b1tch", "bich", "biitch", "beetch",
    "ass", "azz", "a$$", "a55", "arse", "ashole", "asshole", "assshole",
    "damn", "dmn", "dammit", "damm", "dayum",
    "hell", "h3ll", "he11",
    "crap", "crp", "krap",
    "piss", "p1ss", "pis",
    "dick", "d1ck", "dik", "dck", "penis", "pen1s",
    "pussy", "pssy", "puss", "pusy", "vagina", "vag1na",
    "cock", "c0ck", "kok", "kock",
    "cum", "cvm", "kum", "sperm", "spunk",
    "sex", "s3x", "sexx", "seks", "secks",
    "xxx", "xx", "porn", "p0rn", "prn", "pron",
    "whore", "whoore", "hore", "slut", "slutt",
    "bastard", "bstrd", "basted",
    "retard", "rtard", "tard",
    "cunt", "cnt", "kunt",
    "nigga", "nigger", "n1gga", "nig", "niga", "negro",
    "fag", "faggot", "fgt", "fagot",
    "wtf", "wth", "tf", "stfu", "gtfo", "kys", "kill yourself"
  ],

  // Spanish
  spanish: [
    "puta", "puto", "pt", "putaa", "putoo",
    "mierda", "mrda", "mrd", "miarda",
    "pendejo", "pendeja", "pnje", "pndejo",
    "cabron", "cabrón", "kbron", "cbrn",
    "chinga", "chingar", "chng", "chingada",
    "verga", "vrga", "verg", "vrg",
    "pito", "pta", "picha",
    "coño", "cono", "cno", "cojones",
    "maricon", "maricón", "marika", "maricona",
    "joder", "jdr", "jode"
  ],

  // French
  french: [
    "putain", "pute", "ptn", "put1",
    "merde", "mrd", "merd",
    "salope", "salop", "slp",
    "connard", "con", "conne", "c0n",
    "encule", "enculé", "enculee", "enculée",
    "foutre", "fout", "fou",
    "bite", "b1te", "queue",
    "couille", "couilles", "couil",
    "nique", "niquer", "nik", "n1que"
  ],

  // Arabic/Romanized
  arabic: [
    "kos", "kosomak", "kosomok", "kosomkom",
    "sharmoota", "sharmota", "shrmota",
    "zeby", "ziby", "zob", "zobr",
    "kahba", "kahhba", "k7ba",
    "metnak", "metnaka", "tnak",
    "a7a", "aha", "a7e",
    "khara", "5ara", "khra",
    "telhas", "tlhas", "tl7as"
  ],

  // Hindi/Urdu/Romanized
  hindi: [
    "madarchod", "madrchod", "mdrchod", "m.c.", "mc",
    "behenchod", "bhenchod", "bhnchod", "b.c.", "bc",
    "bhosdike", "bhosdi", "bhsdke", "bhonsdike",
    "chutiya", "chutya", "chootiya", "chutia", "chuty",
    "gandu", "gand", "gndu", "ghandu",
    "loda", "lund", "lnda", "lnd",
    "randi", "rndi", "randee",
    "harami", "hrami", "haramzada",
    "kutta", "kutte", "kutti", "kutiya",
    "suar", "suwar", "suar ke pille",
    "ullu", "ullu ka pattha",
    "chut", "choot", "chutmarike"
  ],

  // Portuguese
  portuguese: [
    "porra", "prra", "porr", "pora",
    "caralho", "caralhu", "crl", "crlh",
    "foda", "fodido", "fodida", "fdp", "f.d.p.",
    "puta", "puto", "putinha", "putao",
    "bosta", "bst", "bost",
    "merda", "m3rda",
    "cu", "cuzao", "cuzao",
    "pinto", "pica", "rola",
    "vai tomar no cu", "vtnc", "vai se foder", "vsf"
  ],

  // Tamil
  tamil: [
    "thevdiya", "thevudiya", "thevadiya", "tvdy",
    "punda", "pundam", "pundamavan",
    "otha", "othaiya", "otha",
    "koothi", "kooth", "kothi",
    "sunni", "sunniya", "sunni",
    "poolu", "pool", "poole",
    "okka", "okkaam", "okka",
    "kushumbu", "kushumb", "kusu",
    "pundaiku", "pundaikku"
  ],

  // Sinhala (Sri Lankan)
  sinhala: [
    "huththa", "huththo", "huththi", "hutha",
    "pakaya", "paka", "pako", "pakaya",
    "ponnaya", "ponnay", "ponna",
    "hutto", "hut", "hutta",
    "kariya", "kari", "kariyo",
    "bambuwa", "bambu", "bamb",
    "wal", "walle", "wala",
    "gona", "gon", "gonaw",
    "pissu", "pisu", "piss"
  ],

  // Turkish
  turkish: [
    "siktir", "sik", "siktirgit", "siktim",
    "orospu", "orosp", "orsbu", "orosbu",
    "pezevenk", "pezeven", "pezevnk",
    "am", "amcik", "amcık", "amck",
    "got", "göt", "gotveren", "götveren",
    "yarrak", "yrk", "yarak",
    "kahpe", "kahbe", "kahba",
    "orospu cocugu", "orospucocugu", "o.c.", "oc",
    "anan", "anani", "anani avradini",
    "pezevenk", "pezeven"
  ],

  // German
  german: [
    "scheisse", "scheiße", "schiss", "sch1sse",
    "fick", "ficken", "fck", "ficker",
    "hurensohn", "hure", "huren", "hurensohn",
    "arsch", "arschloch", "aarsch",
    "schwanz", "schwul", "schwucht",
    "nutte", "nutten", "hure", "huren",
    "verdammt", "verdamm", "kacke"
  ],

  // Russian (Romanized)
  russian: [
    "blyat", "bljat", "blyad", "bljad", "blyt",
    "suka", "suka", "sooka", "cyka",
    "pizda", "pizd", "pzd", "pizdec",
    "ebat", "ebal", "ebany", "yebat",
    "huy", "hui", "huylo", "huilo", "huyak",
    "mudak", "mudack", "mudik",
    "gandon", "gand", "gandn",
    "pidar", "pidor", "pidr", "pedik",
    "nahuy", "nahu", "nah", "naxuy"
  ],

  // Chinese (Pinyin/Romanized)
  chinese: [
    "cao", "caonima", "cao ni ma", "cnm",
    "ni ma", "nima", "nimabi",
    "sha bi", "shabi", "sabi", "sb",
    "diao", "niang", "niangde",
    "wang ba", "wangba", "wangbadan",
    "gun", "gundan", "gunnima",
    "ta ma de", "tmd", "tamade",
    "lanzi", "luanzi", "lan"
  ],

  // Japanese (Romanized)
  japanese: [
    "kuso", "kusso", "kuso", "kuso",
    "baka", "baka yarou", "bakayaro",
    "aho", "ahou", "bakah",
    "chikusho", "chikushou", "chikus",
    "kuso", "kuso", "kuso",
    "shinu", "shine", "sh1ne",
    "busu", "busuk", "dobusu",
    "kasu", "kasure", "gaki",
    "kichigai", "kichig", "kc",
    "debu", "debu", "busu"
  ],

  // Korean (Romanized)
  korean: [
    "shibal", "sibal", "ssibal", "sh1bal", "cibal",
    "jonna", "jot", "jott", "jotna",
    "byung", "byungshin", "byungsin",
    "saekki", "sae", "ssaekki", "saeki",
    "nom", "nyeon", "nomnyeon",
    "gaeseki", "gaes", "gaesekki",
    "jjang", "jjangga", "jjangga",
    "dick", "dickhead", "d1ck"
  ],

  // Indonesian/Malay
  indonesian: [
    "anjing", "anj", "anjg", "njing", "njng",
    "bangsat", "bngsat", "bngst", "bangst",
    "kontol", "kntol", "kntl", "kentol",
    "memek", "mmk", "memk", "mek",
    "goblok", "gblk", "goblk", "gobl",
    "tolol", "tll", "tol", "tlol",
    "babi", "bab1", "babi", "bab1",
    "sundala", "sund", "sundal",
    "pepek", "pepk", "ppk",
    "ngentot", "ngntot", "ngntt", "entot"
  ],

  // Tagalog/Filipino
  tagalog: [
    "putangina", "putang ina", "tangina", "tngina", "puta",
    "gago", "gag", "gagu", "gaga",
    "ulol", "ulul", "lol", "olol",
    "tanga", "tangaa", "tnga",
    "bobo", "b0b0", "bbo", "bobs",
    "leche", "letse", "lecheng",
    "buwisit", "bwiset", "bwsit",
    "hinayupak", "hayop", "hayup",
    "pakshet", "pakyu", "fuck you", "fvck you"
  ],

  // Vietnamese
  vietnamese: [
    "du ma", "duma", "du me", "dume", "dm",
    "con di", "condi", "cd", "c.d.",
    "dit", "d1t", "djt", "djtme",
    "lon", "l0n", "loz", "lozz",
    "ngu", "cuc", "cuc suc",
    "vcl", "vcc", "vl", "vkl",
    "me may", "memay", "mm",
    "chim", "buoi", "cu", "cacc"
  ],

  // Italian
  italian: [
    "cazzo", "cazz", "cazzata", "cazzate",
    "merda", "mrd", "merd", "merdoso",
    "puttana", "puttan", "putt", "troia", "tr0ia",
    "stronzo", "stronz", "str0nzo",
    "vaffanculo", "vaffa", "vffc", "vaff",
    "coglione", "cogl", "cogli",
    "minchia", "mnchia", "minch",
    "fanculo", "fan", "fnc",
    "bastardo", "bstrd", "bastard",
    "figlio di puttana", "figliodiputtana"
  ],

  // Dutch
  dutch: [
    "kut", "kutje", "kutzooi",
    "lul", "lullen", "lullig",
    "tyfus", "tyf", "tyfuslijer",
    "tering", "trng", "teringlijer",
    "klote", "klte", "kloten",
    "godverdomme", "gvd", "godv",
    "neuk", "neuken", "neukte",
    "slet", "sletten", "hoer", "hoertje",
    "kanker", "kkr", "kankerlijer",
    "flikker", "homo", "homo", "nicht"
  ],

  // Polish
  polish: [
    "kurwa", "kurw", "kurwe", "kurwo",
    "chuj", "chuja", "chujek", "huj",
    "pierdol", "pierdole", "pierdolec",
    "jebac", "jebac", "jebać", "jebie",
    "pizda", "pizdo", "pizdeczka",
    "cipa", "cip", "cipka", "cipek",
    "spierdalaj", "spierd", "spier",
    "dziwka", "dziw", "szmata",
    "skurwysyn", "skurw", "skurwys",
    "cholera", "chlr", "cholerny"
  ],

  // Swedish/Norwegian/Danish
  scandinavian: [
    "fan", "helvete", "helvete", "faen",
    "skit", "skitstövel", "skitstovel",
    "jävla", "javla", "jävel", "javel",
    "kuk", "kuksugare", "kukhuvud",
    "fitta", "fitt", "fitte", "fittan",
    "hora", "hor", "hore", "horan",
    "dra åt helvete", "draathelvete",
    "satan", "jävlar", "fan"
  ],

  // Greek (Romanized)
  greek: [
    "malaka", "malak", "malaka", "malakas",
    "gamoto", "gamo", "gamw", "gamoto",
    "pousti", "poust", "poustis", "pousti",
    "kolo", "kolos", "kolo", "kolaki",
    "skata", "skat", "skatofatsa",
    "putana", "put", "putana", "poutana",
    "arxidi", "arx", "arxidi", "arxidia",
    "mouni", "moun", "mounara", "mouni"
  ],

  // Romanian
  romanian: [
    "pula", "puli", "pula", "pulii",
    "fut", "futut", "fute", "futai",
    "muie", "muist", "muista", "mui",
    "cacat", "kkt", "cacat", "cacat",
    "curva", "kurva", "curve", "curv",
    "bou", "boul", "boule", "bov",
    "idiot", "idot", "idioata", "idioti",
    "mortii", "mortii matii", "mortii"
  ],

  // Hungarian
  hungarian: [
    "kurva", "kurv", "kurvanyad", "kurvaa",
    "fasz", "fasz", "faszop", "faszkalap",
    "geci", "gec", "gecis", "gecik",
    "szar", "szar", "szarik", "szarny",
    "pina", "pin", "pina", "pinak",
    "buzi", "buz", "buzi", "buzik",
    "picsa", "pics", "picsaa", "picsak",
    "fasszopo", "faszopo", "fasznyalo"
  ],

  // Czech/Slovak
  czech: [
    "kurva", "kurv", "kurva", "kurvy",
    "pica", "pic", "pica", "pici",
    "kokot", "kok", "kokot", "kokoti",
    "hovno", "hovn", "hovno", "hovna",
    "debil", "debl", "debil", "debile",
    "píča", "pča", "pica", "pico",
    "chuj", "chuj", "chuja", "chuji",
    "srat", "sra", "srat", "sracka",
    "jebat", "jeba", "jebal", "jebem"
  ],

  // Thai (Romanized)
  thai: [
    "hui", "heung", "huai", "sia",
    "kuy", "kuai", "kuy", "kuay",
    "ting tong", "tingtong", "ting",
    "ahean", "ahean", "ahian",
    "sala", "sala", "salaa",
    "meng", "meng", "meung",
    "pattaya", "patpong", "pattaya",
    "kwai", "kwai", "kwaii"
  ],

  // Hebrew (Romanized)
  hebrew: [
    "ben zona", "benzona", "benz", "bz",
    "zona", "zon", "zona", "zonot",
    "lech timsor", "timsor", "timz",
    "kuse", "kus", "kuse", "kusim",
    "mamzer", "mamz", "mamzer", "mamzerim",
    "sharmuta", "sharm", "sharmuta",
    "dreck", "drek", "dreck", "drek",
    "hamor", "hamr", "hamor", "hamorim"
  ],

  // Persian/Farsi (Romanized)
  persian: [
    "kos", "koskesh", "koskesh", "kosksh",
    "kooni", "koni", "koon", "kooni",
    "jende", "jnde", "jende", "jendeh",
    "lanati", "lanat", "lanati", "lanat",
    "ghahr", "ghahr", "ghahri", "ghahr",
    "bi sharm", "bisharm", "bsharm",
    "madar jende", "madarjende", "mdrjnde",
    "khar", "khar", "khar Kos", "kharkos"
  ],

  // Other/Mixed
  other: [
    "scammer", "scam", "fraud", "hack",
    "virus", "trojan", "malware", "phishing",
    "spammer", "spam", "botnet", "ddos",
    "terrorist", "terror", "bomb", "kill",
    "die", "death", "dead", "murder",
    "rape", "rapist", "molest", "pedo",
    "nazi", "hitler", "stalin", "isis",
    "ku klux", "kkk", "racist", "racism",
    "homophobic", "transphobic", "sexist",
    "abuse", "abuser", "harass", "harassment",
    "stalk", "stalker", "bully", "bullying",
    "troll", "trolling", "grief", "griefer",
    "cheat", "cheater", "hack", "hacker",
    "crack", "cracker", "pirate", "warez",
    "torrent", "illegal", "drug", "cocaine",
    "heroin", "meth", "weed", "marijuana",
    "lsd", "ecstasy", "mdma", "pills",
    "overdose", "suicide", "cutting", "self harm"
  ]
};

// Flatten and create optimized regex
const allBadWords = Object.values(badWordCategories).flat();
const badWordRegex = createRegex(allBadWords);

// Leet speak substitutions (for advanced bypass detection)
const leetMap = {
  'a': '[a4@]', 'e': '[e3€]', 'i': '[i1!¡]', 'o': '[o0°]',
  's': '[s5$§]', 't': '[t7+]', 'g': '[g9&]', 'b': '[b8]',
  'l': '[l1|]', 'z': '[z2]', 'k': '[k]', 'c': '[c(¢]'
};

// ==================== LINK PATTERNS (Optimized) ====================
const linkPatterns = [
  // WhatsApp
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?whatsapp\.com\/channel\/\S+/gi,
  
  // Telegram
  /https?:\/\/(?:t\.me|telegram\.me|te\.me)\/\S+/gi,
  
  // Social Media
  /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/gi,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
  /https?:\/\/(?:fb\.me|fb\.com)\/\S+/gi,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?x\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
  /https?:\/\/(?:vm\.tiktok\.com|vt\.tiktok\.com)\/\S+/gi,
  
  // Professional/Chat
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.gg\/\S+/gi,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
  
  // Media
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
  /https?:\/\/redd\.it\/\S+/gi,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
  
  // Other
  /https?:\/\/ngl\.link\/\S+/gi,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?github\.com\/\S+/gi,
  
  // URL shorteners (often used to hide links)
  /https?:\/\/(?:bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link)\/\S+/gi,
  
  // IP addresses (potential phishing)
  /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\S*/gi
];

// Pre-compiled link regex for speed
const linkRegex = new RegExp(linkPatterns.map(r => r.source).join('|'), 'gi');

// ==================== OPTIMIZED CHECK FUNCTIONS ====================
const checkBadWords = (text) => {
  if (!text || text.length > 5000) return false; // Limit for performance
  return badWordRegex.test(text.toLowerCase());
};

const checkLinks = (text) => {
  if (!text) return false;
  linkRegex.lastIndex = 0; // Reset regex
  return linkRegex.test(text);
};

// Advanced check with leet speak decoding
const checkAdvancedBadWords = (text) => {
  if (!text) return false;
  
  // Normalize text: remove extra spaces, to lowercase
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Check standard
  if (badWordRegex.test(normalized)) return true;
  
  // Check with leet speak variations
  const leetDecoded = normalized.replace(/[4@]/g, 'a')
    .replace(/[3€]/g, 'e')
    .replace(/[1!¡]/g, 'i')
    .replace(/[0°]/g, 'o')
    .replace(/[5$§]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/[9&]/g, 'g')
    .replace(/[8]/g, 'b');
  
  return badWordRegex.test(leetDecoded);
};

// ==================== MESSAGE HANDLER ====================
const handleViolation = async (conn, m, from, sender, type, config) => {
  const warnings = {
    badword: {
      text: `🚫 *BAD WORD DETECTED* 🚫\n\n@${sender.split('@')[0]} your message contains prohibited language.\n\n⚠️ Warning: Repeated violations will result in removal.`,
      action: 'warn'
    },
    link: {
      text: `🔗 *LINK NOT ALLOWED* 🔗\n\n@${sender.split('@')[0]} unauthorized links are prohibited.\n\n🚫 You have been removed from the group.`,
      action: 'remove'
    }
  };

  const warning = warnings[type];
  
  // Delete message first
  await conn.sendMessage(from, { delete: m.key });
  
  // Send warning
  await conn.sendMessage(from, {
    text: warning.text,
    mentions: [sender]
  });

  // Log for admin review (optional)
  console.log(`[${type.toUpperCase()}] User: ${sender}, Group: ${from}, Time: ${new Date().toISOString()}`);

  // Take action if needed
  if (warning.action === 'remove' && type === 'link') {
    await conn.groupParticipantsUpdate(from, [sender], "remove");
  }
};

// ==================== ANTI-BAD WORDS ====================
cmd({ on: 'body' }, async (conn, m, store, {
  from, body, isGroup, isAdmins, isBotAdmins, sender
}) => {
  try {
    // Quick checks first (fastest to slowest)
    if (!isGroup) return;
    if (isAdmins) return; // Admins exempt
    if (!isBotAdmins) return; // Bot needs admin
    if (config.ANTI_BAD_WORD !== 'true') return;
    if (!body || body.length > 5000) return; // Skip very long messages

    // Check bad words (optimized)
    if (checkBadWords(body) || checkAdvancedBadWords(body)) {
      await handleViolation(conn, m, from, sender, 'badword', config);
    }

  } catch (err) {
    console.error("❌ Anti-BadWords Error:", err.message);
  }
});

// ==================== ANTI-LINK ====================
cmd({ on: 'body' }, async (conn, m, store, {
  from, body, sender, isGroup, isAdmins, isBotAdmins
}) => {
  try {
    // Quick checks
    if (!isGroup) return;
    if (isAdmins) return;
    if (!isBotAdmins) return;
    if (config.ANTI_LINK !== 'true') return;
    if (!body) return;

    // Check links (optimized)
    if (checkLinks(body)) {
      await handleViolation(conn, m, from, sender, 'link', config);
    }

  } catch (err) {
    console.error("❌ Anti-Link Error:", err.message);
  }
});

// ==================== ADDITIONAL: ANTI-SPAM (Bonus) ====================
const messageCache = new Map();

cmd({ on: 'body' }, async (conn, m, store, {
  from, body, sender, isGroup, isAdmins, isBotAdmins
}) => {
  try {
    if (!isGroup || isAdmins || !isBotAdmins) return;
    if (config.ANTI_SPAM !== 'true') return;

    const key = `${from}-${sender}`;
    const now = Date.now();
    const userData = messageCache.get(key) || { count: 0, time: now, messages: [] };

    // Reset if more than 10 seconds passed
    if (now - userData.time > 10000) {
      userData.count = 0;
      userData.time = now;
      userData.messages = [];
    }

    userData.count++;
    userData.messages.push({ body, time: now });
    messageCache.set(key, userData);

    // If more than 5 messages in 10 seconds
    if (userData.count > 5) {
      await conn.sendMessage(from, { delete: m.key });
      await conn.sendMessage(from, {
        text: `🚫 *SPAM DETECTED* 🚫\n\n@${sender.split('@')[0]} please slow down.\nRepeated spam will result in removal.`,
        mentions: [sender]
      });
    }

    // Clean old cache entries periodically
    if (Math.random() < 0.01) { // 1% chance per message
      const cutoff = now - 60000;
      for (const [k, v] of messageCache.entries()) {
        if (v.time < cutoff) messageCache.delete(k);
      }
    }

  } catch (err) {
    console.error("❌ Anti-Spam Error:", err.message);
  }
});

module.exports = { checkBadWords, checkLinks, badWordCategories };
