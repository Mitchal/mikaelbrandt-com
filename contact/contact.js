// Sends the contact form without leaving the page and shows how it went.
// Without JavaScript the form still posts to the Worker, which answers with
// a plain thank-you page instead.
const form = document.querySelector("form.contact");
const status = form?.querySelector(".contact-status");
const button = form?.querySelector("button[type=submit]");

function setState(state) {
  form.dataset.state = state;
  status.textContent = form.dataset[state] || "";
  button.disabled = state === "sending";
}

async function send(event) {
  event.preventDefault();
  // The visitor may have switched offers since the page loaded.
  form.elements.offer.value = document.documentElement.dataset.track || "";
  form.elements.page.value = location.href;
  setState("sending");
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (!response.ok) throw new Error(`Contact form got ${response.status}`);
    setState("sent");
    status.focus();
  } catch (err) {
    console.error(err);
    setState("failed");
  }
}

form?.addEventListener("submit", send);
