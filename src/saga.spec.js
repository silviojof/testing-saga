import { fetchWorkflowLogsAsync, saveWorkflowLogAsync } from "./saga";

import * as workflowAPI from "./api";

import { ACTION_TYPES } from "./actions";

jest.mock("./api", () => ({
  fetchWorkflowLogsByDocId: jest.fn(),
  saveWorkflowLog: jest.fn()
}));

jest.mock("redux-saga/effects", () => ({
  call: (fn, payload) => ({ CALL: {}, fn, payload }),
  put: val => ({ PUT: { action: { type: val.type } } })
}));

async function runGen(iterator, yields) {
  let index = 0;
  let values = [];
  let result = iterator.next(yields[index]);

  while (result.done === false) {
    index += 1;
    if (result.value.toString() === "[object Generator]") {
      // eslint-disable-next-line no-await-in-loop
      const newValues = await runGen(result.value, yields.slice(index));
      values = values.concat(newValues);
      result = iterator.next(yields[index]);
    } else if (result.value.PUT) {
      values.push(result.value.PUT.action);
      result = iterator.next(yields[index]);
    } else if (result.value.CALL) {
      const response = yields[index];
      result.value.fn();
      try {
        // eslint-disable-next-line no-await-in-loop
        const data = await response;
        values.push(data);
        result = iterator.next(response);
      } catch (err) {
        result = iterator.throw(new Error("Something went wrong"));
      }
    } else if (result.value.ERROR) {
      values.push(result.value.ERROR.action);
      result = iterator.next(yields[index]);
    }
  }
  return values;
}

async function runSaga(saga, yields) {
  const values = await runGen(saga, yields);
  return {
    get: index => values[index] || {},
    getAll: () => values
  };
}

describe("Actions", () => {
  beforeEach(() => jest.resetAllMocks());

  it("call fetchWorkflowLogsAsync saga on error", async () => {
    const fetchWorkflowLogsByDocId = jest.spyOn(
      workflowAPI,
      "fetchWorkflowLogsByDocId"
    );
    const response = { response: [] };
    const yields = [0, 0, Promise.reject(response), 0, 0];
    const sagaHistory = await runSaga(
      fetchWorkflowLogsAsync({ payload: {} }),
      yields
    );
    expect(sagaHistory.get(0).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_STARTED
    );
    expect(sagaHistory.get(1).type).toBe(ACTION_TYPES.SET_ERROR);
    expect(sagaHistory.get(2).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED
    );
    expect(fetchWorkflowLogsByDocId).toHaveBeenCalled();
  });

  it("call fetchWorkflowLogsAsync saga on success", async () => {
    const response = { response: [] };
    const yields = [0, 0, Promise.resolve(response), 0, 0];
    const sagaHistory = await runSaga(
      fetchWorkflowLogsAsync({ payload: {} }),
      yields
    );
    expect(sagaHistory.get(0).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_STARTED
    );
    expect(sagaHistory.get(2).type).toBe(ACTION_TYPES.SET_WORKFLOW_LOGS);
    expect(sagaHistory.get(3).type).toBe(ACTION_TYPES.SET_LAST_WORKFLOW_LOG);
    expect(sagaHistory.get(4).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED
    );
  });

  it("call saveWorkflowLogAsync saga on success", async () => {
    const fetchWorkflowLogsByDocId = jest.spyOn(
      workflowAPI,
      "fetchWorkflowLogsByDocId"
    );
    const saveWorkflowLog = jest.spyOn(workflowAPI, "fetchWorkflowLogsByDocId");
    const response = { response: [] };
    const yields = [
      0, 0, Promise.resolve(response), 0, Promise.resolve(response), 0
    ];
    const sagaHistory = await runSaga(
      saveWorkflowLogAsync({ payload: {} }),
      yields
    );
    expect(sagaHistory.get(0).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_STARTED
    );
    expect(sagaHistory.get(2).type).toBe(ACTION_TYPES.SET_LAST_WORKFLOW_LOG);
    expect(sagaHistory.get(4).type).toBe(ACTION_TYPES.SET_WORKFLOW_LOGS);
    expect(sagaHistory.get(5).type).toBe(
      ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED
    );
    expect(fetchWorkflowLogsByDocId).toHaveBeenCalled();
    expect(saveWorkflowLog).toHaveBeenCalled();
  });
});
