import { call, put } from "redux-saga/effects";
import { last } from "lodash";

import {
  fetchWorkflowLogsByDocId,
  saveWorkflowLog,
} from "./api";

import { ACTION_TYPES } from "./actions";

export function* fetchWorkflowLogsAsync({ payload }) {
  try {
    yield put({ type: ACTION_TYPES.WORKFLOW_LOGS_REQUEST_STARTED });

    const { response } = yield call(fetchWorkflowLogsByDocId, payload);
    yield put({ type: ACTION_TYPES.SET_WORKFLOW_LOGS, payload: response });

    const lastWorkflowLog = last(response);
    yield put({
      type: ACTION_TYPES.SET_LAST_WORKFLOW_LOG,
      payload: lastWorkflowLog
    });

    yield put({ type: ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED });
  } catch (error) {
    yield put({ type: ACTION_TYPES.SET_ERROR });
    yield put({ type: ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED });
  }
}

export function* saveWorkflowLogAsync({ payload }) {
  try {
    yield __returnWorkflowLog(payload);
  } catch (error) {
    yield put({ type: ACTION_TYPES.SET_ERROR });
  }
}

export function* __returnWorkflowLog(payload) {
  yield put({ type: ACTION_TYPES.WORKFLOW_LOGS_REQUEST_STARTED });

  const { response: savedWorkflowLog } = yield call(saveWorkflowLog, payload);
  yield put({ type: ACTION_TYPES.SET_LAST_WORKFLOW_LOG, payload: savedWorkflowLog });

  const { response: workflowLogs } = yield call(fetchWorkflowLogsByDocId, payload.docId);
  yield put({ type: ACTION_TYPES.SET_WORKFLOW_LOGS, payload: workflowLogs });

  yield put({ type: ACTION_TYPES.WORKFLOW_LOGS_REQUEST_FINISHED });
}
