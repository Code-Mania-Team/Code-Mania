import DomSessionService from "../../services/domSessionServices.js";
import ExerciseModel from "../../models/exercises.js";

function splitUserSubmission(raw) {
  const text = String(raw ?? "");
  const hasScriptTag = /<\s*script\b/i.test(text);
  const looksLikeHtml = /<\s*\/?\s*[a-zA-Z][\s>]/.test(text);

  // Back-compat: plain JS only.
  if (!hasScriptTag && !looksLikeHtml) {
    return { userHtml: "", userJs: text };
  }

  const scripts = [];
  const scriptRe = /<\s*script\b[^>]*>([\s\S]*?)<\s*\/\s*script\s*>/gi;
  const withoutScripts = text.replace(scriptRe, (_m, code) => {
    scripts.push(String(code ?? ""));
    return "";
  });

  const bodyMatch = /<\s*body\b[^>]*>([\s\S]*?)<\s*\/\s*body\s*>/i.exec(withoutScripts);
  const userHtml = (bodyMatch ? bodyMatch[1] : withoutScripts).trim();
  const userJs = scripts.join("\n").trim();

  return { userHtml, userJs };
}

class DomController {
  constructor() {
    this.domService = new DomSessionService();
    this.exerciseModel = new ExerciseModel();
  }

  async createSession(req, res) {
    try {
      const userId = res.locals.user_id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }

      const { questId } = req.body;

      const quest = await this.exerciseModel.getExerciseById(questId);
      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Quest not found"
        });
      }

      if (quest.quest_type !== "dom") {
        return res.status(400).json({
          success: false,
          message: "Quest is not a DOM challenge"
        });
      }

      let parsedRequirements = quest.requirements;
      if (typeof quest.requirements === "string") {
        try {
          parsedRequirements = JSON.parse(quest.requirements);
        } catch {
          return res.status(400).json({
            success: false,
            message: "Quest has invalid validation config"
          });
        }
      }

      if (!quest.base_html || !parsedRequirements) {
        return res.status(400).json({
          success: false,
          message: "Quest is missing DOM validation config"
        });
      }

      const result = await this.domService.createSession({
        userId,
        questId,
        baseHtml: quest.base_html,
        requirements: parsedRequirements
      });

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          message: result.message
        });
      }

      return res.status(201).json({
        success: true,
        data: result.data
      });

    } catch (err) {
      console.error("createSession error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to create DOM session"
      });
    }
  }

  async validateSession(req, res) {
    try {
      const userId = res.locals.user_id;
      const sessionId = req.params.sessionId;
      const result = await this.domService.validateSession({
        sessionId,
        userId
      });

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });

    } catch (err) {
      console.error("validateSession error:", err);
      return res.status(500).json({
        success: false,
        message: "Validation failed"
      });
    }
  }

  async updateSession(req, res) {
    try {
      const userId = res.locals.user_id;
      const sessionId = req.params.sessionId;
      const { code } = req.body;

      const result = await this.domService.updateSession({
        sessionId,
        userId,
        code
      });

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error("updateSession error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update DOM session"
      });
    }
  }

  async serveSandbox(req, res) {
    try {
      const sessionId = req.params.sessionId;

      const result = await this.domService.getSession(sessionId);

      if (!result.ok) {
        return res.status(result.status).send(result.message);
      }

      const session = result.data;

      const { userHtml, userJs } = splitUserSubmission(session.userCode);
      const mergedBase = typeof session.userCode === "string" && session.userCode.includes("CODEMANIA_BASE_INCLUDED");
      const baseHtml = mergedBase ? "" : session.baseHtml;

      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
          content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline';">
        <style>
          body { font-family: sans-serif; padding: 16px; }
        </style>
      </head>
      <body>
        ${baseHtml}
        ${userHtml}

        <script>
          try {
            ${userJs}
          } catch (err) {
            const pre = document.createElement("pre");
            pre.style.color = "red";
            pre.textContent = err.toString();
            document.body.appendChild(pre);
          }
        <\/script>
      </body>
      </html>
      `;

      res.setHeader("Content-Type", "text/html");
      return res.send(html);

    } catch (err) {
      console.error("serveSandbox error:", err);
      return res.status(500).send("Server error");
    }
  }

  async deleteSession(req, res) {
    try {
      const userId = res.locals.user_id;
      const sessionId = req.params.sessionId;

      const result = await this.domService.deleteSession({
        sessionId,
        userId
      });

      if (!result.ok) {
        return res.status(result.status).json({
          success: false,
          message: result.message
        });
      }

      return res.status(200).json({ success: true });

    } catch (err) {
      console.error("deleteSession error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete session"
      });
    }
  }
}

export default DomController;
