# Ganyu Music (Discord Music Bot)
> Ganyu Music is a Discord Music bot built on top of [EvoBot](https://github.com/eritislami/evobot)

> Credit goes to EvoBot and its contributors for all initial functionality.

> Ganyu Music was forked off of Evobot on September 18, 2021 at commit 48e33a4. 

> Ganyu Music and EvoBot are built with discord.js & use Command Handler from [discordjs.guide](https://discordjs.guide)

> This README is a modified version of EvoBot's.

## Requirements

1. Discord Bot Token **[Guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot)**
2. YouTube Data API v3 Key **[Guide](https://developers.google.com/youtube/v3/getting-started)**  
3. Node.js v14.0.0 or newer

## Getting Started

```sh
git clone https://github.com/roger-n/evobot/tree/ganyu-mains
cd evobot
npm install
```

After installation finishes follow configuration instructions then run `npm start` to start the bot.

## Configuration

Copy or Rename `config.json.example` to `config.json` and fill out the values:

⚠️ **Note: Never commit or share your token or api keys publicly** ⚠️

```json
{
  "TOKEN": "",
  "YOUTUBE_API_KEY": "",
  "MAX_PLAYLIST_SIZE": 500,
  "PREFIX": "/",
  "PRUNING": false,
  "LOCALE": "en",
  "DEFAULT_VOLUME": 100,
  "STAY_TIME": 500
}
```

## Features & Commands

> Note: The default prefix is '/'

`/play <arg0>`

* arg0: YouTube video, YouTube playlist, Spotify track, or Spotify playlist link

`/search <arg0>`

* arg0: search query for YouTube

`/playlist <arg0>`

* arg0: YouTube playlist link, Spotify playlist link, or YouTube playlist search query

Other commands

* Now Playing (/np)
* Queue system (/queue, /q)
* Loop / Repeat (/loop)
* Shuffle (/shuffle)
* Volume control (/volume, /v)
* Lyrics (/lyrics, /ly)
* Pause (/pause)
* Resume (/resume, /r)
* Skip (/skip, /s)
* Skip to song # in queue (/skipto, /st)
* Move a song in the queue (/move, /mv)
* Remove song # from queue (/remove, /rm)
* Play an mp3 clip (/clip song.mp3) (put the file in sounds folder)
* List all clips (/clips)
* Show ping to Discord API (/ping)
* Show bot uptime (/uptime)
* Toggle pruning of bot messages (/pruning)
* Help (/help, /h)
* Command Handler from [discordjs.guide](https://discordjs.guide/)
* Media Controls via Reactions

## Credits

[Eritislami and all of EvoBot's contributors](https://github.com/eritislami/evobot/graphs/contributors) For the original music bot this project was forked from [@eritislami/evobot](https://github.com/eritislami/evobot)
