const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function toBool(text, fault = 'true') {
  return String(text).toLowerCase() === String(fault).toLowerCase();
}

module.exports = {
  // SESSION & OWNER
  SESSION_ID: process.env.SESSION_ID || "JESUS-CRASH-V2~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoic0ZnSmJqV0k0ZmxjZ0pSZlkwUXJQeG94aDNlMzRQWFVQUG92SER2bi8yaz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiemxTYkpXc1F4Q0VWY3FGb001NitRMnU5dEN2NEphSzdvZFM5a0cyTzNrST0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiI2SUo4S2pwNHRKRHZHQ3BXaXhnSnpGRm51UmJhUkdhOC8xRlZaZmRPazBvPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIvMTVjK0grUk1oYTVXdWx0RGd1a1lsa3lvZGwyenFSQzBXNGYzRmxWMlFjPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkVCMWMzckl2dTdSRW1PanRjSEx5dWtFa25Wby9XN2FHdjJLUDJLT21WVlE9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImFZWDdURS9sZndYNngrS0JaeDIrMzB0ZlJobFlsZ2pDUTh5a3FHT05PVGc9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiNEx0ZkJyd0RzUW5ieW5FYVBlTms1S1c1d1VkQXY4bHljQUp3ZDlvZU8wUT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMjlRQXF5S01YYkRkVFd5d1Q4ajh4dEd4TGRhUFQ4dzB1YTQzL1hHSTd3TT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImRkUzVuYUEwTlduek5XQTQycmhZRDFuZDUzOVdsM1BEM21WK3FmdlNhSVQySjVuRXNYMUVVb2NJaGRkN1ZhdnBnWFNhSkRPSzVJakUxRDNzdzFOYWh3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6NjksImFkdlNlY3JldEtleSI6ImV5MFQxdFlVcTkxSm1lY3U2SFdsZVNMdnRHZVVUaFgxUWlZNTFKNjk0a289IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbeyJrZXkiOnsicmVtb3RlSmlkIjoiMTYwNTgxMjA0MTVAcy53aGF0c2FwcC5uZXQiLCJmcm9tTWUiOnRydWUsImlkIjoiM0FFODNFOTg3NUI0NTdFRUIyQjgifSwibWVzc2FnZVRpbWVzdGFtcCI6MTc3NDM1NjU0NX1dLCJuZXh0UHJlS2V5SWQiOjgxMywiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjgxMywiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJZVVBSQURFViIsIm1lIjp7ImlkIjoiMTYwNTgxMjA0MTU6MjdAcy53aGF0c2FwcC5uZXQiLCJsaWQiOiI3MzgwOTgxODMyMDg5NzoyN0BsaWQiLCJuYW1lIjoi8J2Qg/CdkIjwnZCE4LySIn0sImFjY291bnQiOnsiZGV0YWlscyI6IkNKVG40dWdERUt5UWlzNEdHQUVnQUNnQSIsImFjY291bnRTaWduYXR1cmVLZXkiOiJWYXZPT1RDbTNTWjVPRE9NTExWU0xWUnpLZjF0TmxzaHhuZFZLd2g2ZXprPSIsImFjY291bnRTaWduYXR1cmUiOiJ3ZWxIUklzRzVJTjZleDNQTDVUMnk3ZTRmYXdjUDZMRElHRTJaaWVGM1Q2cTNpWERqS01ITHAydzd1Ukt0dEZYQktTQ2JmNUQ5RnRKdEtBQklyODlCdz09IiwiZGV2aWNlU2lnbmF0dXJlIjoiRU56UFBIWm52dGFpdCtFSnJjWHp3aGQrZUw1YUhuZ0ZBZGZUSlRpSEhSTnY4RTFQYTZCSVg5TjBLMWJJT1VYZWJVMnhBNFRzQ1BFTTUrbjFObCtPZ3c9PSJ9LCJzaWduYWxJZGVudGl0aWVzIjpbeyJpZGVudGlmaWVyIjp7Im5hbWUiOiIxNjA1ODEyMDQxNToyN0BzLndoYXRzYXBwLm5ldCIsImRldmljZUlkIjowfSwiaWRlbnRpZmllcktleSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkJWV3J6amt3cHQwbWVUZ3pqQ3kxVWkxVWN5bjliVFpiSWNaM1ZTc0llbnM1In19XSwicGxhdGZvcm0iOiJpcGhvbmUiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBVUlBZ2dOIn0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc3NDM1NjUzOCwibGFzdFByb3BIYXNoIjoiM21sMWpTIiwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFJVDkifQ==",
  OWNER_NAME: process.env.OWNER_NAME || "DAWENS BOY",
  DEV: (process.env.DEV || "50942241547") + "@s.whatsapp.net",

  // BOT INFO
  BOT_NAME: process.env.BOT_NAME || "JESUS-CRASH-V2",
  STICKER_NAME: process.env.STICKER_NAME || "JESUS-CRASH-V2",
  DESCRIPTION: process.env.DESCRIPTION || "*© ᴘᴏᴡᴇʀᴇᴅ by dawens boy*",
  PREFIX: process.env.PREFIX || ".",
  MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/5srfgj.png",

  // WELCOME / GOODBYE / ADMIN
  WELCOME: toBool(process.env.WELCOME, "true"),
  GOODBYE: toBool(process.env.GOODBYE, "true"),
  ADMIN_EVENTS: toBool(process.env.ADMIN_EVENTS, "true"),      // Logs normal promote/demote
  SECURITY_ALERT: toBool(process.env.SECURITY_ALERT, "true"),  // Kick unauthorized promotes/demotes

  // STATUS
  AUTO_STATUS_SEEN: toBool(process.env.AUTO_STATUS_SEEN, "true"),
  AUTO_STATUS_REPLY: toBool(process.env.AUTO_STATUS_REPLY, "true"),
  AUTO_STATUS_REACT: toBool(process.env.AUTO_STATUS_REACT, "true"),
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*SEEN YOUR STATUS BY JESUS-CRASH-V2*",

  // AUTO FEATURES
  AUTO_REACT: toBool(process.env.AUTO_REACT, "false"),
  CUSTOM_REACT: toBool(process.env.CUSTOM_REACT, "false"),
  CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
  AUTO_VOICE: toBool(process.env.AUTO_VOICE, "false"),
  AUTO_STICKER: toBool(process.env.AUTO_STICKER, "true"),
  AUTO_REPLY: toBool(process.env.AUTO_REPLY, "true"),
  AUTO_TYPING: toBool(process.env.AUTO_TYPING, "false"),
  AUTO_RECORDING: toBool(process.env.AUTO_RECORDING, "true"),
  ALWAYS_ONLINE: toBool(process.env.ALWAYS_ONLINE, "false"),

  // ANTI SYSTEM
  ANTI_LINK: toBool(process.env.ANTI_LINK, "true"),
  ANTI_LINK_KICK: toBool(process.env.ANTI_LINK_KICK, "true"),
  DELETE_LINKS: toBool(process.env.DELETE_LINKS, "true"),
  ANTI_BAD: toBool(process.env.ANTI_BAD, "true"),
  ANTI_VV: toBool(process.env.ANTI_VV, "true"),
  ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "same",
  GHOST_MODE: toBool(process.env.GHOST_MODE, "true"),
  ANTI_CALL: toBool(process.env.ANTI_CALL, "true"),
  

  // ALIVE
  ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/gufckm.png",
  ALIVE_MSG: process.env.ALIVE_MSG || "> Zinda Hun Yar *JESUS-CRASH-V2*⚡",

  // OTHER
  MENTION_REPLY: toBool(process.env.MENTION_REPLY, "true"),
  MODE: process.env.MODE || "public",
  PUBLIC_MODE: toBool(process.env.PUBLIC_MODE, "true"),
  READ_MESSAGE: toBool(process.env.READ_MESSAGE, "false"),
  READ_CMD: toBool(process.env.READ_CMD, "false"),
  BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",

  // ADMIN ACCESS
  SUDO: process.env.SUDO || "989910713754,13058962443"
};
