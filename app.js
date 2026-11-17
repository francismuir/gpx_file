(function () {
  'use strict';

  const GPX_11_NS = 'http://www.topografix.com/GPX/1/1';
  const GPX_10_NS = 'http://www.topografix.com/GPX/1/0';
  const NON_ESSENTIAL_TAGS = new Set([
    'cmt',
    'src',
    'link',
    'magvar',
    'geoidheight',
    'fix',
    'sat',
    'hdop',
    'vdop',
    'pdop',
    'ageofdgpsdata',
    'dgpsid',
    'number'
  ]);

  const GPX_POINT_CHILD_ORDER = [
    'ele',
    'time',
    'magvar',
    'geoidheight',
    'name',
    'cmt',
    'desc',
    'src',
    'link',
    'sym',
    'type',
    'fix',
    'sat',
    'hdop',
    'vdop',
    'pdop',
    'ageofdgpsdata',
    'dgpsid',
    'extensions'
  ];

  const COURSE_POINT_TYPES = {
    0: 'Generic',
    1: 'Summit',
    2: 'Valley',
    3: 'Water',
    4: 'Food',
    5: 'Danger',
    6: 'Left',
    7: 'Right',
    8: 'Straight',
    9: 'First Aid',
    10: '4th Category',
    11: '3rd Category',
    12: '2nd Category',
    13: '1st Category',
    14: 'Hors Category',
    15: 'Sprint',
    16: 'Left Fork',
    17: 'Right Fork',
    18: 'Middle Fork',
    19: 'Slight Left',
    20: 'Sharp Left',
    21: 'Slight Right',
    22: 'Sharp Right',
    23: 'U-Turn'
  };

  // =========================================================================
  // XML Helpers & 2-Space Formatter
  // =========================================================================

  function getDomParser() {
    if (typeof DOMParser !== 'undefined') {
      return new DOMParser();
    }
    throw new Error('DOMParser is not available in this environment.');
  }

  function localName(node) {
    if (!node) return '';
    if (node.localName) return node.localName;
    if (node.tagName) {
      const idx = node.tagName.indexOf(':');
      return idx >= 0 ? node.tagName.slice(idx + 1) : node.tagName;
    }
    return '';
  }

  function getDirectChildren(parent, tagLocalName) {
    const out = [];
    if (!parent || !parent.childNodes) return out;
    for (let i = 0; i < parent.childNodes.length; i += 1) {
      const child = parent.childNodes[i];
      if (child.nodeType === 1) {
        if (!tagLocalName || localName(child) === tagLocalName) {
          out.push(child);
        }
      }
    }
    return out;
  }

  function getFirstDirectChild(parent, tagLocalName) {
    if (!parent || !parent.childNodes) return null;
    for (let i = 0; i < parent.childNodes.length; i += 1) {
      const child = parent.childNodes[i];
      if (child.nodeType === 1 && localName(child) === tagLocalName) {
        return child;
      }
    }
    return null;
  }

  function getElementsByLocalName(root, tagLocalName) {
    const out = [];
    if (!root) return out;
    const all = root.getElementsByTagName('*');
    for (let i = 0; i < all.length; i += 1) {
      if (localName(all[i]) === tagLocalName) {
        out.push(all[i]);
      }
    }
    return out;
  }

  function parseXml(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('The XML text box is empty.');
    }
    const parser = getDomParser();
    const doc = parser.parseFromString(trimmed, 'application/xml');
    const root = doc.documentElement;
    const parserError =
      (root && localName(root) === 'parsererror' ? root : null) ||
      doc.getElementsByTagName('parsererror')[0];

    if (parserError) {
      const msg = (parserError.textContent || 'Invalid XML syntax.')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
      throw new Error('XML Parse Error: ' + msg);
    }
    if (!root) {
      throw new Error('Invalid XML: missing root element.');
    }
    return doc;
  }

  function createEmptyGpxDoc() {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<gpx version="1.1" creator="GPX Utility" xmlns="' +
      GPX_11_NS +
      '"/>';
    return parseXml(xml);
  }

  function createGpxElement(doc, tagName) {
    const rootNs = doc.documentElement ? doc.documentElement.namespaceURI : null;
    if (rootNs) {
      return doc.createElementNS(rootNs, tagName);
    }
    return doc.createElement(tagName);
  }

  function escapeXmlText(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeXmlAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatXmlNode(node, level) {
    const pad = '  '.repeat(level);
    if (node.nodeType === 8) {
      return pad + '<!--' + node.nodeValue + '-->';
    }
    if (node.nodeType === 4) {
      return pad + '<![CDATA[' + node.nodeValue + ']]>';
    }
    if (node.nodeType !== 1) {
      return '';
    }

    const tagName = node.tagName;
    let attrStr = '';
    if (node.attributes && node.attributes.length > 0) {
      for (let i = 0; i < node.attributes.length; i += 1) {
        const attr = node.attributes[i];
        attrStr += ' ' + attr.name + '="' + escapeXmlAttr(attr.value) + '"';
      }
    }

    const significantChildren = [];
    let hasElementOrComment = false;
    let hasCdata = false;

    for (let i = 0; i < node.childNodes.length; i += 1) {
      const child = node.childNodes[i];
      if (child.nodeType === 3) {
        if (child.nodeValue && child.nodeValue.trim().length > 0) {
          significantChildren.push(child);
        }
      } else if (child.nodeType === 4) {
        hasCdata = true;
        significantChildren.push(child);
      } else if (child.nodeType === 1 || child.nodeType === 8) {
        hasElementOrComment = true;
        significantChildren.push(child);
      }
    }

    if (significantChildren.length === 0) {
      return pad + '<' + tagName + attrStr + '/>';
    }

    if (!hasElementOrComment) {
      if (hasCdata && significantChildren.length === 1) {
        return (
          pad +
          '<' +
          tagName +
          attrStr +
          '><![CDATA[' +
          significantChildren[0].nodeValue +
          ']]></' +
          tagName +
          '>'
        );
      }
      const combinedText = significantChildren
        .map(function (c) {
          return c.nodeType === 4 ? '<![CDATA[' + c.nodeValue + ']]>' : escapeXmlText(c.nodeValue);
        })
        .join('')
        .trim();
      if (!combinedText) {
        return pad + '<' + tagName + attrStr + '/>';
      }
      return pad + '<' + tagName + attrStr + '>' + combinedText + '</' + tagName + '>';
    }

    const lines = [pad + '<' + tagName + attrStr + '>'];
    for (let i = 0; i < significantChildren.length; i += 1) {
      const child = significantChildren[i];
      if (child.nodeType === 3) {
        lines.push('  '.repeat(level + 1) + escapeXmlText(child.nodeValue.trim()));
      } else {
        const rendered = formatXmlNode(child, level + 1);
        if (rendered) {
          lines.push(rendered);
        }
      }
    }
    lines.push(pad + '</' + tagName + '>');
    return lines.join('\n');
  }

  function formatXml(docOrString) {
    const doc = typeof docOrString === 'string' ? parseXml(docOrString) : docOrString;
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + formatXmlNode(doc.documentElement, 0) + '\n';
  }

  function insertChildInGpxOrder(parent, newEl, orderList) {
    const newName = localName(newEl);
    const newIdx = orderList.indexOf(newName);
    if (newIdx < 0) {
      parent.appendChild(newEl);
      return;
    }
    const children = getDirectChildren(parent);
    for (let i = 0; i < children.length; i += 1) {
      const existingIdx = orderList.indexOf(localName(children[i]));
      if (existingIdx > newIdx) {
        parent.insertBefore(newEl, children[i]);
        return;
      }
    }
    parent.appendChild(newEl);
  }

  // =========================================================================
  // Geometry, Distance, Douglas-Peucker & Stats
  // =========================================================================

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Simplifies an array of { lat, lon, el } points using iterative Douglas-Peucker
   * projected onto a local tangent plane in meters.
   */
  function simplifyPointsDP(points, toleranceMeters) {
    const tol = typeof toleranceMeters === 'number' && toleranceMeters > 0 ? toleranceMeters : 10;
    const n = points.length;
    if (n <= 2) return points.slice();

    const lat0 = points[0].lat;
    const lon0 = points[0].lon;
    const rad = Math.PI / 180;
    const R = 6371000;
    const cosLat0 = Math.cos(lat0 * rad);

    const px = new Float64Array(n);
    const py = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      px[i] = (points[i].lon - lon0) * rad * R * cosLat0;
      py[i] = (points[i].lat - lat0) * rad * R;
    }

    const keep = new Uint8Array(n);
    keep[0] = 1;
    keep[n - 1] = 1;

    const stack = [[0, n - 1]];
    while (stack.length > 0) {
      const range = stack.pop();
      const start = range[0];
      const end = range[1];
      if (end - start <= 1) continue;

      const ax = px[start];
      const ay = py[start];
      const bx = px[end];
      const by = py[end];
      const dx = bx - ax;
      const dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      const len = Math.sqrt(lenSq);

      let maxDist = -1;
      let maxIdx = -1;

      for (let i = start + 1; i < end; i += 1) {
        let dist;
        if (lenSq === 0) {
          dist = Math.hypot(px[i] - ax, py[i] - ay);
        } else {
          dist = Math.abs(dy * (px[i] - ax) - dx * (py[i] - ay)) / len;
        }
        if (dist > maxDist) {
          maxDist = dist;
          maxIdx = i;
        }
      }

      if (maxDist > tol && maxIdx > start && maxIdx < end) {
        keep[maxIdx] = 1;
        stack.push([start, maxIdx], [maxIdx, end]);
      }
    }

    const result = [];
    for (let i = 0; i < n; i += 1) {
      if (keep[i]) {
        result.push(points[i]);
      }
    }
    return result;
  }

  function getPointCoords(ptEl) {
    const lat = parseFloat(ptEl.getAttribute('lat'));
    const lon = parseFloat(ptEl.getAttribute('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const eleEl = getFirstDirectChild(ptEl, 'ele');
    const ele = eleEl ? parseFloat(eleEl.textContent) : NaN;
    return { lat, lon, ele: Number.isFinite(ele) ? ele : null };
  }

  function computeStats(text) {
    const lineCount = text ? text.split(/\r?\n/).length : 0;
    const trimmed = (text || '').trim();
    if (!trimmed) {
      return {
        valid: true,
        empty: true,
        format: 'Empty',
        tracks: 0,
        segments: 0,
        routes: 0,
        trkpts: 0,
        rtepts: 0,
        wpts: 0,
        distanceMeters: 0,
        elevationGain: null,
        wpRange: '',
        lineCount: 0
      };
    }

    let doc;
    try {
      doc = parseXml(trimmed);
    } catch (err) {
      return {
        valid: false,
        empty: false,
        format: 'Invalid XML',
        error: err.message,
        lineCount
      };
    }

    const root = doc.documentElement;
    const rootName = localName(root);
    let format = 'XML (<' + rootName + '>)';
    if (rootName === 'gpx') {
      const ver = root.getAttribute('version') || '1.1';
      format = 'GPX ' + ver;
    } else if (rootName === 'kml') {
      format = 'KML';
    }

    const trks = getElementsByLocalName(root, 'trk');
    const trksegs = getElementsByLocalName(root, 'trkseg');
    const trkpts = getElementsByLocalName(root, 'trkpt');
    const rtes = getElementsByLocalName(root, 'rte');
    const rtepts = getElementsByLocalName(root, 'rtept');
    const wpts = getElementsByLocalName(root, 'wpt');

    let distanceMeters = 0;
    let eleGain = 0;
    let hasEle = false;

    function accumulateSeries(ptElements) {
      let prev = null;
      for (let i = 0; i < ptElements.length; i += 1) {
        const c = getPointCoords(ptElements[i]);
        if (!c) continue;
        if (c.ele !== null) {
          hasEle = true;
        }
        if (prev) {
          distanceMeters += haversineMeters(prev.lat, prev.lon, c.lat, c.lon);
          if (prev.ele !== null && c.ele !== null && c.ele > prev.ele) {
            eleGain += c.ele - prev.ele;
          }
        }
        prev = c;
      }
    }

    if (trksegs.length > 0) {
      for (let i = 0; i < trksegs.length; i += 1) {
        accumulateSeries(getDirectChildren(trksegs[i], 'trkpt'));
      }
    }
    if (rtes.length > 0) {
      for (let i = 0; i < rtes.length; i += 1) {
        accumulateSeries(getDirectChildren(rtes[i], 'rtept'));
      }
    }

    const activePts = trkpts.length > 0 ? trkpts : rtepts;
    let firstWp = '';
    let lastWp = '';
    if (activePts.length > 0) {
      const firstNameEl = getFirstDirectChild(activePts[0], 'name');
      const lastNameEl = getFirstDirectChild(activePts[activePts.length - 1], 'name');
      const fn = firstNameEl ? firstNameEl.textContent.trim() : '';
      const ln = lastNameEl ? lastNameEl.textContent.trim() : '';
      if (/^WP\d+$/i.test(fn) && /^WP\d+$/i.test(ln)) {
        firstWp = fn;
        lastWp = ln;
      }
    }

    return {
      valid: true,
      empty: false,
      format,
      tracks: trks.length,
      segments: trksegs.length,
      routes: rtes.length,
      trkpts: trkpts.length,
      rtepts: rtepts.length,
      wpts: wpts.length,
      distanceMeters,
      elevationGain: hasEle ? Math.round(eleGain) : null,
      wpRange: firstWp && lastWp ? firstWp + '–' + lastWp : '',
      lineCount
    };
  }

  // =========================================================================
  // GPX Operations
  // =========================================================================

  function ensureGpxRoot(doc) {
    const rootName = localName(doc.documentElement);
    if (rootName === 'kml') {
      throw new Error('This is a KML file. Click "Convert KML → GPX" first.');
    }
    if (rootName !== 'gpx') {
      throw new Error('Expected a <gpx> root element, found <' + rootName + '>.');
    }
  }

  function cleanupUnusedNamespaces(doc) {
    const root = doc.documentElement;
    const usedPrefixes = new Set();

    const allEls = root.getElementsByTagName('*');
    const elementsToScan = [root];
    for (let i = 0; i < allEls.length; i += 1) {
      elementsToScan.push(allEls[i]);
    }

    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      if (el.tagName && el.tagName.includes(':')) {
        usedPrefixes.add(el.tagName.split(':')[0]);
      }
      for (let j = 0; j < el.attributes.length; j += 1) {
        const attrName = el.attributes[j].name;
        if (attrName.includes(':') && !attrName.startsWith('xmlns:')) {
          usedPrefixes.add(attrName.split(':')[0]);
        }
      }
    }

    let removedAttrs = 0;
    const remainingNsUris = new Set();

    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      const toRemove = [];
      for (let j = 0; j < el.attributes.length; j += 1) {
        const attr = el.attributes[j];
        if (attr.name.startsWith('xmlns:')) {
          const prefix = attr.name.slice(6);
          if (!usedPrefixes.has(prefix)) {
            toRemove.push(attr.name);
          } else {
            remainingNsUris.add(attr.value);
          }
        } else if (attr.name === 'xmlns') {
          remainingNsUris.add(attr.value);
        }
      }
      for (let j = 0; j < toRemove.length; j += 1) {
        el.removeAttribute(toRemove[j]);
        removedAttrs += 1;
      }
    }

    // Prune xsi:schemaLocation entries whose namespace URIs were removed
    for (let i = 0; i < elementsToScan.length; i += 1) {
      const el = elementsToScan[i];
      if (el.hasAttribute('xsi:schemaLocation')) {
        const tokens = el.getAttribute('xsi:schemaLocation').trim().split(/\s+/);
        const kept = [];
        for (let k = 0; k + 1 < tokens.length; k += 2) {
          const nsUri = tokens[k];
          const xsdUrl = tokens[k + 1];
          if (remainingNsUris.has(nsUri)) {
            kept.push(nsUri, xsdUrl);
          }
        }
        if (kept.length === 0) {
          el.removeAttribute('xsi:schemaLocation');
          removedAttrs += 1;
        } else if (kept.length !== tokens.length) {
          el.setAttribute('xsi:schemaLocation', kept.join(' '));
        }
      }
    }

    // Remove xmlns:xsi if xsi prefix is no longer used anywhere
    const xsiStillUsed = elementsToScan.some(function (el) {
      for (let j = 0; j < el.attributes.length; j += 1) {
        if (el.attributes[j].name.startsWith('xsi:')) return true;
      }
      return false;
    });
    if (!xsiStillUsed && root.hasAttribute('xmlns:xsi')) {
      root.removeAttribute('xmlns:xsi');
      removedAttrs += 1;
    }

    return removedAttrs;
  }

  function removeUnwantedTags(doc, options) {
    ensureGpxRoot(doc);
    const opts = options || {};
    const root = doc.documentElement;
    const allEls = root.getElementsByTagName('*');
    const toRemove = [];

    for (let i = 0; i < allEls.length; i += 1) {
      const el = allEls[i];
      const name = localName(el);
      const ns = el.namespaceURI || '';
      const isThirdPartyNs =
        (ns !== '' && ns !== GPX_11_NS && ns !== GPX_10_NS) ||
        (el.tagName.includes(':') && ns !== GPX_11_NS && ns !== GPX_10_NS);

      if (opts.removeExtensions && (name === 'extensions' || isThirdPartyNs)) {
        toRemove.push(el);
      } else if (opts.removeTime && name === 'time') {
        toRemove.push(el);
      } else if (opts.removeNonEssential && NON_ESSENTIAL_TAGS.has(name)) {
        toRemove.push(el);
      } else if (opts.removeMetadata && name === 'metadata') {
        toRemove.push(el);
      } else if (opts.removeEle && name === 'ele') {
        toRemove.push(el);
      }
    }

    const removeSet = new Set(toRemove);
    let removedElements = 0;
    for (let i = 0; i < toRemove.length; i += 1) {
      const el = toRemove[i];
      let ancestorRemoved = false;
      let p = el.parentNode;
      while (p && p !== root) {
        if (removeSet.has(p)) {
          ancestorRemoved = true;
          break;
        }
        p = p.parentNode;
      }
      if (!ancestorRemoved && el.parentNode) {
        el.parentNode.removeChild(el);
        removedElements += 1;
      }
    }

    let removedNsAttrs = 0;
    if (opts.removeExtensions) {
      removedNsAttrs = cleanupUnusedNamespaces(doc);
    }

    return {
      xml: formatXml(doc),
      removedElements,
      removedNsAttrs
    };
  }

  function joinTrackSegments(doc) {
    ensureGpxRoot(doc);
    const trks = getElementsByLocalName(doc.documentElement, 'trk');
    if (trks.length === 0) {
      throw new Error('No <trk> elements found in this GPX.');
    }

    let mergedSegments = 0;
    for (let i = 0; i < trks.length; i += 1) {
      const segs = getDirectChildren(trks[i], 'trkseg');
      if (segs.length <= 1) continue;
      const targetSeg = segs[0];
      for (let s = 1; s < segs.length; s += 1) {
        const pts = getDirectChildren(segs[s], 'trkpt');
        for (let p = 0; p < pts.length; p += 1) {
          targetSeg.appendChild(pts[p]);
        }
        trks[i].removeChild(segs[s]);
        mergedSegments += 1;
      }
    }

    return {
      xml: formatXml(doc),
      mergedSegments
    };
  }

  function simplifyTracksAndRoutes(doc, toleranceMeters) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to simplify.');
    }

    const tol = typeof toleranceMeters === 'number' && toleranceMeters > 0 ? toleranceMeters : 10;
    let totalBefore = 0;
    let totalAfter = 0;

    function simplifyPointSequence(ptElements) {
      const pts = [];
      for (let i = 0; i < ptElements.length; i += 1) {
        const ptEl = ptElements[i];
        const lat = parseFloat(ptEl.getAttribute('lat'));
        const lon = parseFloat(ptEl.getAttribute('lon'));
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          pts.push({ lat, lon, el: ptEl });
        }
      }
      totalBefore += pts.length;
      if (pts.length <= 2) {
        totalAfter += pts.length;
        return;
      }
      const kept = simplifyPointsDP(pts, tol);
      const keptSet = new Set(
        kept.map(function (item) {
          return item.el;
        })
      );
      totalAfter += kept.length;
      for (let i = 0; i < pts.length; i += 1) {
        if (!keptSet.has(pts[i].el) && pts[i].el.parentNode) {
          pts[i].el.parentNode.removeChild(pts[i].el);
        }
      }
    }

    for (let i = 0; i < trks.length; i += 1) {
      const segs = getDirectChildren(trks[i], 'trkseg');
      for (let s = 0; s < segs.length; s += 1) {
        simplifyPointSequence(getDirectChildren(segs[s], 'trkpt'));
      }
    }
    for (let i = 0; i < rtes.length; i += 1) {
      simplifyPointSequence(getDirectChildren(rtes[i], 'rtept'));
    }

    if (totalBefore === 0) {
      throw new Error('No <trkpt> or <rtept> points found to simplify.');
    }

    return {
      xml: formatXml(doc),
      totalBefore,
      totalAfter,
      removedCount: totalBefore - totalAfter
    };
  }

  function convertTracksToRoutes(doc) {
    ensureGpxRoot(doc);
    const trks = getElementsByLocalName(doc.documentElement, 'trk');
    if (trks.length === 0) {
      throw new Error('No <trk> elements found to convert to routes.');
    }

    let totalBefore = 0;
    let totalAfter = 0;

    for (let i = 0; i < trks.length; i += 1) {
      const trk = trks[i];
      const rte = createGpxElement(doc, 'rte');

      // Copy metadata children of <trk> (except <trkseg>)
      const children = getDirectChildren(trk);
      const collectedPts = [];
      for (let c = 0; c < children.length; c += 1) {
        const child = children[c];
        if (localName(child) === 'trkseg') {
          const segPts = getDirectChildren(child, 'trkpt');
          for (let p = 0; p < segPts.length; p += 1) {
            const ptEl = segPts[p];
            const lat = parseFloat(ptEl.getAttribute('lat'));
            const lon = parseFloat(ptEl.getAttribute('lon'));
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              collectedPts.push({ lat, lon, el: ptEl });
            }
          }
        } else {
          rte.appendChild(child.cloneNode(true));
        }
      }

      totalBefore += collectedPts.length;
      totalAfter += collectedPts.length;

      for (let p = 0; p < collectedPts.length; p += 1) {
        const srcPt = collectedPts[p].el;
        const rtept = createGpxElement(doc, 'rtept');
        for (let a = 0; a < srcPt.attributes.length; a += 1) {
          const attr = srcPt.attributes[a];
          rtept.setAttribute(attr.name, attr.value);
        }
        const ptChildren = getDirectChildren(srcPt);
        for (let pc = 0; pc < ptChildren.length; pc += 1) {
          rtept.appendChild(ptChildren[pc].cloneNode(true));
        }
        rte.appendChild(rtept);
      }

      trk.parentNode.replaceChild(rte, trk);
    }

    return {
      xml: formatXml(doc),
      convertedCount: trks.length,
      totalBefore,
      totalAfter
    };
  }

  function convertRoutesToTracks(doc) {
    ensureGpxRoot(doc);
    const rtes = getElementsByLocalName(doc.documentElement, 'rte');
    if (rtes.length === 0) {
      throw new Error('No <rte> elements found to convert to tracks.');
    }

    let totalPoints = 0;
    for (let i = 0; i < rtes.length; i += 1) {
      const rte = rtes[i];
      const trk = createGpxElement(doc, 'trk');
      const trkseg = createGpxElement(doc, 'trkseg');

      const children = getDirectChildren(rte);
      for (let c = 0; c < children.length; c += 1) {
        const child = children[c];
        if (localName(child) === 'rtept') {
          const trkpt = createGpxElement(doc, 'trkpt');
          for (let a = 0; a < child.attributes.length; a += 1) {
            const attr = child.attributes[a];
            trkpt.setAttribute(attr.name, attr.value);
          }
          const ptChildren = getDirectChildren(child);
          for (let pc = 0; pc < ptChildren.length; pc += 1) {
            trkpt.appendChild(ptChildren[pc].cloneNode(true));
          }
          trkseg.appendChild(trkpt);
          totalPoints += 1;
        } else {
          trk.appendChild(child.cloneNode(true));
        }
      }

      trk.appendChild(trkseg);
      rte.parentNode.replaceChild(trk, rte);
    }

    return {
      xml: formatXml(doc),
      convertedCount: rtes.length,
      totalPoints
    };
  }

  function formatWpName(num) {
    return 'WP' + String(num).padStart(4, '0');
  }

  function numberTrackAndRoutePoints(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to name points.');
    }

    let totalNamed = 0;

    function processPointList(pts) {
      for (let i = 0; i < pts.length; i += 1) {
        const pt = pts[i];
        const existingNames = getDirectChildren(pt, 'name');
        for (let n = 0; n < existingNames.length; n += 1) {
          pt.removeChild(existingNames[n]);
        }
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = formatWpName(i + 1);
        insertChildInGpxOrder(pt, nameEl, GPX_POINT_CHILD_ORDER);
        totalNamed += 1;
      }
    }

    for (let i = 0; i < trks.length; i += 1) {
      processPointList(getElementsByLocalName(trks[i], 'trkpt'));
    }
    for (let i = 0; i < rtes.length; i += 1) {
      processPointList(getDirectChildren(rtes[i], 'rtept'));
    }

    if (totalNamed === 0) {
      throw new Error('No <trkpt> or <rtept> points found.');
    }

    return {
      xml: formatXml(doc),
      totalNamed
    };
  }

  function reverseTracksAndRoutes(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const trks = getElementsByLocalName(root, 'trk');
    const rtes = getElementsByLocalName(root, 'rte');
    if (trks.length === 0 && rtes.length === 0) {
      throw new Error('No <trk> or <rte> elements found to reverse.');
    }

    let reversedPoints = 0;

    for (let i = 0; i < trks.length; i += 1) {
      const trk = trks[i];
      const segs = getDirectChildren(trk, 'trkseg');
      if (segs.length === 0) continue;

      const allPts = [];
      for (let s = 0; s < segs.length; s += 1) {
        const pts = getDirectChildren(segs[s], 'trkpt');
        for (let p = 0; p < pts.length; p += 1) {
          segs[s].removeChild(pts[p]);
          allPts.push(pts[p]);
        }
      }
      for (let s = 1; s < segs.length; s += 1) {
        trk.removeChild(segs[s]);
      }
      const targetSeg = segs[0];
      for (let p = allPts.length - 1; p >= 0; p -= 1) {
        targetSeg.appendChild(allPts[p]);
        reversedPoints += 1;
      }
    }

    // If multiple <trk> elements are direct children of <gpx>, reverse their order too
    const directTrks = getDirectChildren(root, 'trk');
    if (directTrks.length > 1) {
      const anchor = directTrks[directTrks.length - 1].nextSibling;
      for (let i = 0; i < directTrks.length; i += 1) {
        root.removeChild(directTrks[i]);
      }
      for (let i = directTrks.length - 1; i >= 0; i -= 1) {
        root.insertBefore(directTrks[i], anchor);
      }
    }

    for (let i = 0; i < rtes.length; i += 1) {
      const rte = rtes[i];
      const pts = getDirectChildren(rte, 'rtept');
      for (let p = 0; p < pts.length; p += 1) {
        rte.removeChild(pts[p]);
      }
      for (let p = pts.length - 1; p >= 0; p -= 1) {
        rte.appendChild(pts[p]);
        reversedPoints += 1;
      }
    }

    if (reversedPoints === 0) {
      throw new Error('No points found inside tracks or routes.');
    }

    return {
      xml: formatXml(doc),
      reversedPoints
    };
  }

  function parsePointNumberToken(token) {
    const cleaned = String(token || '').trim().replace(/^WP/i, '');
    if (!/^\d+$/.test(cleaned)) {
      throw new Error('Invalid point number "' + token + '". Use numbers like 5 or WP0005.');
    }
    const num = parseInt(cleaned, 10);
    if (num < 1) {
      throw new Error('Point numbers must be 1 or greater.');
    }
    return num;
  }

  function parseRangeSpec(spec) {
    const raw = (spec || '').trim();
    if (!raw) {
      throw new Error('Enter a point range to remove (e.g. 5-10).');
    }
    const parts = raw.split(',');
    const ranges = [];
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i].trim();
      if (!part) continue;
      if (part.includes('-')) {
        const bounds = part.split('-');
        if (bounds.length !== 2) {
          throw new Error('Invalid range "' + part + '". Use start-end like 5-10.');
        }
        const start = parsePointNumberToken(bounds[0]);
        const end = parsePointNumberToken(bounds[1]);
        if (start > end) {
          throw new Error('Invalid range "' + part + '": start (' + start + ') must be <= end (' + end + ').');
        }
        ranges.push([start, end]);
      } else {
        const single = parsePointNumberToken(part);
        ranges.push([single, single]);
      }
    }
    if (ranges.length === 0) {
      throw new Error('Enter a point range to remove (e.g. 5-10).');
    }
    return ranges;
  }

  function getPointNumber(ptEl, index1Based, matchMode) {
    if (matchMode !== 'position') {
      const nameEl = getFirstDirectChild(ptEl, 'name');
      if (nameEl) {
        const m = nameEl.textContent.trim().match(/^WP(\d+)$/i);
        if (m) {
          return parseInt(m[1], 10);
        }
      }
    }
    return index1Based;
  }

  function getPointContainers(doc) {
    ensureGpxRoot(doc);
    const root = doc.documentElement;
    const containers = [];
    const trks = getElementsByLocalName(root, 'trk');
    for (let i = 0; i < trks.length; i += 1) {
      containers.push(getElementsByLocalName(trks[i], 'trkpt'));
    }
    const rtes = getElementsByLocalName(root, 'rte');
    for (let i = 0; i < rtes.length; i += 1) {
      containers.push(getDirectChildren(rtes[i], 'rtept'));
    }
    return containers;
  }

  function removePointsByRange(doc, rangeSpec, matchMode) {
    const ranges = parseRangeSpec(rangeSpec);
    const containers = getPointContainers(doc);
    if (containers.length === 0) {
      throw new Error('No <trk> or <rte> elements found.');
    }

    let removed = 0;
    let remaining = 0;

    for (let c = 0; c < containers.length; c += 1) {
      const pts = containers[c];
      for (let i = 0; i < pts.length; i += 1) {
        const num = getPointNumber(pts[i], i + 1, matchMode);
        const shouldRemove = ranges.some(function (r) {
          return num >= r[0] && num <= r[1];
        });
        if (shouldRemove) {
          if (pts[i].parentNode) {
            pts[i].parentNode.removeChild(pts[i]);
          }
          removed += 1;
        } else {
          remaining += 1;
        }
      }
    }

    return {
      xml: formatXml(doc),
      removed,
      remaining
    };
  }

  function trimPointsByStartEnd(doc, startSpec, endSpec, matchMode) {
    const startRaw = (startSpec || '').trim();
    const endRaw = (endSpec || '').trim();
    if (!startRaw && !endRaw) {
      throw new Error('Enter a Start point, an End point, or both.');
    }

    const startNum = startRaw ? parsePointNumberToken(startRaw) : null;
    const endNum = endRaw ? parsePointNumberToken(endRaw) : null;

    if (startNum !== null && endNum !== null && startNum > endNum) {
      throw new Error('Start point (' + startNum + ') cannot be greater than End point (' + endNum + ').');
    }

    const containers = getPointContainers(doc);
    if (containers.length === 0) {
      throw new Error('No <trk> or <rte> elements found.');
    }

    let removed = 0;
    let remaining = 0;

    for (let c = 0; c < containers.length; c += 1) {
      const pts = containers[c];
      for (let i = 0; i < pts.length; i += 1) {
        const num = getPointNumber(pts[i], i + 1, matchMode);
        const beforeStart = startNum !== null && num < startNum;
        const afterEnd = endNum !== null && num > endNum;
        if (beforeStart || afterEnd) {
          if (pts[i].parentNode) {
            pts[i].parentNode.removeChild(pts[i]);
          }
          removed += 1;
        } else {
          remaining += 1;
        }
      }
    }

    return {
      xml: formatXml(doc),
      removed,
      remaining
    };
  }

  // =========================================================================
  // KML -> GPX Converter
  // =========================================================================

  function parseKmlCoordinates(coordText) {
    const pts = [];
    const tokens = (coordText || '').trim().split(/\s+/);
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i].trim();
      if (!token) continue;
      const parts = token.split(',');
      if (parts.length < 2) continue;
      const lon = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const ele = parts.length >= 3 && parts[2] !== '' ? parseFloat(parts[2]) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        pts.push({
          lat: lat,
          lon: lon,
          ele: Number.isFinite(ele) ? ele : null
        });
      }
    }
    return pts;
  }

  function cleanKmlDescription(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    // Strip basic HTML tags if KML wraps description in HTML
    return trimmed.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function buildGpxFromData(data) {
    const doc = createEmptyGpxDoc();
    const gpxRoot = doc.documentElement;

    const wpts = data.waypoints || [];
    for (let i = 0; i < wpts.length; i += 1) {
      const w = wpts[i];
      const wptEl = createGpxElement(doc, 'wpt');
      wptEl.setAttribute('lat', formatCoord(w.lat));
      wptEl.setAttribute('lon', formatCoord(w.lon));
      if (w.ele !== null && w.ele !== undefined && Number.isFinite(w.ele)) {
        const eleEl = createGpxElement(doc, 'ele');
        eleEl.textContent = formatEle(w.ele);
        wptEl.appendChild(eleEl);
      }
      if (w.name) {
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = w.name;
        wptEl.appendChild(nameEl);
      }
      if (w.desc) {
        const descEl = createGpxElement(doc, 'desc');
        descEl.textContent = w.desc;
        wptEl.appendChild(descEl);
      }
      if (w.type) {
        const typeEl = createGpxElement(doc, 'type');
        typeEl.textContent = w.type;
        wptEl.appendChild(typeEl);
      }
      gpxRoot.appendChild(wptEl);
    }

    const trks = data.tracks || [];
    for (let t = 0; t < trks.length; t += 1) {
      const trkData = trks[t];
      const trkEl = createGpxElement(doc, 'trk');
      if (trkData.name) {
        const nameEl = createGpxElement(doc, 'name');
        nameEl.textContent = trkData.name;
        trkEl.appendChild(nameEl);
      }
      if (trkData.desc) {
        const descEl = createGpxElement(doc, 'desc');
        descEl.textContent = trkData.desc;
        trkEl.appendChild(descEl);
      }
      const segments = trkData.segments || [];
      for (let s = 0; s < segments.length; s += 1) {
        const segPts = segments[s];
        if (!segPts || segPts.length === 0) continue;
        const segEl = createGpxElement(doc, 'trkseg');
        for (let p = 0; p < segPts.length; p += 1) {
          const pt = segPts[p];
          const trkptEl = createGpxElement(doc, 'trkpt');
          trkptEl.setAttribute('lat', formatCoord(pt.lat));
          trkptEl.setAttribute('lon', formatCoord(pt.lon));
          if (pt.ele !== null && pt.ele !== undefined && Number.isFinite(pt.ele)) {
            const eleEl = createGpxElement(doc, 'ele');
            eleEl.textContent = formatEle(pt.ele);
            trkptEl.appendChild(eleEl);
          }
          segEl.appendChild(trkptEl);
        }
        trkEl.appendChild(segEl);
      }
      if (getDirectChildren(trkEl, 'trkseg').length > 0) {
        gpxRoot.appendChild(trkEl);
      }
    }

    return formatXml(doc);
  }

  function formatCoord(num) {
    return Number(num).toFixed(7).replace(/\.?0+$/, '');
  }

  function formatEle(num) {
    return Number(num).toFixed(1).replace(/\.0$/, '');
  }

  function convertKmlToGpx(doc) {
    const rootName = localName(doc.documentElement);
    if (rootName === 'gpx') {
      throw new Error('The editor already contains GPX XML.');
    }
    if (rootName !== 'kml') {
      throw new Error('Expected a <kml> root element, found <' + rootName + '>.');
    }

    const root = doc.documentElement;
    const docEl = getFirstDirectChild(root, 'Document') || getFirstDirectChild(root, 'Folder') || root;
    const docNameEl = getFirstDirectChild(docEl, 'name');
    const docDescEl = getFirstDirectChild(docEl, 'description');
    const fallbackName = docNameEl ? docNameEl.textContent.trim() : '';
    const fallbackDesc = docDescEl ? cleanKmlDescription(docDescEl.textContent) : '';

    const placemarks = getElementsByLocalName(root, 'Placemark');
    const waypoints = [];
    const tracks = [];

    for (let i = 0; i < placemarks.length; i += 1) {
      const pm = placemarks[i];
      const nameEl = getFirstDirectChild(pm, 'name');
      const descEl = getFirstDirectChild(pm, 'description');
      const pmName = nameEl ? nameEl.textContent.trim() : '';
      const pmDesc = descEl ? cleanKmlDescription(descEl.textContent) : '';

      const points = getElementsByLocalName(pm, 'Point');
      for (let p = 0; p < points.length; p += 1) {
        const coordsEl = getFirstDirectChild(points[p], 'coordinates');
        if (!coordsEl) continue;
        const parsed = parseKmlCoordinates(coordsEl.textContent);
        if (parsed.length > 0) {
          waypoints.push({
            lat: parsed[0].lat,
            lon: parsed[0].lon,
            ele: parsed[0].ele,
            name: pmName || 'Waypoint',
            desc: pmDesc
          });
        }
      }

      const segments = [];
      const lineStrings = getElementsByLocalName(pm, 'LineString');
      for (let l = 0; l < lineStrings.length; l += 1) {
        const coordsEl = getFirstDirectChild(lineStrings[l], 'coordinates');
        if (!coordsEl) continue;
        const parsed = parseKmlCoordinates(coordsEl.textContent);
        if (parsed.length > 0) {
          segments.push(parsed);
        }
      }

      // Support <gx:Track> elements
      const gxTracks = getElementsByLocalName(pm, 'Track');
      for (let gt = 0; gt < gxTracks.length; gt += 1) {
        const coords = getDirectChildren(gxTracks[gt], 'coord');
        const gxPts = [];
        for (let c = 0; c < coords.length; c += 1) {
          const parts = coords[c].textContent.trim().split(/\s+/);
          if (parts.length < 2) continue;
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const ele = parts.length >= 3 ? parseFloat(parts[2]) : NaN;
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            gxPts.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null });
          }
        }
        if (gxPts.length > 0) {
          segments.push(gxPts);
        }
      }

      if (segments.length > 0) {
        tracks.push({
          name: pmName || fallbackName || 'KML Track',
          desc: pmDesc || fallbackDesc,
          segments
        });
      }
    }

    if (waypoints.length === 0 && tracks.length === 0) {
      throw new Error('No <Point>, <LineString>, or <gx:Track> geometries found in KML.');
    }

    const xml = buildGpxFromData({ waypoints, tracks });
    return {
      xml,
      waypointCount: waypoints.length,
      trackCount: tracks.length
    };
  }

  // =========================================================================
  // Binary Garmin FIT -> GPX Converter (Zero Third-Party Libraries)
  // =========================================================================

  function decodeFitString(bytes, offset, size) {
    let end = offset;
    const limit = offset + size;
    while (end < limit && bytes[end] !== 0) {
      end += 1;
    }
    if (end === offset) return '';
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(bytes.subarray(offset, end)).trim();
    }
    let out = '';
    for (let i = offset; i < end; i += 1) {
      out += String.fromCharCode(bytes[i]);
    }
    return out.trim();
  }

  function readFitFieldValue(view, bytes, offset, size, baseType, littleEndian) {
    const typeId = baseType & 0x1f;
    switch (typeId) {
      case 0: // enum
      case 2: { // uint8
        if (size < 1) return null;
        const val = bytes[offset];
        return val === 0xff ? null : val;
      }
      case 1: { // sint8
        if (size < 1) return null;
        const val = view.getInt8(offset);
        return val === 0x7f ? null : val;
      }
      case 3: { // sint16
        if (size < 2) return null;
        const val = view.getInt16(offset, littleEndian);
        return val === 0x7fff ? null : val;
      }
      case 4: { // uint16
        if (size < 2) return null;
        const val = view.getUint16(offset, littleEndian);
        return val === 0xffff ? null : val;
      }
      case 5: { // sint32
        if (size < 4) return null;
        const val = view.getInt32(offset, littleEndian);
        return val === 0x7fffffff ? null : val;
      }
      case 6: { // uint32
        if (size < 4) return null;
        const val = view.getUint32(offset, littleEndian);
        return val === 0xffffffff ? null : val;
      }
      case 7: // string
        return decodeFitString(bytes, offset, size);
      case 8: { // float32
        if (size < 4) return null;
        const val = view.getFloat32(offset, littleEndian);
        return Number.isNaN(val) ? null : val;
      }
      case 9: { // float64
        if (size < 8) return null;
        const val = view.getFloat64(offset, littleEndian);
        return Number.isNaN(val) ? null : val;
      }
      case 10: { // uint8z
        if (size < 1) return null;
        const val = bytes[offset];
        return val === 0 ? null : val;
      }
      case 11: { // uint16z
        if (size < 2) return null;
        const val = view.getUint16(offset, littleEndian);
        return val === 0 ? null : val;
      }
      case 12: { // uint32z
        if (size < 4) return null;
        const val = view.getUint32(offset, littleEndian);
        return val === 0 ? null : val;
      }
      default:
        return null;
    }
  }

  function semicirclesToDegrees(sc) {
    return sc * (180 / 2147483648);
  }

  function parseFitToGpx(arrayBuffer, defaultName) {
    if (!arrayBuffer || arrayBuffer.byteLength < 14) {
      throw new Error('File is too small to be a valid FIT file.');
    }

    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(arrayBuffer);
    const headerSize = bytes[0];
    if (headerSize < 12 || headerSize > bytes.length) {
      throw new Error('Invalid FIT header size.');
    }

    const sig = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (sig !== '.FIT') {
      throw new Error('Invalid FIT file signature (missing ".FIT" header).');
    }

    const dataSize = view.getUint32(4, true);
    const endOffset = Math.min(bytes.length, headerSize + dataSize);
    let offset = headerSize;

    const definitions = Object.create(null);
    let courseName = '';
    const trackPoints = [];
    const waypoints = [];

    function readDataMessage(def) {
      const vals = Object.create(null);
      for (let i = 0; i < def.fields.length; i += 1) {
        const f = def.fields[i];
        if (offset + f.size > endOffset) {
          throw new Error('Unexpected end of FIT data while reading record.');
        }
        const value = readFitFieldValue(view, bytes, offset, f.size, f.baseType, def.littleEndian);
        if (value !== null) {
          vals[f.fieldDefNum] = value;
        }
        offset += f.size;
      }
      if (def.devDataSize > 0) {
        offset += def.devDataSize;
      }

      if (def.globalMsgNum === 31) {
        // course
        if (typeof vals[5] === 'string' && vals[5]) {
          courseName = vals[5];
        }
      } else if (def.globalMsgNum === 20) {
        // record
        const latSc = vals[0];
        const lonSc = vals[1];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            let ele = null;
            if (typeof vals[78] === 'number') {
              ele = vals[78] / 5 - 500;
            } else if (typeof vals[2] === 'number') {
              ele = vals[2] / 5 - 500;
            }
            trackPoints.push({ lat, lon, ele });
          }
        }
      } else if (def.globalMsgNum === 32) {
        // course_point
        const latSc = vals[2];
        const lonSc = vals[3];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const typeName = typeof vals[5] === 'number' ? COURSE_POINT_TYPES[vals[5]] || '' : '';
            waypoints.push({
              lat,
              lon,
              ele: null,
              name: typeof vals[6] === 'string' && vals[6] ? vals[6] : typeName || 'Waypoint',
              type: typeName
            });
          }
        }
      } else if (def.globalMsgNum === 29) {
        // location
        const latSc = vals[1];
        const lonSc = vals[2];
        if (typeof latSc === 'number' && typeof lonSc === 'number') {
          const lat = semicirclesToDegrees(latSc);
          const lon = semicirclesToDegrees(lonSc);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            const ele = typeof vals[4] === 'number' ? vals[4] / 5 - 500 : null;
            waypoints.push({
              lat,
              lon,
              ele,
              name: typeof vals[0] === 'string' && vals[0] ? vals[0] : 'Waypoint'
            });
          }
        }
      }
    }

    while (offset < endOffset) {
      const header = bytes[offset];
      offset += 1;

      if ((header & 0x80) !== 0) {
        const localMsgType = (header >> 5) & 0x03;
        const def = definitions[localMsgType];
        if (!def) {
          throw new Error('FIT parse error: missing definition for compressed timestamp local message ' + localMsgType);
        }
        readDataMessage(def);
      } else {
        const isDefinition = (header & 0x40) !== 0;
        const hasDevFields = (header & 0x20) !== 0;
        const localMsgType = header & 0x0f;

        if (isDefinition) {
          if (offset + 5 > endOffset) {
            throw new Error('Unexpected end of FIT data in definition header.');
          }
          offset += 1; // reserved
          const arch = bytes[offset];
          offset += 1;
          const littleEndian = arch === 0;
          const globalMsgNum = view.getUint16(offset, littleEndian);
          offset += 2;
          const numFields = bytes[offset];
          offset += 1;

          if (offset + numFields * 3 > endOffset) {
            throw new Error('Unexpected end of FIT data in field definitions.');
          }
          const fields = [];
          for (let i = 0; i < numFields; i += 1) {
            fields.push({
              fieldDefNum: bytes[offset],
              size: bytes[offset + 1],
              baseType: bytes[offset + 2]
            });
            offset += 3;
          }

          let devDataSize = 0;
          if (hasDevFields) {
            const numDevFields = bytes[offset];
            offset += 1;
            for (let i = 0; i < numDevFields; i += 1) {
              devDataSize += bytes[offset + 1];
              offset += 3;
            }
          }

          definitions[localMsgType] = {
            littleEndian,
            globalMsgNum,
            fields,
            devDataSize
          };
        } else {
          const def = definitions[localMsgType];
          if (!def) {
            throw new Error('FIT parse error: missing definition for local message ' + localMsgType);
          }
          readDataMessage(def);
        }
      }
    }

    if (trackPoints.length === 0 && waypoints.length === 0) {
      throw new Error('No GPS track points or waypoints found in this FIT file.');
    }

    const trackName = courseName || (defaultName ? defaultName.replace(/\.fit$/i, '') : 'FIT Track');
    const tracks = trackPoints.length > 0 ? [{ name: trackName, segments: [trackPoints] }] : [];
    const xml = buildGpxFromData({ waypoints, tracks });

    return {
      xml,
      trackPointCount: trackPoints.length,
      waypointCount: waypoints.length
    };
  }

  // =========================================================================
  // Waypoint Helpers
  // =========================================================================

  function parseCombinedLatLon(text) {
    const raw = (text || '').trim();
    if (!raw) return null;
    const match = raw.match(/^\s*([+-]?\d+(?:\.\d+)?)\s*[,\s]\s*([+-]?\d+(?:\.\d+)?)\s*$/);
    if (!match) return null;
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latStr: match[1], lonStr: match[2], lat, lon };
  }

  function parseSourcePointSnippet(text) {
    const raw = (text || '').trim();
    if (!raw) return null;

    let latStr = '';
    let lonStr = '';
    let eleStr = '';
    let nameStr = '';
    let descStr = '';

    // Try XML parsing first when valid snippet is provided
    try {
      const parser = getDomParser();
      const doc = parser.parseFromString(raw, 'application/xml');
      const root = doc.documentElement;
      if (root && localName(root) !== 'parsererror' && !doc.getElementsByTagName('parsererror').length) {
        const ptEl =
          localName(root) === 'trkpt' || localName(root) === 'rtept' || localName(root) === 'wpt'
            ? root
            : getElementsByLocalName(root, 'trkpt')[0] ||
              getElementsByLocalName(root, 'rtept')[0] ||
              getElementsByLocalName(root, 'wpt')[0];
        if (ptEl) {
          latStr = (ptEl.getAttribute('lat') || '').trim();
          lonStr = (ptEl.getAttribute('lon') || '').trim();
          const eleEl = getFirstDirectChild(ptEl, 'ele');
          const nameEl = getFirstDirectChild(ptEl, 'name');
          const descEl = getFirstDirectChild(ptEl, 'desc');
          if (eleEl) eleStr = eleEl.textContent.trim();
          if (nameEl) nameStr = nameEl.textContent.trim();
          if (descEl) descStr = descEl.textContent.trim();
        }
      }
    } catch (_err) {
      // Fallback to regex extraction below
    }

    if (!latStr || !lonStr) {
      const latMatch = raw.match(/\blat\s*=\s*["']([^"']+)["']/i);
      const lonMatch = raw.match(/\blon\s*=\s*["']([^"']+)["']/i);
      if (latMatch) latStr = latMatch[1].trim();
      if (lonMatch) lonStr = lonMatch[1].trim();
    }
    if (!eleStr) {
      const eleMatch = raw.match(/<(?:\w+:)?ele[^>]*>([^<]+)<\/(?:\w+:)?ele>/i);
      if (eleMatch) eleStr = eleMatch[1].trim();
    }
    if (!nameStr) {
      const nameMatch = raw.match(/<(?:\w+:)?name[^>]*>([^<]+)<\/(?:\w+:)?name>/i);
      if (nameMatch) nameStr = nameMatch[1].trim();
    }
    if (!descStr) {
      const descMatch = raw.match(/<(?:\w+:)?desc[^>]*>([^<]+)<\/(?:\w+:)?desc>/i);
      if (descMatch) descStr = descMatch[1].trim();
    }

    if (!latStr || !lonStr) return null;
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      latStr,
      lonStr,
      eleStr,
      nameStr,
      descStr
    };
  }

  function createWaypointElement(doc, fields) {
    const lat = parseFloat(fields.lat);
    const lon = parseFloat(fields.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      throw new Error('Enter a valid Latitude between -90 and 90.');
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error('Enter a valid Longitude between -180 and 180.');
    }

    const wptEl = createGpxElement(doc, 'wpt');
    wptEl.setAttribute('lat', String(fields.lat).trim());
    wptEl.setAttribute('lon', String(fields.lon).trim());

    const orderedFields = [
      ['ele', fields.ele],
      ['name', fields.name],
      ['desc', fields.desc],
      ['sym', fields.sym],
      ['type', fields.type]
    ];

    for (let i = 0; i < orderedFields.length; i += 1) {
      const tag = orderedFields[i][0];
      const val = (orderedFields[i][1] || '').trim();
      if (val) {
        const el = createGpxElement(doc, tag);
        el.textContent = val;
        wptEl.appendChild(el);
      }
    }

    return wptEl;
  }

  function buildWaypointXmlString(fields) {
    const doc = createEmptyGpxDoc();
    const wptEl = createWaypointElement(doc, fields);
    return formatXmlNode(wptEl, 0);
  }

  function insertWaypointIntoMainGpx(mainXmlText, fields) {
    const trimmed = (mainXmlText || '').trim();
    const doc = trimmed ? parseXml(trimmed) : createEmptyGpxDoc();
    ensureGpxRoot(doc);

    const wptEl = createWaypointElement(doc, fields);
    const root = doc.documentElement;
    // Insert directly below the <gpx ...> declaration (as first child element)
    root.insertBefore(wptEl, root.firstElementChild);

    return formatXml(doc);
  }

  // =========================================================================
  // Browser UI Controller
  // =========================================================================

  function initApp() {
    if (typeof document === 'undefined') return;

    const MAX_HISTORY = 30;
    const undoStack = [];
    const redoStack = [];
    let currentFileName = 'route.gpx';
    let detectedSourceEle = '';

    // Tabs
    const tabBtnMain = document.getElementById('tab-btn-main');
    const tabBtnWaypoints = document.getElementById('tab-btn-waypoints');
    const tabMain = document.getElementById('tab-main');
    const tabWaypoints = document.getElementById('tab-waypoints');

    // Main Toolbar & Editor
    const fileInput = document.getElementById('file-input');
    const fitInput = document.getElementById('fit-input');
    const btnOpenFile = document.getElementById('btn-open-file');
    const btnLoadFit = document.getElementById('btn-load-fit');
    const btnSaveFile = document.getElementById('btn-save-file');
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    const btnSample = document.getElementById('btn-sample');
    const btnClear = document.getElementById('btn-clear');
    const btnCopyXml = document.getElementById('btn-copy-xml');

    const xmlEditor = document.getElementById('xml-editor');
    const dropzone = document.getElementById('editor-dropzone');
    const dropOverlay = document.getElementById('drop-overlay');
    const chkWrap = document.getElementById('chk-wrap');
    const statusBanner = document.getElementById('status-banner');

    // Stats pills
    const statFormat = document.getElementById('stat-format');
    const statStructure = document.getElementById('stat-structure');
    const statPoints = document.getElementById('stat-points');
    const statDistance = document.getElementById('stat-distance');
    const statElevation = document.getElementById('stat-elevation');
    const statLines = document.getElementById('stat-lines');

    // Operations
    const chkRemoveExtensions = document.getElementById('chk-remove-extensions');
    const chkRemoveTime = document.getElementById('chk-remove-time');
    const chkRemoveNonEssential = document.getElementById('chk-remove-nonessential');
    const chkRemoveMetadata = document.getElementById('chk-remove-metadata');
    const chkRemoveEle = document.getElementById('chk-remove-ele');
    const btnCleanTags = document.getElementById('btn-clean-tags');
    const btnFormatXml = document.getElementById('btn-format-xml');

    const btnKmlToGpx = document.getElementById('btn-kml-to-gpx');
    const btnJoinSegments = document.getElementById('btn-join-segments');
    const btnTrkToRte = document.getElementById('btn-trk-to-rte');
    const btnRteToTrk = document.getElementById('btn-rte-to-trk');
    const btnSimplifyDp = document.getElementById('btn-simplify-dp');

    const btnUpdateWpNames = document.getElementById('btn-update-wp-names');
    const btnReverse = document.getElementById('btn-reverse');

    const removeMatchMode = document.getElementById('remove-match-mode');
    const removeRangeInput = document.getElementById('remove-range-input');
    const btnRemoveRange = document.getElementById('btn-remove-range');
    const trimStartInput = document.getElementById('trim-start-input');
    const trimEndInput = document.getElementById('trim-end-input');
    const btnTrimPoints = document.getElementById('btn-trim-points');

    // Waypoint Tab
    const wptCombined = document.getElementById('wpt-combined');
    const wptLat = document.getElementById('wpt-lat');
    const wptLon = document.getElementById('wpt-lon');
    const wptName = document.getElementById('wpt-name');
    const wptSym = document.getElementById('wpt-sym');
    const wptType = document.getElementById('wpt-type');
    const wptDesc = document.getElementById('wpt-desc');
    const wptSourcePt = document.getElementById('wpt-source-pt');
    const chkWptKeepEle = document.getElementById('chk-wpt-keep-ele');
    const wptDetectedEle = document.getElementById('wpt-detected-ele');
    const wptOutput = document.getElementById('wpt-output');
    const wptStatus = document.getElementById('wpt-status');

    const btnWptClear = document.getElementById('btn-wpt-clear');
    const btnWptCreate = document.getElementById('btn-wpt-create');
    const btnWptCopy = document.getElementById('btn-wpt-copy');
    const btnWptInsert = document.getElementById('btn-wpt-insert');

    function switchTab(tabName) {
      const isMain = tabName === 'main';
      tabBtnMain.classList.toggle('active', isMain);
      tabBtnMain.setAttribute('aria-selected', String(isMain));
      tabMain.classList.toggle('active', isMain);
      tabMain.classList.toggle('hidden', !isMain);

      tabBtnWaypoints.classList.toggle('active', !isMain);
      tabBtnWaypoints.setAttribute('aria-selected', String(!isMain));
      tabWaypoints.classList.toggle('active', !isMain);
      tabWaypoints.classList.toggle('hidden', isMain);
    }

    tabBtnMain.addEventListener('click', function () {
      switchTab('main');
    });
    tabBtnWaypoints.addEventListener('click', function () {
      switchTab('waypoints');
    });

    function showBanner(el, type, message, actionLabel, actionFn) {
      el.className = 'status-banner ' + type;
      el.textContent = '';
      const span = document.createElement('span');
      span.textContent = message;
      el.appendChild(span);

      if (actionLabel && typeof actionFn === 'function') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-inline-link';
        btn.textContent = actionLabel;
        btn.addEventListener('click', actionFn);
        el.appendChild(btn);
      }
    }

    function hideBanner(el) {
      el.className = 'status-banner hidden';
      el.textContent = '';
    }

    function updateHistoryButtons() {
      btnUndo.disabled = undoStack.length === 0;
      btnRedo.disabled = redoStack.length === 0;
    }

    function pushUndoState(prevValue) {
      if (undoStack.length > 0 && undoStack[undoStack.length - 1] === prevValue) {
        return;
      }
      undoStack.push(prevValue);
      if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
      }
      redoStack.length = 0;
      updateHistoryButtons();
    }

    function applyEditorChange(newValue, message, pushHistory) {
      if (pushHistory !== false) {
        pushUndoState(xmlEditor.value);
      }
      xmlEditor.value = newValue;
      refreshStats();
      if (message) {
        showBanner(statusBanner, 'success', message);
      } else {
        hideBanner(statusBanner);
      }
    }

    function refreshStats() {
      const s = computeStats(xmlEditor.value);
      if (!s.valid) {
        statFormat.textContent = 'Invalid XML';
        statStructure.textContent = 'Check syntax';
        statPoints.textContent = '—';
        statDistance.textContent = '—';
        statElevation.textContent = 'Ele: —';
        statLines.textContent = s.lineCount.toLocaleString() + ' lines';
        return;
      }

      statFormat.textContent = s.format;
      if (s.empty) {
        statStructure.textContent = '0 tracks • 0 routes';
        statPoints.textContent = '0 points • 0 wpt';
        statDistance.textContent = '0.00 km (0.00 mi)';
        statElevation.textContent = 'Ele: —';
        statLines.textContent = '0 lines';
        return;
      }

      statStructure.textContent =
        s.tracks + ' trk (' + s.segments + ' seg) • ' + s.routes + ' rte';

      const ptTotal = s.trkpts + s.rtepts;
      const rangeSuffix = s.wpRange ? ' (' + s.wpRange + ')' : '';
      statPoints.textContent = ptTotal.toLocaleString() + ' pts' + rangeSuffix + ' • ' + s.wpts + ' wpt';

      const km = s.distanceMeters / 1000;
      const mi = km * 0.621371;
      statDistance.textContent = km.toFixed(2) + ' km (' + mi.toFixed(2) + ' mi)';
      statElevation.textContent =
        s.elevationGain !== null ? 'Gain: +' + s.elevationGain.toLocaleString() + ' m' : 'Ele: —';
      statLines.textContent = s.lineCount.toLocaleString() + ' lines';
    }

    function runTransform(fn) {
      try {
        const doc = parseXml(xmlEditor.value);
        const result = fn(doc);
        applyEditorChange(result.xml, result.message, true);
      } catch (err) {
        showBanner(statusBanner, 'error', err.message || 'Operation failed.');
      }
    }

    async function copyTextToClipboard(text, targetBanner, label) {
      if (!text) {
        showBanner(targetBanner, 'error', 'Nothing to copy.');
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const temp = document.createElement('textarea');
          temp.value = text;
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }
        showBanner(targetBanner, 'success', label + ' copied to clipboard.');
      } catch (_err) {
        showBanner(targetBanner, 'error', 'Clipboard copy was blocked by the browser. Select and copy manually.');
      }
    }

    // Debounced live stats update on typing/pasting
    let statsTimer = null;
    xmlEditor.addEventListener('input', function () {
      clearTimeout(statsTimer);
      statsTimer = setTimeout(refreshStats, 120);
    });

    chkWrap.addEventListener('change', function () {
      xmlEditor.wrap = chkWrap.checked ? 'soft' : 'off';
    });

    // Undo / Redo
    btnUndo.addEventListener('click', function () {
      if (undoStack.length === 0) return;
      redoStack.push(xmlEditor.value);
      xmlEditor.value = undoStack.pop();
      updateHistoryButtons();
      refreshStats();
      showBanner(statusBanner, 'info', 'Undid last change.');
    });

    btnRedo.addEventListener('click', function () {
      if (redoStack.length === 0) return;
      undoStack.push(xmlEditor.value);
      xmlEditor.value = redoStack.pop();
      updateHistoryButtons();
      refreshStats();
      showBanner(statusBanner, 'info', 'Redid change.');
    });

    // Clear & Sample
    btnClear.addEventListener('click', function () {
      if (!xmlEditor.value) return;
      applyEditorChange('', 'Editor cleared.', true);
    });

    btnSample.addEventListener('click', function () {
      const sampleXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<gpx version="1.1" creator="ThirdPartyPlanner" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">\n' +
        '  <metadata>\n' +
        '    <name>Sample Ridge Loop</name>\n' +
        '    <time>2026-06-01T08:00:00Z</time>\n' +
        '  </metadata>\n' +
        '  <trk>\n' +
        '    <name>Sample Ridge Route</name>\n' +
        '    <trkseg>\n' +
        '      <trkpt lat="53.61000" lon="-2.81000"><ele>110</ele><time>2026-06-01T08:00:00Z</time><extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>132</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions></trkpt>\n' +
        '      <trkpt lat="53.62000" lon="-2.82000"><ele>140</ele><time>2026-06-01T08:03:00Z</time></trkpt>\n' +
        '      <trkpt lat="53.63000" lon="-2.83000"><ele>170</ele><time>2026-06-01T08:07:00Z</time><name>OldName</name></trkpt>\n' +
        '    </trkseg>\n' +
        '    <trkseg>\n' +
        '      <trkpt lat="53.64000" lon="-2.84000"><ele>200</ele><time>2026-06-01T08:12:00Z</time></trkpt>\n' +
        '      <trkpt lat="53.65000" lon="-2.85000"><ele>230</ele><time>2026-06-01T08:18:00Z</time></trkpt>\n' +
        '      <trkpt lat="53.66000" lon="-2.86000"><ele>260</ele><time>2026-06-01T08:25:00Z</time></trkpt>\n' +
        '    </trkseg>\n' +
        '  </trk>\n' +
        '</gpx>\n';
      currentFileName = 'sample_ridge_loop.gpx';
      applyEditorChange(sampleXml, 'Loaded sample GPX with 2 track segments, <time>, and <extensions>.', true);
    });

    // File Loading (.gpx, .kml, .fit, .xml)
    function loadUploadedFile(file) {
      if (!file) return;
      const lower = file.name.toLowerCase();
      currentFileName = file.name.replace(/\.(kml|fit|xml)$/i, '.gpx');
      if (!currentFileName.toLowerCase().endsWith('.gpx')) {
        currentFileName += '.gpx';
      }

      if (lower.endsWith('.fit')) {
        const reader = new FileReader();
        reader.onload = function (ev) {
          try {
            const res = parseFitToGpx(ev.target.result, file.name);
            applyEditorChange(
              res.xml,
              'Converted FIT file "' +
                file.name +
                '" to GPX (' +
                res.trackPointCount.toLocaleString() +
                ' track points, ' +
                res.waypointCount +
                ' waypoints).',
              true
            );
          } catch (err) {
            showBanner(statusBanner, 'error', 'FIT Conversion Error: ' + err.message);
          }
        };
        reader.onerror = function () {
          showBanner(statusBanner, 'error', 'Failed to read file "' + file.name + '".');
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = function (ev) {
          applyEditorChange(
            String(ev.target.result || ''),
            'Loaded "' + file.name + '".',
            true
          );
        };
        reader.onerror = function () {
          showBanner(statusBanner, 'error', 'Failed to read file "' + file.name + '".');
        };
        reader.readAsText(file, 'utf-8');
      }
    }

    btnOpenFile.addEventListener('click', function () {
      fileInput.value = '';
      fileInput.click();
    });

    btnLoadFit.addEventListener('click', function () {
      fitInput.value = '';
      fitInput.click();
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) {
        loadUploadedFile(fileInput.files[0]);
      }
    });

    fitInput.addEventListener('change', function () {
      if (fitInput.files && fitInput.files[0]) {
        loadUploadedFile(fitInput.files[0]);
      }
    });

    // Drag & Drop on Editor
    let dragDepth = 0;
    dropzone.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragDepth += 1;
      dropOverlay.classList.remove('hidden');
    });
    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
    });
    dropzone.addEventListener('dragleave', function (e) {
      e.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) {
        dropOverlay.classList.add('hidden');
      }
    });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dragDepth = 0;
      dropOverlay.classList.add('hidden');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Save & Copy
    btnSaveFile.addEventListener('click', function () {
      const content = xmlEditor.value;
      if (!content.trim()) {
        showBanner(statusBanner, 'error', 'Nothing to save — the XML editor is empty.');
        return;
      }
      let downloadName = currentFileName || 'route.gpx';
      try {
        const doc = parseXml(content);
        const nameEl =
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'trk'), 'name') ||
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'rte'), 'name') ||
          getFirstDirectChild(getFirstDirectChild(doc.documentElement, 'metadata'), 'name');
        if (nameEl && nameEl.textContent.trim() && downloadName === 'route.gpx') {
          const safe = nameEl.textContent
            .trim()
            .replace(/[^a-z0-9_\- ]/gi, '')
            .replace(/\s+/g, '_');
          if (safe) downloadName = safe + '.gpx';
        }
      } catch (_err) {
        // Save raw text even if invalid
      }
      const blob = new Blob([content], { type: 'application/gpx+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showBanner(statusBanner, 'success', 'Saved "' + downloadName + '".');
    });

    btnCopyXml.addEventListener('click', function () {
      copyTextToClipboard(xmlEditor.value, statusBanner, 'XML');
    });

    // Transformation Buttons
    btnFormatXml.addEventListener('click', function () {
      runTransform(function (doc) {
        return {
          xml: formatXml(doc),
          message: 'Reformatted XML with 2-space indentation.'
        };
      });
    });

    btnCleanTags.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = removeUnwantedTags(doc, {
          removeExtensions: chkRemoveExtensions.checked,
          removeTime: chkRemoveTime.checked,
          removeNonEssential: chkRemoveNonEssential.checked,
          removeMetadata: chkRemoveMetadata.checked,
          removeEle: chkRemoveEle.checked
        });
        return {
          xml: res.xml,
          message:
            'Removed ' +
            res.removedElements.toLocaleString() +
            ' tag(s) and ' +
            res.removedNsAttrs +
            ' unused namespace attribute(s).'
        };
      });
    });

    btnKmlToGpx.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertKmlToGpx(doc);
        return {
          xml: res.xml,
          message:
            'Converted KML to GPX (' +
            res.trackCount +
            ' track(s), ' +
            res.waypointCount +
            ' waypoint(s)).'
        };
      });
    });

    btnJoinSegments.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = joinTrackSegments(doc);
        return {
          xml: res.xml,
          message:
            res.mergedSegments > 0
              ? 'Joined ' + res.mergedSegments + ' extra <trkseg> segment(s).'
              : 'All tracks already have a single <trkseg>.'
        };
      });
    });

    btnTrkToRte.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertTracksToRoutes(doc);
        return {
          xml: res.xml,
          message:
            'Converted ' +
            res.convertedCount +
            ' track(s) to route(s) (' +
            res.totalAfter.toLocaleString() +
            ' points).'
        };
      });
    });

    btnRteToTrk.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = convertRoutesToTracks(doc);
        return {
          xml: res.xml,
          message:
            'Converted ' +
            res.convertedCount +
            ' route(s) to track(s) (' +
            res.totalPoints.toLocaleString() +
            ' points).'
        };
      });
    });

    function handleNumberPoints() {
      runTransform(function (doc) {
        const res = numberTrackAndRoutePoints(doc);
        return {
          xml: res.xml,
          message:
            'Named ' +
            res.totalNamed.toLocaleString() +
            ' point(s) sequentially (WP0001–' +
            formatWpName(res.totalNamed) +
            ').'
        };
      });
    }

    btnUpdateWpNames.addEventListener('click', handleNumberPoints);

    btnReverse.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = reverseTracksAndRoutes(doc);
        return {
          xml: res.xml,
          message: 'Reversed ' + res.reversedPoints.toLocaleString() + ' point(s).'
        };
      });
    });

    btnRemoveRange.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = removePointsByRange(doc, removeRangeInput.value, removeMatchMode.value);
        return {
          xml: res.xml,
          message:
            'Removed ' +
            res.removed.toLocaleString() +
            ' point(s) (' +
            res.remaining.toLocaleString() +
            ' remaining; not renumbered).'
        };
      });
    });

    btnTrimPoints.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = trimPointsByStartEnd(
          doc,
          trimStartInput.value,
          trimEndInput.value,
          removeMatchMode.value
        );
        return {
          xml: res.xml,
          message:
            'Trimmed ' +
            res.removed.toLocaleString() +
            ' point(s) (' +
            res.remaining.toLocaleString() +
            ' remaining; not renumbered).'
        };
      });
    });

    btnSimplifyDp.addEventListener('click', function () {
      runTransform(function (doc) {
        const res = simplifyTracksAndRoutes(doc, 10);
        return {
          xml: res.xml,
          message:
            'Simplified ' +
            res.totalBefore.toLocaleString() +
            ' → ' +
            res.totalAfter.toLocaleString() +
            ' point(s) (removed ' +
            res.removedCount.toLocaleString() +
            ').'
        };
      });
    });

    // Waypoint Tab Reactivity & Actions
    wptCombined.addEventListener('input', function () {
      const parsed = parseCombinedLatLon(wptCombined.value);
      if (parsed) {
        wptLat.value = parsed.latStr;
        wptLon.value = parsed.lonStr;
      }
    });

    function syncLatLonToCombined() {
      const lat = wptLat.value.trim();
      const lon = wptLon.value.trim();
      if (lat || lon) {
        wptCombined.value = lat && lon ? lat + ', ' + lon : lat + lon;
      } else {
        wptCombined.value = '';
      }
    }

    wptLat.addEventListener('input', syncLatLonToCombined);
    wptLon.addEventListener('input', syncLatLonToCombined);

    wptSourcePt.addEventListener('input', function () {
      const parsed = parseSourcePointSnippet(wptSourcePt.value);
      if (!parsed) {
        detectedSourceEle = '';
        wptDetectedEle.classList.add('hidden');
        wptDetectedEle.textContent = '';
        return;
      }
      wptLat.value = parsed.latStr;
      wptLon.value = parsed.lonStr;
      wptCombined.value = parsed.latStr + ', ' + parsed.lonStr;
      detectedSourceEle = parsed.eleStr || '';
      if (detectedSourceEle) {
        wptDetectedEle.textContent = 'Detected <ele>: ' + detectedSourceEle + ' m';
        wptDetectedEle.classList.remove('hidden');
      } else {
        wptDetectedEle.classList.add('hidden');
        wptDetectedEle.textContent = '';
      }
      if (!wptName.value.trim() && parsed.nameStr) {
        wptName.value = parsed.nameStr;
      }
      if (!wptDesc.value.trim() && parsed.descStr) {
        wptDesc.value = parsed.descStr;
      }
    });

    function collectWaypointFields() {
      return {
        lat: wptLat.value.trim(),
        lon: wptLon.value.trim(),
        ele: chkWptKeepEle.checked ? detectedSourceEle : '',
        name: wptName.value.trim(),
        sym: wptSym.value,
        type: wptType.value,
        desc: wptDesc.value.trim()
      };
    }

    btnWptClear.addEventListener('click', function () {
      wptCombined.value = '';
      wptLat.value = '';
      wptLon.value = '';
      wptName.value = '';
      wptSym.value = '';
      wptType.value = '';
      wptDesc.value = '';
      wptSourcePt.value = '';
      wptOutput.value = '';
      detectedSourceEle = '';
      wptDetectedEle.classList.add('hidden');
      wptDetectedEle.textContent = '';
      hideBanner(wptStatus);
    });

    btnWptCreate.addEventListener('click', function () {
      try {
        const xml = buildWaypointXmlString(collectWaypointFields());
        wptOutput.value = xml;
        showBanner(wptStatus, 'success', 'Created GPX <wpt> element.');
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    btnWptCopy.addEventListener('click', function () {
      try {
        const xml = buildWaypointXmlString(collectWaypointFields());
        wptOutput.value = xml;
        copyTextToClipboard(xml, wptStatus, 'Waypoint');
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    btnWptInsert.addEventListener('click', function () {
      try {
        const fields = collectWaypointFields();
        const wptPreview = buildWaypointXmlString(fields);
        wptOutput.value = wptPreview;

        const updatedMainXml = insertWaypointIntoMainGpx(xmlEditor.value, fields);
        applyEditorChange(
          updatedMainXml,
          'Added waypoint' + (fields.name ? ' "' + fields.name + '"' : '') + ' below <gpx> declaration.',
          true
        );
        showBanner(
          wptStatus,
          'success',
          'Added waypoint directly below <gpx> declaration in the main tab.',
          'View in Main Tab',
          function () {
            switchTab('main');
          }
        );
      } catch (err) {
        showBanner(wptStatus, 'error', err.message);
      }
    });

    refreshStats();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }

  // Export core functions for automated testing in Node/test runners
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      parseXml,
      formatXml,
      computeStats,
      simplifyPointsDP,
      simplifyTracksAndRoutes,
      removeUnwantedTags,
      joinTrackSegments,
      convertTracksToRoutes,
      convertRoutesToTracks,
      numberTrackAndRoutePoints,
      reverseTracksAndRoutes,
      removePointsByRange,
      trimPointsByStartEnd,
      convertKmlToGpx,
      parseFitToGpx,
      parseCombinedLatLon,
      parseSourcePointSnippet,
      buildWaypointXmlString,
      insertWaypointIntoMainGpx
    };
  }
})();
