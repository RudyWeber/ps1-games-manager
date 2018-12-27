import React from "react";
import { Button, ButtonIcon } from "@rmwc/button";

const { dialog } = window.require("electron").remote;

const getGameFiles = onSelected => () => {
  const gameFilesPaths = dialog.showOpenDialog({
    filters: [
      {
        name: "PS1 files",
        extensions: ["cue", "bin"]
      }
    ],
    properties: ["openFile", "multiSelections"]
  });

  if (gameFilesPaths) {
    onSelected(gameFilesPaths);
  }
};

const AddGame = ({ onSelected }) => {
  return (
    <Button raised onClick={getGameFiles(onSelected)}>
      <ButtonIcon icon="library_add" />
      Ajouter un jeu
    </Button>
  );
};

export default AddGame;
