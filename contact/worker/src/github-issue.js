// Turns a checked submission into an issue in the private inbox repo, so
// GitHub sends the notification. Everything the visitor typed goes inside
// code formatting: GitHub then never turns an "@name" in it into a mention
// (which would notify a stranger) or "#12" into a link.

const OFFERS = {
  a: { name: "Product foundations", picked: "AI agents built most of the product; wants confidence the foundations hold as they grow." },
  b: { name: "AI costs", picked: "Agents connect CRM, ERP and reports and the AI bill grows; wants lower AI costs without a new system." },
  "": { name: "No offer picked", picked: "Sent the form without a situation picked." },
};
const LANGUAGES = { en: "English", sv: "Swedish" };

// The domain the visitor was on, read from the page address the form sent.
function siteOf(page) {
  try {
    return new URL(page).host;
  } catch {
    return "unknown";
  }
}

// A fence one backtick longer than any run of backticks in the text, so
// the text can never close the block early.
function fenced(text) {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = "`".repeat(longest + 1);
  return `${fence}text\n${text}\n${fence}`;
}

export function issueFor({ email, message, offer, lang, page }) {
  const { name, picked } = OFFERS[offer];
  const language = LANGUAGES[lang];
  const details = [
    `**From:** \`${email}\``,
    `**Offer:** ${name}`,
    `**Their situation:** ${picked}`,
    `**Language:** ${language}`,
    `**Site:** ${siteOf(page)}`,
  ];
  if (page) details.push(`**Page:** \`${page}\``);
  const said = message ? fenced(message) : "_No message, only an email address._";
  return {
    title: `${name} (${language}): ${email}`,
    body: `${details.join("\n")}\n\n${said}`,
  };
}

export async function createIssue(env, submission) {
  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "mikaelbrandt-contact",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(issueFor(submission)),
  });
  if (!response.ok) throw new Error(`GitHub answered ${response.status}: ${await response.text()}`);
}
