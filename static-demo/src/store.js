import { useEffect, useReducer } from "react";
import * as db from "./db";

let state = db.loadState();
const listeners = new Set();

export function useDb() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => listeners.delete(force);
  }, []);
  return state;
}

/** 执行一个 db 操作后通知所有组件刷新 */
export function act(fn, ...args) {
  const result = fn(state, ...args);
  listeners.forEach((l) => l());
  return result;
}

export function dbState() {
  return state;
}
