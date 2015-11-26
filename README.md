# Cosmic Music Player

## Overview

This is a music player app for Android (4.1+) smartphones. It is built using [Apache Cordova](https://cordova.apache.org/) and [Ionic Framework](http://ionicframework.com/). The main goal of this project is to build an user-friendly, nice-looking and efficient music app. Try [the android debug-apk](https://github.com/homerours/cosmic/blob/master/android-debug.apk) !

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

## Dependencies
This app requires the following plugins:
- [Cordova device plugin](https://github.com/apache/cordova-plugin-device)
- [Cordova file plugin](https://github.com/apache/cordova-plugin-file)
- [Cordova file-transfer plugin](https://github.com/apache/cordova-plugin-file-transfer)
- [Cordova media plugin](https://github.com/apache/cordova-plugin-media)
- [Cordova splashscreen plugin](https://github.com/apache/cordova-plugin-splashscreen)
- [Cordova statusbar plugin](https://github.com/apache/cordova-plugin-statusbar)
- [Cordova whitelist plugin](https://github.com/apache/cordova-plugin-whitelist)
- [Sqlite plugin](https://github.com/litehelpers/Cordova-sqlite-storage)
- [Toast plugin](https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin)
- [Image resizer plugin](https://github.com/RaananW/PhoneGap-Image-Resizer)
- [Music controls plugin](https://github.com/homerours/cordova-music-controls-plugin)
- [Ionic keyboard plugin](https://github.com/driftyco/ionic-plugin-keyboard)

## Development

This app has only been tested on Android 4.4. It is currently at an early development stage, major changes may happen. Contributions and/or ideas are welcome.

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## References

This project has been influenced by [this article](http://www.raymondcamden.com/2015/04/29/working-with-mp3s-id3-and-phonegapcordova) on Raymond Camden’s blog and [this article](https://blog.nraboy.com/2014/09/manage-files-in-android-and-ios-using-ionicframework/) on Nic Raboy’s blog.
