import React, { useCallback, useState } from "react";

import GetUSBStickPath from "./pages/GetUSBStickPath";
import GameListHandler from "./pages/GameListHandler";
import CopyFilesToUSBStick from "./pages/CopyFilesToUSBStick";

import "./App.css";

const steps = [GetUSBStickPath, GameListHandler, CopyFilesToUSBStick];

const App = () => {
  const [step, setStep] = useState(0);
  const goToNextStep = useCallback(() => setStep(step + 1), [step]);
  const goToPrevStep = useCallback(() => setStep(step - 1), [step]);
  const [data, setData] = useState({});

  const CurrentStep = steps[step];

  return (
    <CurrentStep
      goToNextStep={goToNextStep}
      goToPrevStep={goToPrevStep}
      data={data}
      setData={setData}
    />
  );
};

export default App;
