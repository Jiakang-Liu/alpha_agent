export const RUN_STATUS = {
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

export const NODE_STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
};

export const DEFAULT_TIMELINE = [
  {
    id: "supervisor",
    label: "Supervisor Node",
    status: NODE_STATUS.IDLE,
  },
  {
    id: "data_agent",
    label: "Data Agent",
    status: NODE_STATUS.IDLE,
  },
  {
    id: "analyst_agent",
    label: "Analyst Agent",
    status: NODE_STATUS.IDLE,
  },
  {
    id: "critic",
    label: "Critic Node",
    status: NODE_STATUS.IDLE,
  },
];