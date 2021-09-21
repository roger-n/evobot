const i18n = require("../util/i18n");
const { play } = require("../include/play");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const YouTubeAPI = require("simple-youtube-api");
const { MessageEmbed } = require("discord.js");

const { getPreview } = require("spotify-url-info");

const { YOUTUBE_API_KEY, DEFAULT_VOLUME, EMBED_COLOR } = require("../util/Util");

const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

module.exports = {
  name: "play",
  cooldown: 3,
  aliases: ["p"],
  description: i18n.__("play.description"),
  async execute(message, args) {
    const { channel } = message.member.voice;

    const serverQueue = message.client.queue.get(message.guild.id);

    if (!channel) return message.reply(i18n.__("play.errorNotChannel")).catch(console.error);

    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }))
        .catch(console.error);

    if (!args.length)
      return message
        .reply(i18n.__mf("play.usageReply", { prefix: message.client.prefix }))
        .catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) return message.reply(i18n.__("play.missingPermissionConnect"));
    if (!permissions.has("SPEAK")) return message.reply(i18n.__("play.missingPermissionSpeak"));

    const search = args.join(" ");
    const youtubePattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/;
    const youtubePlaylistPattern = /^.*(list=)([^#\&\?]*).*/gi;
    const spotifyPattern = /^.*(https:\/\/open\.spotify\.com\/)([^#\&\?]*).*/;
    const spotifyPlaylistPattern = /^.*(https:\/\/open\.spotify\.com\/playlist\/)([^#\&\?]*).*/;
    const url = args[0];
    const urlValidYoutube = youtubePattern.test(args[0]);
    const urlValidSpotify = spotifyPattern.test(args[0]);

    // Start the playlist if playlist url was provided
    if (youtubePattern.test(args[0]) && youtubePlaylistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    } else if (spotifyPlaylistPattern.test(args[0])) {
      return message.client.commands.get("playlist").execute(message, args);
    }

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: DEFAULT_VOLUME,
      muted: false,
      playing: true
    };

    let songInfo = null;
    let song = null;

    if (urlValidYoutube) {
      try {
        songInfo = await ytdl.getInfo(url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    } else if (urlValidSpotify) {
      try {
        const trackPreview = await getPreview(url);

        const res = (await ytsr(`${trackPreview.title} - ${trackPreview.artist || ""}`, { limit: 1 }))
          .items[0];

        songInfo = await ytdl.getInfo(res.url);
        song = {
          title: res.title,
          url: res.url,
          duration: res.duration
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchVideos(search, 1, { part: "id" });

        if (!results.length) {
          message.reply(i18n.__("play.songNotFound")).catch(console.error);
          return;
        }

        songInfo = await ytdl.getInfo(results[0].url);
        song = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: songInfo.videoDetails.lengthSeconds
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);

      const queueEmbed = new MessageEmbed()
        .setTitle("Queued")
        .setDescription(`${song.title} [${song.url}]`)
        .setColor(EMBED_COLOR);

      return serverQueue.textChannel.send(queueEmbed);
    }

    queueConstruct.songs.push(song);
    message.client.queue.set(message.guild.id, queueConstruct);

    try {
      queueConstruct.connection = await channel.join();
      await queueConstruct.connection.voice.setSelfDeaf(true);
      play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(error);
      message.client.queue.delete(message.guild.id);
      await channel.leave();
      return message.channel.send(i18n.__mf("play.cantJoinChannel", { error: error })).catch(console.error);
    }
  }
};
