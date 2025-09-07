class HomeController {
  constructor() {
    this.__controllerName = 'Home';
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
      'message': 'V1 API is App and Running!',
      'controller': this.__controllerName,
    });
    res.end();
  }
}

export default HomeController;