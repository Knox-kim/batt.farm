// City Creator - Center Anchor (accurate) + Intersection Snap + DPR Scaling
// Cell: 24px (2×), Field: 720×576 (30×24 cells), Tile: 96×48 (4×2 cells)

class CityCreator {
  constructor() {
    // ===== Geometry =====
    this.CELL = 24; // doubled
    this.FIELD_W = 18 * this.CELL; // 432 (30 * 0.6 = 18)
    this.FIELD_H = 18 * this.CELL; // 432
    this.TILE_W = 4 * this.CELL;   // 96
    this.TILE_H = 4 * this.CELL;   // 96

    this.ORIGIN_X = this.FIELD_W / 2;
    this.ORIGIN_Y = 2 * this.CELL; // 48px - exactly 2 cells for grid alignment

    // ===== Canvas (DPR scaling) =====
    this.canvas = document.getElementById("cityCanvas");
    this.ctx = this.canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.FIELD_W * dpr;
    this.canvas.height = this.FIELD_H * dpr;
    this.canvas.style.width = `${this.FIELD_W}px`;
    this.canvas.style.height = `${this.FIELD_H}px`;
    this.ctx.scale(dpr, dpr);

    // ===== State =====
    this.placedItems = [];
    this.draggedItem = null;
    this.preview = null;
    this.currentBackground = "sky";
    this.selectedItem = null; // 선택된 캔버스 아이템
    this.isDraggingCanvas = false; // 캔버스 아이템 드래그 중
    this.dragOffset = { x: 0, y: 0 }; // 드래그 시작 시 마우스와 아이템 중심 간의 오프셋
    this.contextMenuItem = null; // 컨텍스트 메뉴에서 선택된 아이템

    this.backgrounds = {
      sky: { color: "#ffffffff" },
      grass: { color: "#90c850" },
      water: { color: "#6b9fc8" },
      snow: { color: "#f0f8ff" },
      desert: { color: "#e5d3a0" },
      night: { color: "#1a2332" },
    };

    this.buildings = {
      img1: { name: "img1", color: "#d4a574", img: "images/img1.png" },
      img2: { name: "img2", color: "#c49564", img: "images/img2.png" },
      img3: { name: "img3", color: "#b88554", img: "images/img3.png" },
      img4: { name: "img4", color: "#b88554", img: "images/img4.png" },
      img5: { name: "img5", color: "#b88554", img: "images/img5.png" },
      img6: { name: "img6", color: "#b88554", img: "images/img6.png" },
      img7: { name: "img7", color: "#b88554", img: "images/img7.png" },
      img8: { name: "img8", color: "#b88554", img: "images/img8.png" },
      img9: { name: "img9", color: "#b88554", img: "images/img9.png" },
    };

    // 이미지 프리로드
    this.images = {};
    Object.keys(this.buildings).forEach((key) => {
      const img = new Image();
      // HTTP/HTTPS 프로토콜일 때만 crossOrigin 설정
      if (window.location.protocol.startsWith('http')) {
        img.crossOrigin = "anonymous";
      }
      img.src = this.buildings[key].img;
      this.images[key] = img;
    });

    this.init();
  }

  init() {
    this.createPalette();
    this.createBackgroundOptions();
    this.setupEventListeners();
    this.render();
  }

  // ===== Palette =====
  createPalette() {
    const palette = document.getElementById("buildingPalette");
    Object.keys(this.buildings).forEach((key) => {
      const b = this.buildings[key];
      const item = document.createElement("div");
      item.className = "palette-item";
      item.draggable = true;

      // canvas 대신 img 태그 사용
      const mini = document.createElement("img");
      mini.src = b.img;
      mini.style.width = "100%";
      mini.style.height = "100%";
      mini.style.objectFit = "contain";
      item.appendChild(mini);

      item.addEventListener("dragstart", (e) => {
        this.draggedItem = { ...b, key }; // key도 함께 저장
        // 투명한 1x1 이미지로 드래그 이미지 숨김
        const emptyImg = document.createElement("canvas");
        emptyImg.width = 1;
        emptyImg.height = 1;
        emptyImg.style.position = "absolute";
        emptyImg.style.top = "-1000px";
        emptyImg.style.left = "-1000px";
        document.body.appendChild(emptyImg);

        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        e.dataTransfer.effectAllowed = "move";

        // 드래그 종료 후 제거
        setTimeout(() => {
          if (emptyImg.parentNode) emptyImg.parentNode.removeChild(emptyImg);
        }, 0);
      });

      item.addEventListener("dragend", () => {
        this.draggedItem = null;
        this.preview = null;
        this.render();
      });

      palette.appendChild(item);
    });
  }

