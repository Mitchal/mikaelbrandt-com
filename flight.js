// Flies the "you want" line between a card and the folded line under the
// question, so the statement the visitor picked visibly travels to its new
// place instead of fading out in one spot and in at another.
//
// The line is measured where it is now and where it will be once the page
// has settled, then a copy is animated between the two: position, width and
// font size together, so the text rewraps on the way. The tick flies on its
// own. The real line stays invisible until the copy lands exactly on it.
const DURATION = 620;
const EASING = "cubic-bezier(.6, 0, .2, 1)";

let inFlight = null;

// Page coordinates, so a scroll during the flight carries the copy along.
function place(el) {
  const r = el.getBoundingClientRect();
  return {
    left: `${r.left + scrollX}px`,
    top: `${r.top + scrollY}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    fontSize: getComputedStyle(el).fontSize,
  };
}

function launch(copy, from, to, keys) {
  const pick = (box) => Object.fromEntries(keys.map((k) => [k, box[k]]));
  Object.assign(copy.style, pick(from));
  document.body.append(copy);
  return copy.animate([pick(from), pick(to)], { duration: DURATION, easing: EASING, fill: "forwards" }).finished;
}

// show(state) switches the page between states; prev and next are states.
// from() gives the line's parts now, to() in the next state: { line, text, mark }.
export function fly({ show, prev, next, from, to }) {
  inFlight?.();
  const root = document.documentElement;
  const src = from();
  const start = { text: place(src.text), mark: place(src.mark) };

  // Measure the destination as it will be after the fold has finished,
  // then put the old state back so the fold can still animate into it.
  root.classList.add("measuring");
  show(next);
  const dst = to();
  const end = { text: place(dst.text), mark: place(dst.mark) };
  show(prev);
  void root.offsetHeight;
  root.classList.remove("measuring");
  show(next);

  const text = document.createElement("span");
  text.className = "flyer";
  text.textContent = src.text.textContent;
  const mark = src.mark.cloneNode(true);
  mark.setAttribute("class", "flyer");

  src.line.classList.add("landing");
  dst.line.classList.add("landing");
  const land = () => {
    text.remove();
    mark.remove();
    src.line.classList.remove("landing");
    dst.line.classList.remove("landing");
    inFlight = null;
  };
  inFlight = land;
  Promise.all([
    launch(text, start.text, end.text, ["left", "top", "width", "fontSize"]),
    launch(mark, start.mark, end.mark, ["left", "top", "width", "height"]),
  ]).then(() => inFlight === land && land(), () => {});
}
