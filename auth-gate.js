import express from "express";
import cookieParser from "cookie-parser";

const app = express();

const ACCESS_CODE = process.env.ACCESS_CODE;

// TODO: rotate w/ key-ring
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const COOKIE_NAME = "forgejo_gate_v1";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

app.set("trust proxy", 1);
app.use(cookieParser(COOKIE_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const cookieState = req.signedCookies[COOKIE_NAME] ? "signed" : "none";
    console.log(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms) cookie:${cookieState}`,
    );
  });
  next();
});

app.get("/healthz", (_req, res) => res.send("ok"));

const normalizeReturnTo = (val) => {
  if (!val || typeof val !== "string") return "/";
  try {
    // Only allow absolute paths, strip host if provided.
    const u = new URL(val, "http://example");
    const path = u.pathname + (u.search || "") + (u.hash || "");
    return path && path.startsWith("/") ? path : "/";
  } catch (_e) {
    return "/";
  }
};

const renderForm = (withError, returnTo = "/") => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Enter Access Code</title>
  <style>
    html { font-family: "Source Serif Pro", serif; }
    input,
    button,
    textarea,
    select {
      font-family: inherit;
    }
    body { max-width: 320px; margin: 60px auto; padding: 16px; color: #111; }
    h1 { font-size: 20px; margin-bottom: 12px; }
    form { display: flex; flex-direction: column; gap: 10px; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-wrap input[type="password"], .input-wrap input[type="text"] { flex: 1; padding: 10px 38px 10px 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; }
    .toggle-btn { position: absolute; right: 8px; background: none; border: none; cursor: pointer; font-size: 12px; color: #555; outline: none; }
    .toggle-btn:focus { outline: 1px dotted #888; }
    button { padding: 10px; font-size: 16px; border: none; border-radius: 6px; background: #111; color: #fff; cursor: pointer; }
    button:hover { background: #333; }
    .err { color: #b00; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Enter Access Code</h1>
  <form method="POST" action="/auth">
    <div class="input-wrap">
      <input
        id="code"
        type="text"
        name="code"
        placeholder="Access code"
        required
      />
    </div>
    <input type="hidden" name="return_to" value="${returnTo}" />
    <label style="display:flex;align-items:center;gap:8px;font-size:14px;">
      <input type="checkbox" name="remember" value="1" />
      <span>Remember me for 7 days</span>
    </label>
    <button type="submit">Continue</button>
    ${withError ? '<div class="err">Invalid code.</div>' : ""}
  </form>
</body>
</html>`;

app.get("/", (req, res) => {
  const returnTo = normalizeReturnTo(req.query.return_to);
  const signed = req.signedCookies[COOKIE_NAME];
  if (signed === "ok") {
    return res.sendStatus(204);
  }
  return res.status(401).send(renderForm(false, returnTo));
});

// Expose the form directly if someone visits /auth.
app.get("/auth", (req, res) => {
  const returnTo = normalizeReturnTo(req.query.return_to);
  return res.status(401).send(renderForm(false, returnTo));
});

app.post("/auth", (req, res) => {
  const returnTo = normalizeReturnTo(req.body.return_to);
  const remember = req.body.remember === "1";
  if (req.body.code !== ACCESS_CODE) {
    return res.status(401).send(renderForm(true, returnTo));
  }
  res.cookie(COOKIE_NAME, "ok", {
    httpOnly: true,
    // Behind Cloudflare/Caddy the client is always HTTPS; force Secure so the cookie sticks.
    secure: true,
    sameSite: "lax",
    signed: true,
    ...(remember ? { maxAge: COOKIE_MAX_AGE } : {}),
  });
  return res.redirect(302, returnTo && returnTo !== "/" ? returnTo : "/");
});

app.use((_req, res) => res.sendStatus(404));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Auth gate listening on ${port}`);
});
