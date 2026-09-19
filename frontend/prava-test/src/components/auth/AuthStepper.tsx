import React from "react";
import { IconCheck, IconLock, IconMail, IconUser } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./AuthStepper.module.css";

interface AuthStepperProps {
  currentStep: 1 | 2 | 3;
  steps: [string, string, string];
}

export const AuthStepper: React.FC<AuthStepperProps> = ({
  currentStep,
  steps,
}) => {
  const { t } = useTranslation();

  const getIcon = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber < currentStep) {
      return <IconCheck size={18} stroke={2.5} />;
    }
    if (stepNumber === 1) return <IconUser size={18} />;
    if (stepNumber === 2) return <IconMail size={18} />;
    return <IconLock size={18} />;
  };

  const getCircleClass = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber < currentStep) {
      return `${classes.iconCircle} ${classes.iconCircleCompleted}`;
    }
    if (stepNumber === currentStep) {
      return `${classes.iconCircle} ${classes.iconCircleActive}`;
    }
    return classes.iconCircle;
  };

  const getLabelClass = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber < currentStep) {
      return `${classes.stepLabel} ${classes.stepLabelCompleted}`;
    }
    if (stepNumber === currentStep) {
      return `${classes.stepLabel} ${classes.stepLabelActive}`;
    }
    return classes.stepLabel;
  };

  const lineWidthPercent = currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%";

  return (
    <div
      className={classes.stepperWrapper}
      aria-label={t("authV2.stepper.stepAria", {
        current: currentStep,
        total: 3,
        defaultValue: `Bosqich ${currentStep} / 3`,
      })}
    >
      <div className={classes.connectingLine}>
        <div
          className={classes.connectingLineProgress}
          style={{ width: lineWidthPercent }}
        />
      </div>

      {[1, 2, 3].map((num) => {
        const stepNum = num as 1 | 2 | 3;
        return (
          <div key={stepNum} className={classes.stepItem}>
            <div className={getCircleClass(stepNum)}>
              {getIcon(stepNum)}
            </div>
            <span className={getLabelClass(stepNum)}>
              {`${stepNum}. ${steps[stepNum - 1]}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AuthStepper;
