const SPECIAL_FUNCTIONS = {
  "√": (x) => Math.sqrt(x),
  sin: (x) => Math.sin(x),
  asin: (x) => Math.asin(x),
  cos: (x) => Math.cos(x),
  acos: (x) => Math.acos(x),
  tan: (x) => Math.tan(x),
  atan: (x) => Math.atan(x),
  log: (x) => Math.log(x),
  pow: (x, y) => Math.pow(x, y),
  π: () => Math.PI,
  e: () => Math.E,
  "!": (x) => {
    let result = 1;
    for (let i = 1; i <= Math.abs(x); i++) {
      result *= i;
    }
    return result;
  },
  exp: (x) => Math.exp(x),
};

const functionNames = Object.keys(SPECIAL_FUNCTIONS)
  .map((fn) => fn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),!]|(?:\\d+(?:\\.\\d+)?|\\.\\d+)|${functionNames})+$`
);

class Calculator {
  constructor(name = "race00_vpavlenko_dmykhailov") {
    this.currentInput = "";
    /**
     * @type {"standart" | "scientific" | "volume" |
     * "length" | "weight" | "temperature" | "area"}
     */
    this.cutrrentLayout = "standart";
    this.name = name;
    this.ui = {
      display: /** @type {HTMLElement} */ (document.getElementById("display")),
      history: /** @type {HTMLElement} */ (document.getElementById("history")),
      buttons: document.querySelectorAll("button"),

      templates: {
        historyItem: document.createElement("div"),
      },
    };
    this.clipboard = {
      user: navigator.clipboard,
      local: "",
      permissions: {
        read: false,
        write: false,
      },
    };
    this.clipboard.user
      .readText()
      .then((text) => {
        this.clipboard.local = text;
        this.clipboard.permissions.read = true;
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });
    this.clipboard.user
      .writeText(this.clipboard.local)
      .then(() => {
        this.clipboard.permissions.write = true;
      })
      .catch((err) => {
        console.error("Failed to write clipboard contents: ", err);
      });
  }

  init() {
    document.addEventListener("paste", (event) => {
      const data = event.clipboardData?.getData("text").replace(/,/g, ".");
      if (this.validateExpression(data)) this.ui.display.innerHTML = data;
    });

    document.addEventListener("keydown", (e) => {
      console.log(
        `Key: ${e.key}, Ctrl: ${e.ctrlKey}, Shift: ${e.shiftKey}, Alt: ${e.altKey}`
      );

      switch (true) {
        case e.key === "Enter":
          e.preventDefault();
          console.log(this.updateDisplay(this.calculateExpression()));
          break;
        case e.ctrlKey && e.key === "A":
        case e.ctrlKey && e.key === "a":
        case e.ctrlKey && e.key === "ф":
        case e.ctrlKey && e.key === "Ф":
          e.preventDefault();
          console.log("No :D");
          break;
        default:
          break;
      }
    });
  }

  appendHistoryItem(item) {
    const data = {history: this.ui.history.innerHTML};
    localStorage.setItem(this.name, JSON.stringify(data));
  }

  /**
   * @param {{equasion: string, result: string}} data
   * @returns {Node}
   */
  generateHistoryItem(data) {
    const item = this.ui.templates.historyItem.cloneNode();
    item.classList.add("calculator-history-item");
    item.appendChild(document.createElement("div")).innerHTML = data.equasion;
    item.appendChild(document.createElement("span")).innerHTML = data.result;
    return item;
  }

  loadHistory() {
    this.ui.history.innerHTML =
      JSON.parse(localStorage.getItem(this.name) || "{}").history || "";
  }

  clearHistory() {
    localStorage.removeItem(this.name);
    this.ui.history.innerHTML = "";
  }

  clearDisplay() {
    this.ui.display.innerHTML = "";
    this.currentInput = "";
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  updateDisplay(value) {
    return (this.ui.display.innerHTML = value);
  }

  validateExpression(expression) {
    return VALID_EXPRESSION_REGEX.test(expression);
  }

  calculateExpression() {
    if (!this.validateExpression(this.ui.display.innerHTML)) {
      throw new Error("Invalid expression");
    }
    return math.evaluate(this.ui.display.innerHTML);
  }

  historyItemClickHandler(e) {
    if (!e.target.classList.contains("calculator-history-item")) return;
    this.ui.display.innerHTML = e.target.innerText;
    navigator.clipboard.writeText(e.target.innerText);
  }
}

new Calculator().init();
