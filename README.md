# PS1 Game Manager

An application to manage PS Classic games on a USB stick to use with [BleemSync](https://github.com/pathartl/BleemSync) by [Pat Hartl](https://github.com/pathartl).

## Download

You can get the lastest release from the [releases page](https://github.com/RudyWeber/ps1-games-manager/releases).

## Info

When adding a game:

- a `Game.ini` file is created with the game title and the discs properties filled in. The other
  properties are just placeholders which you can change according to your game.
- the game title will be given using the filename of the provided `.bin` file.
  If there are multiple discs, the name of the first one will be used. You can modify the name
  by changing the `Title` property in the corresponding `Game.ini` file.
- a placeholder image is created. Feel free to change it to whatever image you like.
- a default `pcsx.cfg` file is created. You should not need to change this file.

## Usage

Check the [wiki page](https://github.com/RudyWeber/ps1-games-manager/wiki).

## Todo

- [ ] Windows and Linux builds.
- [x] missing `cue` files generation for mono-track images.
- [x] missing `cue` files generation for multi-track images.
- [x] handle multi-track files.

## Development

```
$ yarn install
```

### Dev Server

```
$ yarn electron-dev
```

### build and run

```
$ yarn electron
```

### Package

```
$ yarn package
```
