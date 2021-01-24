export default class {
  constructor() {

  }

  setTitle(title) {
    document.title = title;
  }

  async getHTML() {
    let rendered = "";
    await new Promise((resolve) => {
      $.ajax(this.viewPath,
        {
          type: "POST",
          success: (res) => {
            rendered = res;
            resolve();
          }
        }
      );
    });

    return rendered;
  }
}