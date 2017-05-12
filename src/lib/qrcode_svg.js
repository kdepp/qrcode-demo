import { pick, range, compose } from './utils';

function hex2rgba (hex) {
  if (typeof hex !== 'string') {
    throw new Error('Color should be defined as hex string')
  }

  var hexCode = hex.slice().replace('#', '').split('')
  if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
    throw new Error('Invalid hex color: ' + hex)
  }

  // Convert from short to long form (fff -> ffffff)
  if (hexCode.length === 3 || hexCode.length === 4) {
    hexCode = Array.prototype.concat.apply([], hexCode.map(function (c) {
      return [c, c]
    }))
  }

  // Add default alpha value
  if (hexCode.length === 6) hexCode.push('F', 'F')

  var hexValue = parseInt(hexCode.join(''), 16)

  return {
    r: (hexValue >> 24) & 255,
    g: (hexValue >> 16) & 255,
    b: (hexValue >> 8) & 255,
    a: hexValue & 255
  }
}

function getColorAttrib (color) {
  if (/^#/.test(color)) color = hex2rgba(color);

  return 'fill="rgb(' + [color.r, color.g, color.b].join(',') + ')" ' +
    'fill-opacity="' + (color.a / 255).toFixed(2) + '"'
}

function renderFrame(qrcodesize) {
  return function (content) {
    var xmlStr = '<?xml version="1.0" encoding="utf-8"?>\n'
    xmlStr += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n'

    xmlStr += '<svg version="1.1" baseProfile="full"'
    xmlStr += ' width="' + qrcodesize + '" height="' + qrcodesize + '"'
    xmlStr += ' viewBox="0 0 ' + qrcodesize + ' ' + qrcodesize + '"'
    xmlStr += ' xmlns="http://www.w3.org/2000/svg"'
    xmlStr += ' xmlns:xlink="http://www.w3.org/1999/xlink"'
    xmlStr += ' xmlns:ev="http://www.w3.org/2001/xml-events">\n'
    xmlStr += content;
    xmlStr += '</svg>'

    return xmlStr
  };
}

function wrapBgColor(qrcodesize, bgColor) {
  return function (content) {
    var xmlStr = '<rect x="0" y="0" width="' + qrcodesize + '" height="' + qrcodesize + '" ' + getColorAttrib(bgColor) + ' />\n';

    xmlStr += content;
    return xmlStr;
  };
}

function logoRect(size, percent) {
  if (percent <= 0 || percent > 0.5) throw new Error('invalid logo percent');

  var logoSize  = Math.floor(size * percent);
  var offset    = Math.floor((size - logoSize) / 2);

  return {
    x: offset,
    y: offset,
    width: logoSize,
    height: logoSize,
  };
}

function stripLogoSpace(opts, size, data) {
  if (!opts.logo) return { restArea: data, logoRect: null };

  const rect    = logoRect(size, 0.3); 
  const { x, y, width, height } = rect;
  const left    = Math.floor(x);
  const top     = Math.floor(y);
  const right   = left + width;
  const bottom  = top + height;

  var newData = data.slice();
  
  // Note: use (top - 1) (bottom + 1) to leave a one-module margin around the logo
  for (var i = top - 1; i < bottom + 1; i += 1) {
    for (var j = left - 1; j < right + 1; j += 1) {
      newData[size * i + j] = 0;
    }    
  }    

  return {
    restArea: newData,
    logoRect: rect,
  };
}

function stripCorners(size, data) {
  var corner = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  var threeCornerTopLeftPos = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ];
  var cornerNames = ['topLeft', 'topRight', 'bottomLeft'];
  var corners = cornerNames.reduce((prev, cur, i) => {
    prev[cur] = {
      name: cur,
      matrix: corner,
      pos: threeCornerTopLeftPos[i],
    };

    return prev;
  }, {});

  var newData = data.slice();

  threeCornerTopLeftPos.forEach(([x, y]) => {
    for (var i = 0; i <= 7; i += 1) {
      for (var j = 0; j <= 7; j += 1) {
        newData[size * (i + x) + j + y] = 0;
      }    
    }    
  });

  return {
    corners: corners,
    mainArea: newData,
  };
}

