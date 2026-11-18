// Two states, each with its own address: the fork (both cards, no answer)
// and a picked track (the cards folded into one line, the answer below).
// Picking a card folds the cards away while its "you want" line flies up
// to sit under the question; clicking that line goes back to the fork and
// the line flies back into its card. Without JavaScript the cards and the
// line are plain links between the same pages.
import { fly } from "./flight.js";

const root = document.documentElement;
const answer = document.getElementById("answer");
const picked = document.querySelector(".picked");
const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// The built links are relative so the same pages work under any path.
// Pin them to absolute now, before pushState moves the base they resolve
// against (otherwise /produkt/ would become /integrationer/produkt/).
document.querySelectorAll("a[href], link[href]").forEach((el) => el.setAttribute("href", el.href));

history.scrollRestoration = "manual";
history.replaceState({ track: root.dataset.track || "" }, "");

function show(track) {
  if (track) root.dataset.track = track;
  else delete root.dataset.track;
}

const cardLine = (track) => {
  const line = document.querySelector(`[data-choose="${track}"] .want`);
  return { line, text: line.querySelector("span"), mark: line.querySelector(".mark") };
};
const foldedLine = () => ({
  line: picked,
  text: picked.querySelector(`.picked-text[data-for="${root.dataset.track}"]`),
  mark: picked.querySelector(".picked-tick"),
});

// The folded line is smaller than in the card but should break on the
// same words. Width in em (relative to its own font size) does that: give
// it the card text's width measured in the card's em. The flight then only
// scales the text, it never rewraps.
function matchWrapping() {
  for (const track of ["a", "b"]) {
    const text = cardLine(track).text;
    const em = text.getBoundingClientRect().width / parseFloat(getComputedStyle(text).fontSize);
    picked.querySelector(`.picked-text[data-for="${track}"]`).style.width = `${em + 0.01}em`;
  }
}
matchWrapping();
document.fonts?.ready.then(matchWrapping); // the web font changes widths
let resizing = 0;
addEventListener("resize", () => {
  cancelAnimationFrame(resizing);
  resizing = requestAnimationFrame(matchWrapping);
});

// Fly the line only between the fork and a track; anything else (one track
// to another, reduced motion) just switches.
function go(next) {
  const prev = root.dataset.track || "";
  if (prev === next) return;
  if (still || (prev && next)) return show(next);
  const track = next || prev;
  const [from, to] = next ? [() => cardLine(track), foldedLine] : [foldedLine, () => cardLine(track)];
  fly({ show, prev, next, from, to });
}

// Folding pulls the answer up; if the visitor had scrolled down to reach
// a card (phones), bring the top of the fork back into view.
function settle() {
  const top = picked.getBoundingClientRect().top;
  if (top < 0) scrollBy({ top: top - 24, behavior: still ? "auto" : "smooth" });
  answer.focus({ preventScroll: true });
}

const plainClick = (event) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0);

document.querySelectorAll("[data-choose]").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (!plainClick(event)) return;
    event.preventDefault();
    history.pushState({ track: card.dataset.choose, fromFork: true }, "", card.href);
    go(card.dataset.choose);
    requestAnimationFrame(settle);
  });
});

// Back to the fork. If we got here from it, really go back, so the
// browser's own back button and this line agree; after a shared link
// there is no fork behind us, so step forward to it instead.
picked.addEventListener("click", (event) => {
  if (!plainClick(event)) return;
  event.preventDefault();
  if (history.state?.fromFork) return history.back();
  history.pushState({ track: "" }, "", picked.href);
  go("");
});

addEventListener("popstate", (event) => go(event.state?.track || ""));
