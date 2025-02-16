exports.canModifyQueue = (member) => member.voice.channelID === member.guild.voice.channelID;

let config;

try {
  config = require("../config.json");
} catch (error) {
  config = null;
}

exports.TOKEN = config ? config.TOKEN : process.env.TOKEN;
exports.YOUTUBE_API_KEY = config ? config.YOUTUBE_API_KEY : process.env.YOUTUBE_API_KEY;
exports.PREFIX = (config ? config.PREFIX : process.env.PREFIX) || "/";
exports.MAX_PLAYLIST_SIZE = (config ? config.MAX_PLAYLIST_SIZE : process.env.MAX_PLAYLIST_SIZE) || 10;
exports.PRUNING = (config ? config.PRUNING : process.env.PRUNING) || false;
exports.STAY_TIME = (config ? config.STAY_TIME : process.env.STAY_TIME) || 30;
exports.DEFAULT_VOLUME = (config ? config.DEFAULT_VOLUME : process.env.DEFAULT_VOLUME) || 100;
exports.LOCALE = (config ? config.LOCALE : process.env.LOCALE) || "en";
exports.EMBED_COLOR = (config ? config.EMBED_COLOR : process.env.EMBED_COLOR) || "#B5D8F7";
exports.SPOTIFY_CLIENT_ID = config ? config.SPOTIFY_CLIENT_ID : process.env.SPOTIFY_CLIENT_ID;
exports.SPOTIFY_SECRET_ID = config ? config.SPOTIFY_SECRET_ID : process.env.SPOTIFY_SECRET_ID;