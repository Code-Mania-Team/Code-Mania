import DomSessionService from "../../services/domSessionServices.js";

class DomController {
  constructor() {
    this.domService = new DomSessionService();
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

      const { questId, baseHtml } = req.body;

      const result = await this.domService.createSession({
        userId,
        questId,
        baseHtml
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
      const { requirements } = req.body;

      const result = await this.domService.validateSession({
        sessionId,
        userId, 
        requirements
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
        ${session.baseHtml}

        <script>
          try {
            ${session.userCode}
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
