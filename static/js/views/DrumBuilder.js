import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Drum Builder");
    this.viewPath = "/constructor/drums";
  }
}