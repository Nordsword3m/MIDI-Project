import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Arranger");
    this.viewPath = "/arranger";
  }
}