  // ===== Background Options =====
  createBackgroundOptions() {
    const container = document.getElementById("backgroundOptions");
    Object.keys(this.backgrounds).forEach((key) => {
      const bgOption = document.createElement("div");
      bgOption.className = "background-option";
      bgOption.style.backgroundColor = this.backgrounds[key].color;
      bgOption.title = key;

      if (key === this.currentBackground) {
        bgOption.classList.add("active");
      }

      bgOption.addEventListener("click", () => {
        this.currentBackground = key;
        document.querySelectorAll(".background-option").forEach((opt) => {
          opt.classList.remove("active");
        });
        bgOption.classList.add("active");
        this.render();
      });

      container.appendChild(bgOption);
    });
  }

  // ===== Events =====
  setupEventListeners() {
    this.canvas.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.canvas.addEventListener("drop", (e) => this.handleDrop(e));

    // 캔버스 아이템 드래그 이벤트
    this.canvas.addEventListener("mousedown", (e) => this.handleCanvasMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleCanvasMouseUp(e));
    this.canvas.addEventListener("mouseleave", (e) => this.handleCanvasMouseUp(e));

    // 캔버스 우클릭 이벤트 (컨텍스트 메뉴)
    this.canvas.addEventListener("contextmenu", (e) => this.handleContextMenu(e));

    // Clear All 버튼
    document.getElementById("clearBtn").addEventListener("click", () => this.clearAll());

    // Save 버튼
    document.getElementById("saveBtn").addEventListener("click", () => this.saveCanvas());

    // 컨텍스트 메뉴 삭제 버튼
    document.getElementById("deleteItem").addEventListener("click", () => this.deleteContextMenuItem());

    // 컨텍스트 메뉴 닫기 (클릭 외부)
    document.addEventListener("click", (e) => this.hideContextMenu(e));
  }

  // ===== Iso transforms (center anchor corrected) =====
  tileToScreen(x, y) {
    return {
      x: (x - y) * (this.TILE_W / 2) + this.ORIGIN_X,
      y: (x + y) * (this.TILE_H / 2) + this.ORIGIN_Y,
    };
  }

  screenToTile(px, py) {
    px -= this.ORIGIN_X;
    py -= this.ORIGIN_Y;
    return {
      x: (py / (this.TILE_H / 2) + px / (this.TILE_W / 2)) / 2,
      y: (py / (this.TILE_H / 2) - px / (this.TILE_W / 2)) / 2,
    };
  }

  snapToTile(px, py) {
    // 그리드 교점에 스냅 (CELL 단위)
    const snappedX = Math.round(px / this.CELL) * this.CELL;
    const snappedY = Math.round(py / this.CELL) * this.CELL;
    return { tx: snappedX, ty: snappedY };
  }

  getMousePos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // ===== Drag logic (center accurate) =====
  handleDragOver(e) {
    e.preventDefault();
    if (!this.draggedItem) return;

    // cyan 커서 제거를 위해 dropEffect를 명시적으로 설정하지 않음
    // 대신 CSS cursor로 제어
    const { x, y } = this.getMousePos(e);
    const { tx, ty } = this.snapToTile(x, y);
    // 중심에 맞추기 위해 Y 오프셋 제거 (기존의 +hh 보정 제거)
    this.preview = { x: tx, y: ty, key: this.draggedItem.key };
    this.render();
  }

  handleDrop(e) {
    e.preventDefault();
    if (!this.draggedItem) return;

    const { x, y } = this.getMousePos(e);
    const { tx, ty } = this.snapToTile(x, y);
    this.placedItems.push({ x: tx, y: ty, key: this.draggedItem.key, isScreenCoord: true });
    this.draggedItem = null;
    this.preview = null;
    this.render();
  }

  // ===== 캔버스 아이템 마우스 이벤트 =====
  handleCanvasMouseDown(e) {
    // 팔레트에서 드래그 중이면 무시
    if (this.draggedItem) return;

    const { x, y } = this.getMousePos(e);

    // 클릭한 위치에 있는 아이템 찾기 (역순으로 탐색 - 위에 있는 아이템 우선)
    for (let i = this.placedItems.length - 1; i >= 0; i--) {
      const item = this.placedItems[i];
      const pos = item.isScreenCoord ? { x: item.x, y: item.y } : this.tileToScreen(item.x, item.y);

      // 아이템의 바운딩 박스 체크 (사각형 영역)
      const hw = this.TILE_W / 2;
      const hh = this.TILE_H / 2;

      // 사각형 히트 테스트 - 가장자리까지 클릭 가능
      if (x >= pos.x - hw && x <= pos.x + hw && y >= pos.y - hh && y <= pos.y + hh) {
        this.selectedItem = item;
        this.isDraggingCanvas = true;
        this.canvas.style.cursor = "grabbing";

        // 마우스와 아이템 중심 간의 오프셋 저장
        this.dragOffset = { x: x - pos.x, y: y - pos.y };

        // 아이템을 배열에서 제거하고 맨 뒤(최상위)로 이동
        this.placedItems.splice(i, 1);
        this.placedItems.push(item);

        return;
      }
    }
  }

