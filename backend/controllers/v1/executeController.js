import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ExecuteController {
    constructor() {
        this.baseDir = path.join(__dirname, "../../tmp");
        if (!fs.existsSync(this.baseDir)) fs.mkdirSync(this.baseDir, { recursive: true });
    }

    getLanguageConfig(language) {
        switch (language) {
            case "python":
                return { fileName: "main.py", runCmd: "python3 /usr/src/app/main.py", dockerImage: "python:3.12-alpine" };
            case "javascript":
                return { fileName: "main.js", runCmd: "node /usr/src/app/main.js", dockerImage: "node:20-alpine" };
            case "cpp":
                return { 
                    fileName: "main.cpp",
                    runCmd: "sh -c 'g++ /usr/src/app/main.cpp -o /usr/src/app/main && /usr/src/app/main'",
                    dockerImage: "gcc:12-alpine"
                };
            default:
                return null;
        }
    }

    async execute(req, res) {
        const { code, language } = req.body || {};
        if (!code || !language) return res.json({ success: false, message: "Code and language are required" });

        const lang = this.getLanguageConfig(language);
        if (!lang) return res.json({ success: false, message: "Unsupported language" });

        // Create temp folder for this request
        const tempDir = path.join(this.baseDir, `tmp_${Date.now()}`);
        fs.mkdirSync(tempDir);

        // Write code to file
        const filePath = path.join(tempDir, lang.fileName);
        fs.writeFileSync(filePath, code);

        const absTempDir = path.resolve(tempDir);

        // Build Docker command
        const dockerCmd = `docker run --rm --network none --cpus="0.5" --memory="256m" -v ${absTempDir}:/usr/src/app ${lang.dockerImage} ${lang.runCmd}`;

        // Execute Docker
        exec(dockerCmd, { timeout: 5000 }, (err, stdout, stderr) => {
            // Clean up temp folder
            fs.rmSync(tempDir, { recursive: true, force: true });

            res.json({
                success: !err,
                output: stdout.trim(),
                error: stderr.trim()
            });
        });
    }
}

export default ExecuteController;
