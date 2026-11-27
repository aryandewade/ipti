(function () {
  var host = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  var isSameOrigin =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === 'ipti.onrender.com' ||
    host.endsWith('.vercel.app');

  window.IPTI_API_BASE = isSameOrigin ? '' : 'https://ipti.onrender.com';

  window.iptiResolveUrl = function (url) {
    if (!url || typeof url !== 'string') return url || '';
    if (url.startsWith('/') && window.IPTI_API_BASE) {
      return window.IPTI_API_BASE + url;
    }
    return url;
  };

  if (typeof window !== 'undefined' && typeof window.fetch === 'function' && window.IPTI_API_BASE) {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/uploads/'))) {
        input = window.IPTI_API_BASE + input;
      }
      return origFetch(input, init);
    };
  }
})();