  handleCanvasMouseMove(e) {
    if (!this.isDraggingCanvas || !this.selectedItem) {
      // 드래그 중이 아닐 때 커서 변경 (호버 효과)
      if (!this.draggedItem) {
        const { x, y } = this.getMousePos(e);
        let isHovering = false;

        for (let i = this.placedItems.length - 1; i >= 0; i--) {
          const item = this.placedItems[i];
          const pos = item.isScreenCoord ? { x: item.x, y: item.y } : this.tileToScreen(item.x, item.y);
          const hw = this.TILE_W / 2;
          const hh = this.TILE_H / 2;

          // 사각형 히트 테스트 - 가장자리까지 호버 가능
          if (x >= pos.x - hw && x <= pos.x + hw && y >= pos.y - hh && y <= pos.y + hh) {
            isHovering = true;
            break;
          }
        }

        this.canvas.style.cursor = isHovering ? "grab" : "default";
      }
      return;
    }

    // 드래그 중 - 프리뷰 위치 업데이트
    const { x, y } = this.getMousePos(e);

    // 오프셋을 적용한 위치 계산
    const adjustedX = x - this.dragOffset.x;
    const adjustedY = y - this.dragOffset.y;
    const { tx, ty } = this.snapToTile(adjustedX, adjustedY);

    // 프리뷰 설정
    this.preview = { x: tx, y: ty, key: this.selectedItem.key, tx, ty };

    this.render();
  }

  handleCanvasMouseUp() {
    if (this.isDraggingCanvas && this.selectedItem) {
      // 프리뷰 위치로 아이템 이동
      if (this.preview) {
        this.selectedItem.x = this.preview.tx;
        this.selectedItem.y = this.preview.ty;
        this.selectedItem.isScreenCoord = true;
      }

      this.isDraggingCanvas = false;
      this.selectedItem = null;
      this.preview = null;
      this.dragOffset = { x: 0, y: 0 }; // 오프셋 초기화
      this.canvas.style.cursor = "default";
      this.render();
    }
  }

  // ===== Render =====
  render() {
    const bg = this.backgrounds[this.currentBackground].color;
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.FIELD_W, this.FIELD_H);

    // this.drawOrthogonalGrid();

    // 배치된 아이템 그리기
    for (const it of this.placedItems) {
      // 드래그 중인 아이템은 건너뛰기 (프리뷰로 표시됨)
      if (this.isDraggingCanvas && it === this.selectedItem) {
        continue;
      }

      const p = it.isScreenCoord ? { x: it.x, y: it.y } : this.tileToScreen(it.x, it.y);
      const img = this.images[it.key];
      if (img && img.complete) {
        // 이미지 중심 기준으로 그리기
        this.ctx.drawImage(img, p.x - this.TILE_W / 2, p.y - this.TILE_H / 2, this.TILE_W, this.TILE_H);
      }
    }

