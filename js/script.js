const SPECIAL_FUNCTIONS = [
  "√",
  "sqrt",
  "π",
  "PI",
  "sin",
  "asin",
  "cos",
  "acos",
  "tan",
  "atan",
  "log",
  "pow",
  "e",
  "!",
  "%",
  "÷",
];

const REPLACEMENTS = {
  "√": "sqrt",
  π: "PI",
  ",": ".",
  "×": "*",
  "÷": "/",
};

const VALID_EXPRESSION_REGEX = new RegExp(
  `^([+\\-*/^(),!]|(?:\\d+(?:\\[.|,]\\d+)?|\\[.|,]\\d+)|${SPECIAL_FUNCTIONS.join("|")})+$`
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
      const data = event.clipboardData?.getData("text");
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
    // JSON representation locally or plain HTML string?
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
   * @param {string | number} value
   * @returns {string}
   */
  updateDisplay(value) {
    return (this.ui.display.innerHTML = "" + value);
  }

  /**
   * @param {string} expression
   */
  prepareExpression(expression) {
    for (const [key, value] of Object.entries(REPLACEMENTS)) {
      expression = expression.replace(new RegExp(key, "g"), value);
    }
    return expression;
  }

  /**
   * @param {string} expression
   */
  validateExpression(expression) {
    return VALID_EXPRESSION_REGEX.test(expression);
  }

  /**
   * @returns {number}
   * @throws {Error} if expression is invalid
   */
  calculateExpression() {
    if (!this.validateExpression(this.ui.display.innerHTML)) {
      throw new Error("Invalid expression");
    }
    return math.evaluate(this.prepareExpression(this.ui.display.innerHTML));
  }

  historyItemClickHandler(e) {
    if (!e.target.classList.contains("calculator-history-item")) return;
    this.ui.display.innerHTML = e.target.innerText;
    navigator.clipboard.writeText(e.target.innerText);
  }
}

new Calculator().init();
