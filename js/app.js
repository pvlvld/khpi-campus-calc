import {Calculator} from "./calculator.js";
import {Converter} from "./converter.js";

export class App {
  constructor() {
    this.calculator = new Calculator();
    this.converter = new Converter();
    /**
     * @type {"Calculator" | "Converter"}
     */
    this.activeTab = "Calculator";

    this.ui = {
      sidebar: /** @type {HTMLElement} */ (document.getElementById("sidebar")),
      sidebarButton: /** @type {HTMLElement} */ (
        document.getElementById("sidebar-toggle")
      ),
      toggleSidebar: () => {
        this.ui.sidebar.classList.toggle("active");

        // На десктопі — розширяємо трохи вправо
        if (window.innerWidth > 768) {
          if (this.ui.sidebar?.classList.contains("active")) {
            this.ui.sidebar.style.width = "10rem";
          } else {
            this.ui.sidebar ? (this.ui.sidebar.style.width = "") : null;
          }
        }
      }
    };
  }

  init() {
    this.calculator.init();
    this.converter.init();
    this.calculator.clearDisplay();

    // UI
    // Sidebar
    this.ui.sidebarButton.addEventListener("click", () =>
      this.ui.toggleSidebar()
    );

    // Sidebar close on click outside
    document.addEventListener("click", (e) => {
      if (
        e.target instanceof Node &&
        this.ui.sidebarButton &&
        this.ui.sidebar &&
        !this.ui.sidebar?.contains(e.target) &&
        !this.ui.sidebarButton.contains(e.target)
      ) {
        this.ui.sidebar.classList.remove("active");
        this.ui.sidebar.style.width = "";
      }
      // at least i tried
      e.preventDefault();
      e.stopPropagation();
    });

    // Switch between calculator and converter
    const modeButtons = document.querySelectorAll(".mode-button");
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLButtonElement)) return;
        if (target.innerText !== this.activeTab) {
          //@ts-expect-error
          this.switchScreen(target.innerText);
          modeButtons.forEach((b) => b.classList.remove("active"));
          target.classList.add("active");
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (this.activeTab === "Calculator") {
        if (e.key === "Escape") {
          return this.ui.toggleSidebar();
        }
        this.calculator.handleKeyPress(e);
      } else {
        this.converter.ui.input.focus();
      }
    });

    this.setupHistMemButton();
  }

  setupHistMemButton() {
    document.getElementById("open-journal")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const histMem = document.getElementById("hist-mem");
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        histMem?.classList.toggle("active");
      } else {
        this.calculator.switchTab("history");
      }
    });
  }

  toggleMobileButtons() {
    const container = document.getElementById("mobile-only-buttons");
    if (!container) return;
    if (this.activeTab === "Calculator") {
      container.innerHTML = `
          <button id="open-journal">History / Memory</button>
        `;
      this.setupHistMemButton();
    } else {
      container.innerHTML = "";
    }
  }

  /**
   *
   * @param {"Calculator" | "Converter"} tab
   */
  switchScreen(tab) {
    const conv = /** @type {HTMLElement} */ (
      document.getElementById("converter")
    );
    const calc = /** @type {HTMLElement} */ (
      document.getElementById("calculator")
    );
    if (tab === "Converter") {
      conv.style.display = "block";
      calc.style.display = "none";
    } else {
      conv.style.display = "none";
      calc.style.display = "flex";
    }
    this.activeTab = tab;
    this.toggleMobileButtons();
  }
}
