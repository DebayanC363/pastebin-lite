const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ===============================
// In-memory store (PDF-allowed)
// ===============================
const pastes = new Map();

// ===============================
// TEST_MODE time helper (PDF)
// ===============================
function getNow(req) {
    if (process.env.TEST_MODE === "1") {
        const headerNow = req.headers["x-test-now-ms"];
        if (headerNow !== undefined) {
            return Number(headerNow);
        }
    }
    return Date.now();
}

// ===============================
// ROOT ROUTE (Vercel/browser)
// ===============================
app.get("/", (req, res) => {
    res.status(200).send("Pastebin Lite API is running");
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/healthz", (req, res) => {
    res.status(200).json({ ok: true });
});

// ===============================
// CREATE PASTE
// ===============================
app.post("/api/pastes", (req, res) => {
    const { content, ttl_seconds, max_views } = req.body;

    if (typeof content !== "string" || content.length === 0) {
        return res.status(400).json({ error: "Invalid content" });
    }

    const id = crypto.randomUUID();
    const now = getNow(req);

    const expiresAt =
        typeof ttl_seconds === "number" ? now + ttl_seconds * 1000 : null;

    pastes.set(id, {
        content,
        expiresAt,
        remainingViews:
            typeof max_views === "number" ? max_views : null,
    });

    res.json({
        id,
        url: `/p/${id}`,
    });
});

// ===============================
// GET PASTE (API)
// ===============================
app.get("/api/pastes/:id", (req, res) => {
    const { id } = req.params;
    const paste = pastes.get(id);

    if (!paste) {
        return res.status(404).json({ error: "Paste not found" });
    }

    const now = getNow(req);

    if (paste.expiresAt && now > paste.expiresAt) {
        pastes.delete(id);
        return res.status(404).json({ error: "Paste not found" });
    }

    if (paste.remainingViews !== null) {
        if (paste.remainingViews <= 0) {
            pastes.delete(id);
            return res.status(404).json({ error: "Paste not found" });
        }
        paste.remainingViews -= 1;
    }

    res.json({
        content: paste.content,
        remaining_views: paste.remainingViews,
    });
});

// ===============================
// GET PASTE (HTML VIEW)
// ===============================
app.get("/p/:id", (req, res) => {
    const { id } = req.params;
    const paste = pastes.get(id);

    if (!paste) {
        return res.status(404).send("Paste not found");
    }

    const now = getNow(req);

    if (paste.expiresAt && now > paste.expiresAt) {
        pastes.delete(id);
        return res.status(404).send("Paste not found");
    }

    if (paste.remainingViews !== null) {
        if (paste.remainingViews <= 0) {
            pastes.delete(id);
            return res.status(404).send("Paste not found");
        }
        paste.remainingViews -= 1;
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(
        `<html><body><pre>${paste.content.replace(/</g, "&lt;")}</pre></body></html>`
    );
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
