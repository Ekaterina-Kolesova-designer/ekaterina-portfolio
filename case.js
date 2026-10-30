/* Scale only the static product illustrations, never the case's reading text. */
(() => {
  const observer = new ResizeObserver(entries => {
    for (const { target, contentRect } of entries) {
      const stage = target.querySelector(':scope > .screen-stage');
      if (stage) stage.style.transform = `scale(${contentRect.width / Number(stage.dataset.width)})`;
    }
  });
  document.querySelectorAll('.screen-fit').forEach(visual => observer.observe(visual));
})();
