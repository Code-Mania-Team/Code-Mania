import crypto from "crypto";
import axios from "axios";

class DomSessionService {
  constructor() {
    this.sessions = new Map();
    this.TTL = 1000 * 60 * 30; // 30 minutes
    this.startCleanup();
  }

  /* ===============================
     CREATE SESSION
  =============================== */
  async createSession({ userId, questId, baseHtml }) {
    if (!questId || !baseHtml) {
      return { ok: false, status: 400, message: "Missing required fields" };
    }

    const id = crypto.randomBytes(32).toString("hex");

    this.sessions.set(id, {
      id,
      userId,
      questId,
      baseHtml,
      userCode: "",
      createdAt: Date.now()
    });

    return {
      ok: true,
      data: {
        sessionId: id,
        sandboxUrl: `https://api.codemania.fun/v1/dom/sandbox/${id}`
      }
    };
  }

  /* ===============================
     UPDATE CODE
  =============================== */
  async updateSession({ sessionId, userId, code }) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { ok: false, status: 404, message: "Session not found" };
    }

    if (String(session.userId) !== String(userId)) {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    session.userCode = code;

    return { ok: true };
  }

  async validateSession({ sessionId, userId, requirements }) {
    const session = this.sessions.get(sessionId);
    console.log("NIGAGAGAGA",session);
    console.log(userId);

    if (!session) {
        return { ok: false, status: 404, message: "Session not found" };
    }

    if (String(session.userId) !== String(userId)) {
        return { ok: false, status: 403, message: "Forbidden" };
    }

    /* ===============================
        Example Validation Rules
        (Later load from DB)
    =============================== */

    const validationRules = requirements;
    console.log(validationRules);

    /* ===============================
        CALL DOCKER SERVER
    =============================== */

    const { data } = await axios.post(
        "https://terminal.codemania.fun/dom/run",
        {
        base_html: session.baseHtml,
        user_code: session.userCode,
        validation: validationRules
        },
        {
        headers: {
            "x-internal-key": process.env.INTERNAL_KEY
        }
        }
    );

    return {
        ok: true,
        data
    };
    }

  /* ===============================
     GET SESSION
  =============================== */
  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { ok: false, status: 404, message: "Session not found" };
    }

    return { ok: true, data: session };
  }

  /* ===============================
     DELETE SESSION
  =============================== */
  async deleteSession({ sessionId, userId }) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { ok: false, status: 404, message: "Session not found" };
    }

    if (String(session.userId) !== String(userId)) {
      return { ok: false, status: 403, message: "Forbidden" };
    }

    this.sessions.delete(sessionId);

    return { ok: true };
  }

  /* ===============================
     AUTO CLEANUP
  =============================== */
  startCleanup() {
    setInterval(() => {
      const now = Date.now();

      for (const [id, session] of this.sessions.entries()) {
        if (now - session.createdAt > this.TTL) {
          this.sessions.delete(id);
        }
      }
    }, 60000);
  }
}

export default DomSessionService;