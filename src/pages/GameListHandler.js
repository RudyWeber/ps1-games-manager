import React, { useCallback, useState } from "react";
import { Grid, GridCell } from "@rmwc/grid";

import GameList from "../components/GameList";
import AddGameButton from "../components/AddGameButton";

const fs = window.require("electron").remote.require("fs");
const path = window.require("path");

const isFileGameIni = filename => filename.endsWith("/Game.ini");

const getFilesList = dir =>
  fs
    .readdirSync(dir)
    .reduce(
      (filelist, file) =>
        fs.statSync(path.join(dir, file)).isDirectory()
          ? [...filelist, ...getFilesList(path.join(dir, file))]
          : [...filelist, path.join(dir, file)],
      []
    );

const parseGameInfo = gameIniContent =>
  gameIniContent
    .split(/\n/)
    .slice(1)
    .filter(e => e)
    .reduce((info, line) => {
      const [key, value] = line.split("=");

      return {
        ...info,
        [key]: value
      };
    }, {});

const getGamesList = dir =>
  getFilesList(path.join(dir, "Games"))
    .filter(isFileGameIni)
    .map(filePath => parseGameInfo(fs.readFileSync(filePath).toString()));

const deleteFolderRecursively = dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file, index) => {
      const currentPath = path.join(dir, file);

      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteFolderRecursively(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });

    fs.rmdirSync(dir);
  }
};

const GameListHandler = ({
  data,
  data: { usbStickPath },
  goToNextStep,
  setData
}) => {
  const [gameList, setGameList] = useState(getGamesList(usbStickPath));
  const handleNewGameFilesSelected = useCallback(
    gameFilesPaths => {
      setData({
        ...data,
        gameFilesPaths
      });
      setGameList(getGamesList(usbStickPath));
      goToNextStep();
    },
    [gameList]
  );
  const deleteGame = useCallback(
    gameNumber => () => {
      const maxNumber = gameList.length;
      const gamesPath = path.join(usbStickPath, "Games");

      deleteFolderRecursively(path.join(gamesPath, gameNumber.toString()));

      for (
        let currentNumber = gameNumber + 1;
        currentNumber <= maxNumber;
        currentNumber++
      ) {
        fs.renameSync(
          path.join(gamesPath, currentNumber.toString()),
          path.join(gamesPath, (currentNumber - 1).toString())
        );
      }

      setGameList([
        ...gameList.slice(0, gameNumber - 1),
        ...gameList.slice(gameNumber)
      ]);
    },
    [gameList]
  );

  return (
    <div className="gamesList">
      <Grid>
        <GridCell span="12">
          <AddGameButton onSelected={handleNewGameFilesSelected} />
        </GridCell>
        <GridCell span="12">
          <GameList games={gameList} onDelete={deleteGame} />
        </GridCell>
      </Grid>
    </div>
  );
};

export default GameListHandler;
