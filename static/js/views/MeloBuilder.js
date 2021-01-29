import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Melo Builder");
    this.viewPath = "/melo";
  }
}