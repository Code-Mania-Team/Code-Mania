import { JSDOM, VirtualConsole } from "jsdom";

const MAX_EXECUTION_TIME = 1500;

function splitUserSubmission(raw) {
  const text = String(raw ?? "");

  const hasScriptTag = /<\s*script\b/i.test(text);
  const looksLikeHtml = /<\s*\/?\s*[a-zA-Z][\s>]/.test(text);

  // Back-compat: if it's plain JS, run it as-is.
  if (!hasScriptTag && !looksLikeHtml) {
    return { user_html: "", user_code: text };
  }

  // Treat as HTML and extract inline <script> contents.
  const tmp = new JSDOM(text, { runScripts: "outside-only" });
  const doc = tmp.window.document;

  const scripts = Array.from(doc.querySelectorAll("script"));
  const user_code = scripts.map((s) => s.textContent || "").join("\n").trim();
  scripts.forEach((s) => s.remove());

  const user_html = (doc.body ? doc.body.innerHTML : "").trim();

  try {
    tmp.window.close();
  } catch {
    // ignore
  }

  return { user_html, user_code };
}

(async () => {
  try {

    /* ===============================
       READ STDIN PAYLOAD
    =============================== */

    let input = "";

    for await (const chunk of process.stdin) {
      input += chunk;
    }

    if (!input.trim()) {
      console.log(JSON.stringify({ error: "Empty payload" }));
      process.exit(0);
    }

    const { base_html = "", user_code = "", validation = {} } =
      JSON.parse(input);

    const submission = splitUserSubmission(user_code);
    const effective_user_code = submission.user_code;
    const effective_user_html = submission.user_html;

    /* ===============================
       BUILD DOM
    =============================== */

    const virtualConsole = new VirtualConsole();

    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          ${base_html}
          ${effective_user_html}
          <script>
            try {
              ${effective_user_code}
            } catch(e){}
          </script>
        </body>
      </html>
    `, {
      runScripts: "dangerously",
      virtualConsole
    });

    await new Promise(resolve =>
      setTimeout(resolve, MAX_EXECUTION_TIME)
    );

    const document = dom.window.document;

    /* ===============================
       VALIDATION ENGINE
    =============================== */

    const results = {};
    let passedAll = true;

    const objectives = validation.objectives || [];

    for (const obj of objectives) {
      let passed = false;

      switch (obj.type) {

        /* ===============================
           LESSON 1 — CODE CHECK
        =============================== */
        case "code_contains":
          passed = effective_user_code.includes(obj.value);
          break;

        /* ===============================
           ELEMENT EXISTS
        =============================== */
        case "exists":
          passed = !!document.querySelector(obj.selector);
          break;

        /* ===============================
           LESSON 2 — TEXT CHANGE
        =============================== */
        case "textContent": {
          const el = document.querySelector(obj.selector);
          passed =
            el?.textContent?.trim() === obj.expected?.trim();
          break;
        }

        /* ===============================
           LESSON 3 — CLASS ADDED
        =============================== */
        case "classContains": {
          const el = document.querySelector(obj.selector);
          passed =
            el?.classList.contains(obj.className);
          break;
        }

        /* ===============================
           LESSON 4 — COUNT ELEMENTS
        =============================== */
        case "count":
          passed =
            document.querySelectorAll(obj.selector).length === obj.expected;
          break;

        default:
          passed = false;
      }

      results[obj.id] = {
        label: obj.label,
        passed
      };

      if (!passed) passedAll = false;
    }

    /* ===============================
       RETURN RESULT
    =============================== */

    console.log(JSON.stringify({
      objectives: results,
      passed: passedAll
    }));

    process.exit(0);

  } catch (err) {
    console.log(JSON.stringify({
      error: err.message
    }));
    process.exit(0);
  }
})();
