import crypto from "crypto";
import axios from "axios";

const TERMINAL_API_BASE_URL = process.env.TERMINAL_API_BASE_URL || "https://terminal.codemania.fun";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

class DomSessionService {
  constructor() {
    this.sessions = new Map();
    this.TTL = 1000 * 60 * 30; // 30 minutes
    this.startCleanup();
  }

  /* ===============================
     CREATE SESSION
  =============================== */
  async createSession({ userId, questId, baseHtml, requirements }) {
    if (!questId || !baseHtml || !requirements) {
      return { ok: false, status: 400, message: "Missing required fields" };
    }

    const id = crypto.randomBytes(32).toString("hex");

    this.sessions.set(id, {
      id,
      userId,
      questId,
      baseHtml,
      requirements,
      userCode: "",
      createdAt: Date.now()
    });

    return {
      ok: true,
      data: {
        sessionId: id,
        sandboxUrl: `${API_BASE_URL}/v1/dom/sandbox/${id}`
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

  async validateSession({ sessionId, userId }) {
    const session = this.sessions.get(sessionId);

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

    const validationRules = session.requirements;
    if (!validationRules) {
      return { ok: false, status: 400, message: "Missing validation rules" };
    }

    /* ===============================
        CALL DOCKER SERVER
    =============================== */

    const { data } = await axios.post(
        `${TERMINAL_API_BASE_URL}/dom/run`,
        {
        base_html: (typeof session.userCode === "string" && session.userCode.includes("CODEMANIA_BASE_INCLUDED"))
          ? ""
          : session.baseHtml,
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
