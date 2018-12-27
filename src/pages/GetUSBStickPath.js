import React, { useCallback } from "react";
import { Button } from "@rmwc/button";

const { dialog } = window.require("electron").remote;

const GetUSBStickPath = ({ data, goToNextStep, setData }) => {
  const openDialog = useCallback(() => {
    const usbStickPath = dialog.showOpenDialog({
      properties: ["openDirectory"]
    });

    if (usbStickPath) {
      setData({ ...data, usbStickPath: usbStickPath[0] });
      goToNextStep();
    }
  }, []);

  return (
    <div className="getUsbStickPath">
      <Button raised onClick={openDialog}>
        Selectionner le dossier de la clé
      </Button>
    </div>
  );
};

export default GetUSBStickPath;
