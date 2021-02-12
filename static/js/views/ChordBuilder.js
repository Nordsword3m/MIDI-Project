import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
  constructor() {
    super();
    this.setTitle("Chord Builder");
    this.viewPath = "/constructor/chords";
  }
}