import React, { useCallback, useState } from "react";
import { Grid, GridCell } from "@rmwc/grid";
import { Snackbar } from "@rmwc/snackbar";

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
  const [message, setMessage] = useState("");
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
  const generateMultiTrackCueFile = useCallback(
    gameNumber => () => {
      const gamePath = path.join(
        usbStickPath,
        "Games",
        gameNumber.toString(),
        "GameData"
      );

      const binList = fs
        .readdirSync(gamePath)
        .filter(filename => filename.endsWith(".bin"))
        .sort();
      const cueFilename = binList[0].replace(".bin", ".cue");
      const cueFileContent = binList.reduce((content, currentBin, index) => {
        if (index === 0) {
          return `FILE "${currentBin}" BINARY
TRACK 01 MODE2/2352
INDEX 01 00:00:00
`;
        } else {
          return (
            content +
            `FILE "${currentBin}" BINARY
TRACK ${index + 1 < 10 ? "0" + (index + 1) : index + 1} AUDIO
INDEX 00 00:00:00
INDEX 01 00:02:00
`
          );
        }
      }, "");

      fs.writeFileSync(path.join(gamePath, cueFilename), cueFileContent);

      setMessage("Fichier .cue multitrack généré.");
    },
    [gameList]
  );
  const generateMultiDiscCueFile = useCallback(
    gameNumber => () => {
      const gamePath = path.join(
        usbStickPath,
        "Games",
        gameNumber.toString(),
        "GameData"
      );

      const binList = fs
        .readdirSync(gamePath)
        .filter(filename => filename.endsWith(".bin"))
        .sort();
      binList.forEach(currentBin => {
        const cueFilename = currentBin.replace(".bin", ".cue");
        const content = `FILE "${currentBin}" BINARY
TRACK 01 MODE2/2352
INDEX 01 00:00:00
`;

        fs.writeFileSync(path.join(gamePath, cueFilename), content);
      });

      setMessage("Fchiers .cue pour chaque disques générés.");
    },
    [gameList]
  );

  return (
    <div className="gamesList">
      <Snackbar
        show={message}
        onHide={() => setMessage("")}
        message={message}
        timeout={3000}
      />
      <Grid>
        <GridCell span="12">
          <AddGameButton onSelected={handleNewGameFilesSelected} />
        </GridCell>
        <GridCell span="12">
          <GameList
            games={gameList}
            onDelete={deleteGame}
            onGenerateMultiDiscCueFiles={generateMultiDiscCueFile}
            onGenerateMultiTrackCueFiles={generateMultiTrackCueFile}
          />
        </GridCell>
      </Grid>
    </div>
  );
};

export default GameListHandler;