    // 프리뷰 그리기 (반투명)
    if (this.preview) {
      this.ctx.globalAlpha = 0.5;
      const img = this.images[this.preview.key];
      if (img && img.complete) {
        this.ctx.drawImage(img, this.preview.x - this.TILE_W / 2, this.preview.y - this.TILE_H / 2, this.TILE_W, this.TILE_H);
      }
      this.ctx.globalAlpha = 1.0;
    }
  }

  // ===== Grid (Pixel Dotted Style) =====
  drawOrthogonalGrid() {
    const g = this.ctx;
    g.save();

    // 픽셀 도트 스타일 그리드
    g.fillStyle = "rgba(139, 69, 19, 0.15)";

    // 수직선 (도트로 그리기)
    for (let x = 0; x <= this.FIELD_W; x += this.CELL) {
      for (let y = 0; y < this.FIELD_H; y += 4) {
        g.fillRect(x, y, 1, 2);
      }
    }

    // 수평선 (도트로 그리기)
    for (let y = 0; y <= this.FIELD_H; y += this.CELL) {
      for (let x = 0; x < this.FIELD_W; x += 4) {
        g.fillRect(x, y, 2, 1);
      }
    }

    // 교차점 강조
    g.fillStyle = "rgba(139, 69, 19, 0.25)";
    for (let x = 0; x <= this.FIELD_W; x += this.CELL) {
      for (let y = 0; y <= this.FIELD_H; y += this.CELL) {
        g.fillRect(x - 1, y - 1, 3, 3);
      }
    }

    g.restore();
  }

  // ===== Diamond (center-anchored) =====
  drawIsoDiamond(ctx, cx, cy, fill, stroke) {
    const hw = this.TILE_W / 2;
    const hh = this.TILE_H / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.stroke();
    ctx.restore();
  }

  // ===== Context Menu =====
  handleContextMenu(e) {
    e.preventDefault();

    // 팔레트에서 드래그 중이면 무시
    if (this.draggedItem) return;

    const { x, y } = this.getMousePos(e);

    // 클릭한 위치에 있는 아이템 찾기 (역순으로 탐색)
    for (let i = this.placedItems.length - 1; i >= 0; i--) {
      const item = this.placedItems[i];
      const pos = item.isScreenCoord ? { x: item.x, y: item.y } : this.tileToScreen(item.x, item.y);

      // 아이템의 바운딩 박스 체크
      const hw = this.TILE_W / 2;
      const hh = this.TILE_H / 2;

      // 사각형 히트 테스트 - 가장자리까지 우클릭 가능
      if (x >= pos.x - hw && x <= pos.x + hw && y >= pos.y - hh && y <= pos.y + hh) {
        this.contextMenuItem = item;
        this.showContextMenu(e.clientX, e.clientY);
        return;
      }
    }

    // 아이템이 없는 곳을 클릭한 경우 메뉴 숨김
    this.hideContextMenu();
  }

  showContextMenu(x, y) {
    const menu = document.getElementById("contextMenu");
    menu.style.display = "block";
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  hideContextMenu(e) {
    const menu = document.getElementById("contextMenu");
    // 컨텍스트 메뉴 내부 클릭은 무시
    if (e && menu.contains(e.target)) return;
    menu.style.display = "none";
    this.contextMenuItem = null;
  }

  deleteContextMenuItem() {
    if (this.contextMenuItem) {
      const index = this.placedItems.indexOf(this.contextMenuItem);
      if (index > -1) {
        this.placedItems.splice(index, 1);
        this.render();
      }
      this.hideContextMenu();
    }
  }

  // ===== Clear All =====
  clearAll() {
    if (confirm("모든 아이템을 삭제하시겠습니까?")) {
      this.placedItems = [];
      this.selectedItem = null;
      this.isDraggingCanvas = false;
      this.preview = null;
      this.render();
    }
  }

  // ===== Save Canvas =====
  saveCanvas() {
    try {
      // 임시 캔버스 생성하여 실제 크기로 렌더링
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = this.FIELD_W;
      tempCanvas.height = this.FIELD_H;
      const tempCtx = tempCanvas.getContext("2d");

      // 배경 그리기
      const bg = this.backgrounds[this.currentBackground].color;
      tempCtx.fillStyle = bg;
      tempCtx.fillRect(0, 0, this.FIELD_W, this.FIELD_H);

      // 모든 아이템 그리기
      for (const it of this.placedItems) {
        const p = it.isScreenCoord ? { x: it.x, y: it.y } : this.tileToScreen(it.x, it.y);
        const img = this.images[it.key];
        if (img && img.complete) {
          tempCtx.drawImage(img, p.x - this.TILE_W / 2, p.y - this.TILE_H / 2, this.TILE_W, this.TILE_H);
        }
      }

      // 이미지로 변환
      tempCanvas.toBlob((blob) => {
        if (!blob) {
          alert("이미지 생성에 실패했습니다.");
          return;
        }

        // Blob URL 생성
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
        link.download = `batt-farm-${timestamp}.png`;
        link.href = url;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        // 정리
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }, "image/png");
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다: " + error.message);
    }
  }

}

// ===== Init =====
window.addEventListener("DOMContentLoaded", () => {
  // creator.html에서만 자동 초기화 (cityCanvas가 모달 밖에 있는 경우)
  const canvas = document.getElementById("cityCanvas");
  const modalOverlay = document.getElementById("modalOverlay");

  // 모달이 없거나, canvas가 모달 밖에 있는 경우에만 초기화
  if (canvas && (!modalOverlay || !modalOverlay.contains(canvas))) {
    new CityCreator();
  }
});