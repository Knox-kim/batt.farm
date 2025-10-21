// Landing Page Script
class LandingPage {
  constructor() {
    console.log("LandingPage constructor called");
    this.modalOverlay = document.getElementById("modalOverlay");
    this.modalClose = document.getElementById("modalClose");
    console.log("modalOverlay:", this.modalOverlay);
    console.log("modalClose:", this.modalClose);
    this.currentModal = null;
    this.cityCreator = null; // CityCreator instance
    this.init();
  }

  init() {
    this.loadDarkModePreference();
    this.setupEventListeners();
    this.addMenuAnimations();
  }

  setupEventListeners() {
    // 로고 클릭 이벤트
    const logoLink = document.getElementById("logoLink");
    if (logoLink) {
      logoLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeModal();
      });
    }

    // 메뉴 아이템 클릭 이벤트
    const menuItems = document.querySelectorAll(".menu-item");
    console.log("Found menu items:", menuItems.length);
    menuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const menu = item.getAttribute("data-menu");
        console.log("Menu clicked:", menu);
        this.openModal(menu);
      });
    });

    // 모달 닫기 버튼
    if (this.modalClose) {
      this.modalClose.addEventListener("click", () => {
        this.closeModal();
      });
    }

    // 오버레이 클릭 시 닫기
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener("click", (e) => {
        if (e.target === this.modalOverlay) {
          this.closeModal();
        }
      });
    }

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentModal) {
        this.closeModal();
      }
    });
  }

  openModal(menu) {
    console.log("Opening modal for:", menu);

    // Handle Mode toggle separately
    if (menu === "Mode") {
      this.toggleDarkMode();
      return;
    }

    const modalMap = {
      farm: "farmModal",
      "Pre-Deposit": "preDepositModal",
      Info: "infoModal"
    };

    const modalId = modalMap[menu];
    console.log("Modal ID:", modalId);
    if (!modalId) {
      console.log("No modal ID found");
      return;
    }

    // 모든 모달 숨기기
    document.querySelectorAll(".modal-page").forEach((modal) => {
      modal.style.display = "none";
    });

    // 선택한 모달 표시
    const modal = document.getElementById(modalId);
    console.log("Modal element found:", modal);
    if (modal) {
      modal.style.display = "block";
      this.currentModal = modalId;

      // 모달 오버레이 표시
      this.modalOverlay.style.display = "flex";
      console.log("Modal overlay displayed");
      // 애니메이션을 위해 약간의 지연
      setTimeout(() => {
        this.modalOverlay.classList.add("active");
      }, 10);

      // Farm 모달인 경우 CityCreator 초기화
      if (menu === "farm" && !this.cityCreator) {
        // CityCreator가 전역으로 정의되어 있는지 확인
        if (typeof CityCreator !== "undefined") {
          console.log("Initializing CityCreator");
          this.cityCreator = new CityCreator();
        } else {
          console.log("CityCreator class not found");
        }
      }
    } else {
      console.log("Modal element not found for ID:", modalId);
    }
  }

  closeModal() {
    this.modalOverlay.classList.remove("active");

    // 애니메이션이 끝난 후 숨기기
    setTimeout(() => {
      this.modalOverlay.style.display = "none";
      this.currentModal = null;
    }, 300);
  }

  addMenuAnimations() {
    const menuItems = document.querySelectorAll(".menu-item");

    menuItems.forEach((item, index) => {
      // 페이지 로드 시 순차적으로 나타나는 애니메이션
      item.style.opacity = "0";
      item.style.transform = "translateY(20px)";

      setTimeout(() => {
        item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, 100 + index * 100);
    });
  }

  toggleDarkMode() {
    const body = document.body;
    const isDarkMode = body.classList.toggle("dark-mode");

    // Update Mode button icon
    const modeButton = document.querySelector('[data-menu="Mode"]');
    if (modeButton) {
      const modeIcon = modeButton.querySelector(".menu-icon img");
      if (modeIcon) {
        modeIcon.src = isDarkMode ? "images/menu33.svg" : "images/menu3.svg";
      }

      // Update label text
      const modeLabel = modeButton.querySelector(".menu-label");
      if (modeLabel) {
        modeLabel.textContent = isDarkMode ? "Dark Mode" : "Light Mode";
      }
    }

    // Update celestial body (sun/moon)
    const celestialBody = document.getElementById("celestialBody");
    if (celestialBody) {
      celestialBody.src = isDarkMode ? "images/img-moon.png" : "images/img-sun.png";
      celestialBody.alt = isDarkMode ? "Moon" : "Sun";
    }

    // Store preference in localStorage
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
    console.log("Dark mode:", isDarkMode ? "enabled" : "disabled");
  }

  loadDarkModePreference() {
    const darkMode = localStorage.getItem("darkMode");
    if (darkMode === "enabled") {
      document.body.classList.add("dark-mode");

      // Update Mode button icon and label
      const modeButton = document.querySelector('[data-menu="Mode"]');
      if (modeButton) {
        const modeIcon = modeButton.querySelector(".menu-icon img");
        if (modeIcon) {
          modeIcon.src = "images/menu33.svg";
        }

        const modeLabel = modeButton.querySelector(".menu-label");
        if (modeLabel) {
          modeLabel.textContent = "Dark Mode";
        }
      }

      // Update celestial body to moon
      const celestialBody = document.getElementById("celestialBody");
      if (celestialBody) {
        celestialBody.src = "images/img-moon.png";
        celestialBody.alt = "Moon";
      }
    }
  }
}

// Initialize landing page when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing Landing Page");
  try {
    window.landingPage = new LandingPage();
    console.log("Landing Page initialized successfully");
  } catch (error) {
    console.error("Error initializing Landing Page:", error);
  }
});
