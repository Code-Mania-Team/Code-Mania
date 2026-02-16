import FreedomWall from "../../models/freedomWall.js";
class HomeController {
  constructor() {
    this.__controllerName = "Home";
    this.freedomWall = new FreedomWall();
  }
  /**
   * Index action for our home page
   *
   * @param {import('express').Request} req Request
   * @param {import('express').Response} res Response
   * @returns {void}
   */
  indexAction(req, res) {
    res.json({
      message: "V1 API is App and Running!",
      controller: this.__controllerName,
    });
    res.end();
  }
  async getAllPost(req, res) {
    try {
      const result = await this.freedomWall.getPost();
      res.send({
        success: true,
        message: "Freedom Wall posts fetched successfully",
        result,
      });
    } catch (err) {
      res.send({
        success: true,
        message: err.toString(),
      });
    }
  }
}
export default HomeController;
