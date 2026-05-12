const anonymousIdKey = "raphs.anonymous_id";
const sessionKey = "raphs.session";
const anonymousCookieName = "raphs_anonymous_id";
const sessionTimeoutMs = 30 * 60 * 1000;

type SessionRecord = {
  id: string;
  lastSeenAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function createId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function readCookie(name: string) {
  if (!isBrowser()) {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

function writeCookie(name: string, value: string) {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

function readLocalStorage(key: string) {
  try {
    return isBrowser() ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private modes. Cookie fallback still helps.
  }
}

function readSessionStorage(key: string) {
  try {
    return isBrowser() ? window.sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeSessionStorage(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Session storage can be unavailable; callers will generate a fresh in-memory-ish value next time.
  }
}

export function getAnonymousId() {
  const storedId = readLocalStorage(anonymousIdKey) ?? readCookie(anonymousCookieName);

  if (storedId) {
    writeLocalStorage(anonymousIdKey, storedId);
    writeCookie(anonymousCookieName, storedId);
    return storedId;
  }

  const anonymousId = createId("anon");
  writeLocalStorage(anonymousIdKey, anonymousId);
  writeCookie(anonymousCookieName, anonymousId);

  return anonymousId;
}

export function getSessionId() {
  const now = Date.now();
  const storedSession = readSessionStorage(sessionKey);
  let sessionRecord: SessionRecord | null = null;

  if (storedSession) {
    try {
      sessionRecord = JSON.parse(storedSession) as SessionRecord;
    } catch {
      sessionRecord = null;
    }
  }

  if (!sessionRecord?.id || now - sessionRecord.lastSeenAt > sessionTimeoutMs) {
    sessionRecord = {
      id: createId("sess"),
      lastSeenAt: now,
    };
  } else {
    sessionRecord.lastSeenAt = now;
  }

  writeSessionStorage(sessionKey, JSON.stringify(sessionRecord));

  return sessionRecord.id;
}
