function hexToRgb(hex: string) {
  // 判断颜色值是否符合对应格式
  var reg = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
  var result = reg.exec(hex);
  if (!result) {
    return null;
  }

  // 将颜色值转化为RGB颜色值
  var r = parseInt(result[1], 16);
  var g = parseInt(result[2], 16);
  var b = parseInt(result[3], 16);

  return [r, g, b];
}

function rgbToHsla(rgb: number[]) {
  // 将RGB值转化为0-1之间的比例值
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;

  // 计算最大、最小颜色分量值和亮度值
  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var l = (max + min) / 2;

  // 计算饱和度值
  var s = 0;
  var d = 0;
  if (max !== min) {
    d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }

  // 计算色相值
  var h = 0;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // 计算透明度值，默认为1（不透明）
  var a = 1;

  return [h, s, l, a];
}

function hexToHsla(hex: string) {
  var rgb = hexToRgb(hex);
  if (rgb === null) {
    return null;
  }

  return rgbToHsla(rgb);
}
export { hexToHsla };
