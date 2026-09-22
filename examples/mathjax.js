// Optional equation typesetting. Geometry-only scenes never load this dependency.
let mathReady;
export function ensureMathJax() {
  if (window.MathJax?.tex2svgPromise) return Promise.resolve();
  if (mathReady) return mathReady;
  mathReady = (async () => {
    window.MathJax = {
      svg: { fontCache: "local" },
      options: { enableMenu: false },
      startup: { typeset: false },
    };
    const add = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(
            Error(
              "MathJax could not load. Check your connection or install the local development dependencies.",
            ),
          );
        };
        document.head.append(script);
      });
    try {
      await add("../node_modules/mathjax/es5/tex-svg.js");
    } catch {
      await add("https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js");
    }
    await window.MathJax.startup.promise;
  })().catch((error) => {
    mathReady = null;
    throw error;
  });
  return mathReady;
}
