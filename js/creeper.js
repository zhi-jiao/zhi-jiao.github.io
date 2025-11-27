(function () {
    // ---- 加载 creeper.css ----
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "./creeper.css"; // 你 css 的路径
    document.head.appendChild(cssLink);

    // ---- 创建 Creeper 元素 ----
    const creeper = document.createElement("div");
    creeper.className = "creeper";
    creeper.style.left = "20px";
    creeper.style.bottom = "20px";

    document.body.appendChild(creeper);

    // ---- 拖动逻辑 ----
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    creeper.addEventListener("mousedown", (e) => {
        isDragging = true;
        creeper.style.cursor = "grabbing";

        const rect = creeper.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        let x = e.clientX - offsetX;
        let y = e.clientY - offsetY;

        x = Math.max(0, Math.min(x, window.innerWidth - 120));
        y = Math.max(0, Math.min(y, window.innerHeight - 120));

        creeper.style.left = x + "px";
        creeper.style.top = y + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        creeper.style.cursor = "grab";
    });
})();
