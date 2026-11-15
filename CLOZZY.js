(function () {
  const normalCursorURL = "https://user.uploads.dev/file/20644329948d34740f3d1adc8498641d.png";
  const hoverCursorURL = "https://user.uploads.dev/file/743fdbd62833d80ee3aab6940e4caf82.png";

  // Final size in pixels (32 = standard small cursor; try 28 or 24 for even smaller)
  const targetSize = 32;

  function buildFittedCursor(url, size) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(img, 0, 0);

        const data = tempCtx.getImageData(0, 0, w, h).data;

        // Scan the image to find the exact outer edges of the artwork
        let minX = w, minY = h, maxX = 0, maxY = 0;
        let foundPixels = false;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Detect non-transparent (and non-pure-white) pixels
            const isVisible = a > 20 && !(r > 245 && g > 245 && b > 245);
            if (isVisible) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
              foundPixels = true;
            }
          }
        }

        // Fallback if image is blank
        if (!foundPixels) {
          minX = 0; minY = 0; maxX = w - 1; maxY = h - 1;
        }

        // Keep a 1px safety margin so outer borders never clip
        minX = Math.max(0, minX - 1);
        minY = Math.max(0, minY - 1);
        maxX = Math.min(w - 1, maxX + 1);
        maxY = Math.min(h - 1, maxY + 1);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        const maxSide = Math.max(cropW, cropH);

        // Scale down proportionally to fit inside targetSize x targetSize
        const scale = size / maxSide;
        const drawW = Math.round(cropW * scale);
        const drawH = Math.round(cropH * scale);

        const outCanvas = document.createElement("canvas");
        outCanvas.width = size;
        outCanvas.height = size;
        const outCtx = outCanvas.getContext("2d");
        outCtx.imageSmoothingEnabled = false;

        outCtx.drawImage(
          img,
          minX, minY, cropW, cropH,
          0, 0, drawW, drawH
        );

        resolve(outCanvas.toDataURL("image/png"));
      };

      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  Promise.all([
    buildFittedCursor(normalCursorURL, targetSize),
    buildFittedCursor(hoverCursorURL, targetSize)
  ]).then(([fittedNormal, fittedHover]) => {
    const style = document.createElement("style");
style.id = "catCursorMod";
    style.textContent = `
      html, body, * {
        cursor: url("${fittedNormal}") 1 1, auto !important;
      }

      a, a *,
      button, button *,
      input[type="submit"],
      input[type="button"],
      select, label,
      [role="button"],
      [onclick],
      .clickable {
        cursor: url("${fittedHover}") 1 1, pointer !important;
      }
    `;
    document.head.appendChild(style);
  });
})();
