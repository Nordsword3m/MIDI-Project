import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Bass Builder");
    this.viewPath = "/bass";
  }
}