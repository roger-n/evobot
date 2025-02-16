const ytdl = require("ytdl-core-discord");
const { canModifyQueue, STAY_TIME, EMBED_COLOR } = require("../util/Util");
const i18n = require("../util/i18n");
const { MessageEmbed } = require("discord.js");

module.exports = {
  async play(song, message) {
    const catchReactPermissionsError = (error) => {
      if (error.code === 50013) {
        console.log("Bot missing permissions to remove members' emotes");
      } else {
        console.error(error);
      }
    };

    let config;

    try {
      config = require("../config.json");
    } catch (error) {
      config = null;
    }

    const PRUNING = config ? config.PRUNING : process.env.PRUNING;

    const queue = message.client.queue.get(message.guild.id);

    if (!song) {
      setTimeout(function () {
        if (queue.connection.dispatcher && message.guild.me.voice.channel) return;
        queue.channel.leave();
        !PRUNING && queue.textChannel.send(i18n.__("play.leaveChannel"));
      }, STAY_TIME * 1000);
      !PRUNING && queue.textChannel.send(i18n.__("play.queueEnded")).catch(console.error);
      return message.client.queue.delete(message.guild.id);
    }

    let stream = null;
    let streamType = song.url.includes("youtube.com") ? "opus" : "ogg/opus";

    try {
      if (song.url.includes("youtube.com")) {
        stream = await ytdl(song.url, { highWaterMark: 1 << 25 });
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      console.error(error);
      return message.channel.send(
        i18n.__mf("play.queueError", { error: error.message ? error.message : error })
      );
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));

    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        queue.connection.removeAllListeners("disconnect");

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    let playEmbed = new MessageEmbed()
      .setTitle("Now playing")
      .setDescription(`[${song.title}](${song.url})`)
      .setColor(EMBED_COLOR);

      
    try {
      queue.lastPlayMessage.delete()
    } catch (e) {
      console.log(e)
    }
    const playEmbedSent = await queue.textChannel.send(playEmbed);
    queue.lastPlayMessage = playEmbedSent;

    try {
      await playEmbedSent.react("⏭");
      await playEmbedSent.react("⏯");
      // await playEmbedSent.react("🔇");
      // await playEmbedSent.react("🔉");
      // await playEmbedSent.react("🔊");
      // await playEmbedSent.react("🔁");
      // await playEmbedSent.react("⏹");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playEmbedSent.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      if (!queue) return;
      const member = message.guild.member(user);

      switch (reaction.emoji.name) {
        case "⏭":
          queue.playing = true;
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.connection.dispatcher.end();
          queue.textChannel.send(i18n.__mf("play.skipSong", { author: user })).catch(console.error);
          collector.stop();
          break;

        case "⏯":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause(true);
            queue.textChannel.send(i18n.__mf("play.pauseSong", { author: user })).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(i18n.__mf("play.resumeSong", { author: user })).catch(console.error);
          }
          break;

        case "🔇":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.muted = !queue.muted;
          if (queue.muted) {
            queue.connection.dispatcher.setVolumeLogarithmic(0);
            queue.textChannel.send(i18n.__mf("play.mutedSong", { author: user })).catch(console.error);
          } else {
            queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
            queue.textChannel.send(i18n.__mf("play.unmutedSong", { author: user })).catch(console.error);
          }
          break;

        case "🔉":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (queue.volume == 0) return;
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.volume = Math.max(queue.volume - 10, 0);
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(i18n.__mf("play.decreasedVolume", { author: user, volume: queue.volume }))
            .catch(console.error);
          break;

        case "🔊":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (queue.volume == 100) return;
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.volume = Math.min(queue.volume + 10, 100);
          queue.connection.dispatcher.setVolumeLogarithmic(queue.volume / 100);
          queue.textChannel
            .send(i18n.__mf("play.increasedVolume", { author: user, volume: queue.volume }))
            .catch(console.error);
          break;

        case "🔁":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.loop = !queue.loop;
          queue.textChannel
            .send(
              i18n.__mf("play.loopSong", {
                author: user,
                loop: queue.loop ? i18n.__("common.on") : i18n.__("common.off")
              })
            )
            .catch(console.error);
          break;

        case "⏹":
          reaction.users.remove(user).catch(catchReactPermissionsError);
          if (!canModifyQueue(member)) return i18n.__("common.errorNotChannel");
          queue.songs = [];
          queue.textChannel.send(i18n.__mf("play.stopSong", { author: user })).catch(console.error);
          try {
            queue.connection.dispatcher.end();
          } catch (error) {
            console.error(error);
            queue.connection.disconnect();
          }
          collector.stop();
          break;

        default:
          // Allow other reactions by keeping this line commented
          // reaction.users.remove(user).catch(catchReactPermissionsError);
          break;
      }
    });

    collector.on("end", () => {
      playEmbedSent.reactions.removeAll().catch(catchReactPermissionsError);
      if (PRUNING && playEmbedSent && !playEmbedSent.deleted) {
        playingMessage.delete({ timeout: 3000 }).catch(console.error);
      }
    });
  }
};
