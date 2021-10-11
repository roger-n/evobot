const i18n = require("../util/i18n");
const { MessageEmbed } = require("discord.js");
const { play } = require("../include/play");
const YouTubeAPI = require("simple-youtube-api");
// const { getTracks, getData } = require("spotify-url-info");
const { getData } = require("spotify-url-info");
const ytsr = require("ytsr");

const { YOUTUBE_API_KEY, MAX_PLAYLIST_SIZE, DEFAULT_VOLUME, EMBED_COLOR, SPOTIFY_CLIENT_ID, SPOTIFY_SECRET_ID } = require("../util/Util");
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);

var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_SECRET_ID,
});

module.exports = {
  name: "playlist",
  cooldown: 5,
  aliases: ["pl"],
  description: i18n.__("playlist.description"),
  async execute(message, args) {
    const { channel } = message.member.voice;
    const serverQueue = message.client.queue.get(message.guild.id);

    if (!args.length)
      return message
        .reply(i18n.__mf("playlist.usageReply", { prefix: message.client.prefix }))
        .catch(console.error);
    if (!channel) return message.reply(i18n.__("playlist.errorNotChannel")).catch(console.error);

    const permissions = channel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT")) return message.reply(i18n.__("playlist.missingPermissionConnect"));
    if (!permissions.has("SPEAK")) return message.reply(i18n.__("missingPermissionSpeak"));

    if (serverQueue && channel !== message.guild.me.voice.channel)
      return message
        .reply(i18n.__mf("play.errorNotInSameChannel", { user: message.client.user }))
        .catch(console.error);

    const search = args.join(" ");
    const youtubePattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
    const spotifyPattern = /^.*(https:\/\/open\.spotify\.com\/playlist\/)([^#\&\?]*).*/;
    const url = args[0];
    const urlValidYoutube = youtubePattern.test(args[0]);
    const urlValidSpotify = spotifyPattern.test(args[0]);

    const queueConstruct = {
      textChannel: message.channel,
      channel,
      connection: null,
      songs: [],
      loop: false,
      volume: DEFAULT_VOLUME,
      muted: false,
      playing: true,
      lastPlayMessage: undefined
    };

    let playlist = null;
    let videos = [];

    if (urlValidYoutube) {
      try {
        playlist = await youtube.getPlaylist(url, { part: "snippet" });
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE || 10, { part: "snippet" });
      } catch (error) {
        console.error(error);
        return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
      }
    } else if (urlValidSpotify) {
      try {

        let playlistEmbed = new MessageEmbed()
          .setDescription('Currently testing new Spotify playlist architecture to support 100+ track playlists.  ' +
            'Playlists over 200 songs long may take longer than 5 seconds to fully queue.  Current playlist max length set to 500.')
          .setColor(EMBED_COLOR);

        message.channel.send(playlistEmbed);

        const credentialsResponse = await spotifyApi.clientCredentialsGrant()
        const spotifyAccessToken = credentialsResponse.body['access_token']
        spotifyApi.setAccessToken(spotifyAccessToken);

        const playlistData = await getData(args[0]);

        playlist = {
          title: playlistData.name,
          url: args[0],
          id: playlistData.id
        };

        let aggregateTracks = [];
        let next = undefined;
        let page = 0;

        const paginationAmount = 50;

        do {
          const playlistResponse = await spotifyApi.getPlaylistTracks(playlistData.id, {
            offset: 0 + paginationAmount * page,
            limit: paginationAmount
          });

          const playlistBody = playlistResponse.body

          aggregateTracks = aggregateTracks.concat(playlistBody.items);
          next = playlistBody.next;
          page += 1
        } while (next);

        if (aggregateTracks.length > MAX_PLAYLIST_SIZE) {
          aggregateTracks.length = MAX_PLAYLIST_SIZE;
        }

        const spotifyToYoutube = await Promise.all(
          aggregateTracks.filter(t => t.track && t.track.name)
            .map((t, i) => ytsr(`${t.track.name} - ${t.track.artists[0].name || ""}`, { limit: 1 }))
        );

        const videoYoutubeResults = spotifyToYoutube.filter((s) => s.items[0].type === "video");

        const parsedSongs = videoYoutubeResults.map((r) => {
          const song = r.items[0];
          return {
            title: song.title,
            url: song.url,
            duration: song.duration,
            thumbnail: song.thumbnails ? song.thumbnails[0] : undefined
          };
        });

        videos = parsedSongs.filter((s) => s.title || s.duration);
      } catch (error) {
        console.error(error);
        return message.reply(i18n.__("playlist.errorNotFoundPlaylist")).catch(console.error);
      }
    } else {
      try {
        const results = await youtube.searchPlaylists(search, 1, { part: "id" });
        playlist = results[0];
        videos = await playlist.getVideos(MAX_PLAYLIST_SIZE, { part: "snippet" });
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    }

    const newSongs = videos
      .filter((video) => video.title != "Private video" && video.title != "Deleted video")
      .map((video) => {
        return (song = {
          title: video.title,
          url: video.url,
          duration: video.durationSeconds
        });
      });

    serverQueue ? serverQueue.songs.push(...newSongs) : queueConstruct.songs.push(...newSongs);

    let playlistEmbed = new MessageEmbed()
      .setDescription(`Queued **${newSongs.length}** tracks`)
      .setColor(EMBED_COLOR);

    if (playlistEmbed.description.length >= 2048)
      playlistEmbed.description =
        playlistEmbed.description.substr(0, 2007) + i18n.__("playlist.playlistCharLimit");

    message.channel.send(playlistEmbed);

    if (!serverQueue) {
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
  }
};
