import express from "express";
import DomController from "../../controllers/v1/domSessionController.js";
import { authentication } from "../../middlewares/authentication.js";

const domRouter = express.Router();
const dom = new DomController();

domRouter.get("/sandbox/:sessionId", dom.serveSandbox.bind(dom));
domRouter.post("/session", authentication, dom.createSession.bind(dom));
domRouter.post("/session/:sessionId", authentication, dom.updateSession.bind(dom));
domRouter.delete("/session/:sessionId", authentication, dom.deleteSession.bind(dom));


export default domRouter;