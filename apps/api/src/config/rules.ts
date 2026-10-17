export const DEFAULT_RULES_CONFIG = {
  warningCooldownSec: 15,
  NO_FACE: { enabled: true, afterSec: 3, weight: 3, warn: false },
  MULTIPLE_FACES: { enabled: true, afterSec: 2, weight: 4, warn: true },
  LOOKING_AWAY: {
    enabled: true,
    afterSec: 5,
    yawDeg: 35,
    ignoreLookingDown: true,
    weight: 1,
    warn: false,
  },
  PHONE_DETECTED: { enabled: true, minConfidence: 0.6, afterSec: 2, weight: 5, warn: true },
  TAB_SWITCH: { enabled: true, weight: 2, warn: true },
  levels: { medium: 10, high: 25 },
};
