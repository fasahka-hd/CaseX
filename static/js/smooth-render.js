(() => {
  const proto = Element.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
  if (!descriptor?.set || !descriptor?.get) return;

  const sameNode = (a, b) => a && b && a.nodeType === b.nodeType && a.nodeName === b.nodeName;

  function syncAttributes(oldEl, newEl) {
    const oldAttrs = oldEl.attributes;
    for (let i = oldAttrs.length - 1; i >= 0; i--) {
      const name = oldAttrs[i].name;
      if (!newEl.hasAttribute(name)) oldEl.removeAttribute(name);
    }
    for (const attr of newEl.attributes) {
      if (oldEl.getAttribute(attr.name) !== attr.value) oldEl.setAttribute(attr.name, attr.value);
    }
  }

  function morph(oldNode, newNode, preserveRoot = false) {
    if (!sameNode(oldNode, newNode)) {
      oldNode.replaceWith(newNode.cloneNode(true));
      return;
    }
    if (oldNode.nodeType === Node.TEXT_NODE) {
      if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      return;
    }

    if (!preserveRoot) syncAttributes(oldNode, newNode);
    const oldChildren = Array.from(oldNode.childNodes);
    const newChildren = Array.from(newNode.childNodes);
    const common = Math.min(oldChildren.length, newChildren.length);

    for (let i = 0; i < common; i++) morph(oldChildren[i], newChildren[i]);
    for (let i = common; i < newChildren.length; i++) oldNode.appendChild(newChildren[i].cloneNode(true));
    for (let i = oldChildren.length - 1; i >= newChildren.length; i--) oldNode.removeChild(oldNode.childNodes[i]);
  }

  function stabilizeImages(root) {
    root.querySelectorAll('.art img').forEach(img => {
      // Skin cards are part of an interactive catalog; do not let lazy loading leave cards blank.
      img.loading = 'eager';
      img.decoding = 'async';
      if (!img.complete) img.style.visibility = 'hidden';
      const reveal = () => { img.style.visibility = 'visible'; };
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', () => {
        if (!img.dataset.fallback) {
          img.dataset.fallback = '1';
          img.src = '/chunks/empty.webp';
        }
        reveal();
      }, { once: true });
    });
  }

  Object.defineProperty(proto, 'innerHTML', {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      if (this.id !== 'app' || typeof value !== 'string') {
        descriptor.set.call(this, value);
        return;
      }
      const template = document.createElement('div');
      template.innerHTML = value;
      morph(this, template, true);
      stabilizeImages(this);
    }
  });
})();
