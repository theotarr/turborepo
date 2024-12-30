import * as SecureStore from "expo-secure-store";

const key = "session_token";
const HABITS_KEY = "habits";
const MEMORY_KEY = "memory";
const FOCUS_KEY = "focus";
const GRADES_KEY = "grades";

export const getToken = () => SecureStore.getItem(key);
export const deleteToken = () => SecureStore.deleteItemAsync(key);
export const setToken = (v: string) => SecureStore.setItem(key, v);