// corner:  { matrix, pos, name }
// opts:    { scale, margin, , colors: {outer, inner} }
function renderCorner(corner, opts) {
  var getDefName = (name, type) => ['border', name, type].join('-');

  return function (content) {
    var outerDefName = getDefName(corner.name, 'outer');
    var innerDefName = getDefName(corner.name, 'inner');

    var pointStr = corner.matrix.map((row, y) => {
      return row.map((val, x) => {
        if (!val) return '';

        var isBorder = x === 0 || x === 6
                      || y === 0 || y === 6;
        var defName = isBorder ? outerDefName : innerDefName;
        var realX   = (opts.margin + x + corner.pos[0]) * opts.scale;
        var realY   = (opts.margin + y + corner.pos[1]) * opts.scale;

        return `<use x="${realX}" y="${realY}" xlink:href="#${defName}" />`;

      }).join('\n');
    }).join('\n');;


    var scale = opts.scale;
    var str = [
      '<g>',
        '<defs>',
          `<rect id="${outerDefName}" width="${scale}" height="${scale}" ${getColorAttrib(opts.colors.outer)} />`,
          `<rect id="${innerDefName}" width="${scale}" height="${scale}" ${getColorAttrib(opts.colors.inner)} />`,
        '</defs>',
        pointStr,
      '</g>',
      content
    ];

    return str.join('\n');
  };
}

// opts:    { scale, margin }
function renderLogo(url, rect, opts) {
  return function (content) {
    if (!url || !rect)  return content;

    const x = (opts.margin + rect.x) * opts.scale;
    const y = (opts.margin + rect.y) * opts.scale;
    const w = rect.width * opts.scale;
    const h = rect.height * opts.scale;

    return [
       content,
      `<image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="${url}" />`,
    ].join('\n');
  };
}

// opts:    { scale, margin, colors: { dark } }
function renderContent(data, size, opts) {
  return function () {
    var defName = 'p';
    var scale   = opts.scale;
    var xmlStr  = [
      '<defs>',
        `<rect id="${defName}" width="${scale}" height="${scale}" ${getColorAttrib(opts.colors.dark)} />`,
      '</defs>',
      '<g>'
    ].join('\n');

    for (var i = 0; i < size; i++) {
      for (var j = 0; j < size; j++) {
        if (!data[i * size + j]) continue

        var x = (opts.margin + j) * opts.scale
        var y = (opts.margin + i) * opts.scale
        xmlStr += '<use x="' + x + '" y="' + y + '" xlink:href="#' + defName + '" />\n'
      }
    }

    xmlStr += '</g>\n'

    return xmlStr;
  };
}

export default function render(qrData, options) {
  var opts = {
    colors: {
      topLeft: {
        inner: '#ff0000',
        outer: '#f0f000',
      },
      topRight: {
        inner: '#00ff00',
        outer: '#00f0f0',
      },
      bottomLeft: {
        inner: '#0000ff',
        outer: '#f000f0',
      },
      mainArea: {
        dark: '#000',
        light: '#fff',
      }
    },
    margin: 4,
    scale: 4,
    ...options,
  };
  var commonOpts  = pick(['margin', 'scale'], opts);

  var size        = qrData.modules.size;
  var data        = qrData.modules.data;
  var qrcodesize  = (size + opts.margin * 2) * opts.scale;
  var {
    corners,
    mainArea,
  }               = stripCorners(size, data);
  var {
    restArea,
    logoRect ,
  }               = stripLogoSpace(opts, size, mainArea);

  var fns         = [
    renderFrame(qrcodesize),
    wrapBgColor(qrcodesize, opts.colors.mainArea.light),
    renderLogo(opts.logo, logoRect, opts),

    ...['bottomLeft', 'topRight', 'topLeft'].map(cornerType => {
      return renderCorner(corners[cornerType], {
        ...commonOpts,
        colors: opts.colors[cornerType], 
      });
    }),

    renderContent(restArea, size, {
      ...commonOpts,
      colors: opts.colors.mainArea, 
    })
  ]

  return compose(...fns)('');
}
