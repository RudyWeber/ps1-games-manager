import React, { useEffect } from "react";
import { LinearProgress } from "@rmwc/linear-progress";
import { Grid, GridCell } from "@rmwc/grid";

import { pcsxcfg, placeholderImage64 } from "../config";

const fs = window.require("electron").remote.require("fs");
const path = window.require("path");
const { promisify } = window.require("util");

const promisifyAll = (module, fnNames) =>
  fnNames.reduce(
    (moduleP, fnName) => ({
      ...moduleP,
      [fnName]: promisify(module[fnName])
    }),
    {}
  );

const fsP = promisifyAll(fs, ["copyFile", "mkdir", "readdir", "writeFile"]);

const getNextAvailableGameIndexNumber = dir =>
  fsP
    .readdir(path.join(dir, "Games"))
    .then(
      dirList =>
        Math.max(
          ...dirList.map(n => Number.parseInt(n)).filter(n => !Number.isNaN(n)),
          0
        ) + 1
    );

const CopyFilesToUSBStick = ({
  data: { gameFilesPaths, usbStickPath },
  goToPrevStep
}) => {
  useEffect(() => {
    // Oooh, dirty sneaky me. useEffect(async () => {}) isn't supported yet.
    (async () => {
      const sortedGameFilesPaths = gameFilesPaths.sort();
      const gameTitle = sortedGameFilesPaths[0]
        .slice(sortedGameFilesPaths[0].lastIndexOf("/") + 1)
        .slice(0, -4);

      const nextAvailableGameIndexNumber = await getNextAvailableGameIndexNumber(
        usbStickPath
      );
      const partialDestPath = path.join(
        usbStickPath,
        "Games",
        nextAvailableGameIndexNumber.toString()
      );
      const destPath = path.join(partialDestPath, "GameData");

      const copyGameFiles = () =>
        gameFilesPaths.map(filePath =>
          fsP.copyFile(
            filePath,
            path.join(destPath, filePath.slice(filePath.lastIndexOf("/") + 1))
          )
        );

      const copyPCSXConfig = () =>
        fsP.writeFile(path.join(destPath, "pcsx.cfg"), pcsxcfg);

      const writeGameIniFile = () =>
        fsP.writeFile(
          path.join(destPath, "Game.ini"),
          `[Game]
Discs=${gameFilesPaths
            .filter(
              filePath => filePath.endsWith(".bin") || filePath.endsWith(".cue")
            )
            .map(filePath =>
              filePath.slice(filePath.lastIndexOf("/") + 1).slice(0, -4)
            )
            .sort()}
Title=${gameTitle}
Publisher=WeberCompany
Players=2
Year=1988`
        );

      const writePlaceholderImage = () =>
        fsP.writeFile(
          path.join(destPath, gameTitle + ".png"),
          new Buffer(placeholderImage64, "base64")
        );

      await fsP.mkdir(partialDestPath);
      await fsP.mkdir(destPath);
      await Promise.all([
        ...copyGameFiles(),
        copyPCSXConfig(),
        writeGameIniFile(),
        writePlaceholderImage()
      ]);

      goToPrevStep();
    })();
  }, []);

  return (
    <Grid>
      <GridCell span="12">Copie en cours...</GridCell>
      <GridCell span="12">
        <LinearProgress determinate={false} />
      </GridCell>
    </Grid>
  );
};

export default CopyFilesToUSBStick;
