# Cosmic Music Player

## Overview

This is a music player app for smartphones. It is built using [Apache Cordova](https://cordova.apache.org/) and [Ionic Framework](http://ionicframework.com/). The main goal of this project is to build an user-friendly, nice-looking and efficient music app.

<img src='https://github.com/homerours/cosmic/blob/master/screenshots/playlist-home.jpg' width='200px' height='350px'>
<img src='https://github.com/homerours/cosmic/blob/master/screenshots/player.jpg' width='200px' height='350px'>
<img src='https://github.com/homerours/cosmic/blob/master/screenshots/playlist.jpg' width='200px' height='350px'>

You will find some more screenshots [here](https://github.com/homerours/cosmic/tree/master/screenshots).

## Features

- Scan recursively local directories, load music files into SQLite local database.
- Media controls in notifications, using [music-controls-plugin](https://github.com/homerours/cordova-music-controls-plugin)
- ID3 Tags reading (including album cover), using [JavaScript-ID3-Reader](https://github.com/aadsm/JavaScript-ID3-Reader).
- Find missing album covers online.
- Navigation by artists, playlists or global search.
- Uses artwork miniature files (to speed up the views), obtained using [cordova-imageResizer plugin](https://github.com/wymsee/cordova-imageResizer).

## Development

This app has only been tested on Android 4.4 but all components are compatible with iOS. It is currently at an early development stage, major changes may happen. Contributions and/or ideas are welcome.

## References

This project has been strongly influenced by [this article](http://www.raymondcamden.com/2015/04/29/working-with-mp3s-id3-and-phonegapcordova) on Raymond Camden’s blog and [this article](https://blog.nraboy.com/2014/09/manage-files-in-android-and-ios-using-ionicframework/) on Nic Raboy’s blog.
