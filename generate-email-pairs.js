#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.join(__dirname, "sampledata");
const SOURCE_DOC = path.join(__dirname, "source-content.json");
const START = 1;
const COUNT = 300;
const NOW_SECONDS = Math.floor(Date.now() / 1000);
const YEAR_AGO_SECONDS = NOW_SECONDS - 365 * 24 * 60 * 60;

const source = JSON.parse(fs.readFileSync(SOURCE_DOC, "utf-8"));
const EMAIL_LIST = source.emailList;
const TOPIC_SETS = source.topicSets;
const PLACE_LIST = source.places;
const SUBJECT_PATTERNS = source.subjectPatterns;
const BODY_OPENERS = source.bodyOpeners;
const BODY_ACTIONS = source.bodyActions;
const BODY_CLOSERS = source.bodyClosers;
const TAG_POOL = source.tagPool;
const HISTORICAL_PEOPLE = source.historicalPeople || [];
const PERSON_MENTION_PATTERNS = source.personMentionPatterns || [];
const STATUS_WORDS = ["draft", "review", "approved", "blocked", "in-flight", "ready"];
const CADENCE_WORDS = ["daily", "weekly", "fortnightly", "monthly"];
const OWNER_WORDS = ["ops", "delivery", "qa", "platform", "security", "support"];

fs.mkdirSync(OUT_DIR, { recursive: true });

function pickFromList(list, idx) {
  return list[idx % list.length];
}

function renderTemplate(template, data) {
  return template
    .replaceAll("{term}", data.term)
    .replaceAll("{place}", data.place)
    .replaceAll("{personA}", data.personA || "")
    .replaceAll("{personB}", data.personB || "");
}

function buildRecipients(fromIndex, desiredCount) {
  const recipients = [];
  let cursor = fromIndex + 1;

  while (recipients.length < desiredCount) {
    const candidate = EMAIL_LIST[cursor % EMAIL_LIST.length];
    if (!recipients.includes(candidate)) {
      recipients.push(candidate);
    }
    cursor += 1;
  }

  return recipients;
}

for (let i = 0; i < COUNT; i += 1) {
  const n = START + i;
  const topicSet = pickFromList(TOPIC_SETS, i);
  const term = pickFromList(topicSet.terms, i * 2 + n * 3);

  // Intentionally include Canberra often so queries return multiple hits.
  const place = i % 4 === 0 || i % 9 === 0 ? "Canberra" : pickFromList(PLACE_LIST, i + n * 2);

  const fromIndex = (i * 3 + n) % EMAIL_LIST.length;
  const from = EMAIL_LIST[fromIndex];

  const toCount = i % 4 === 0 ? 3 : i % 2 === 0 ? 2 : 1;
  const to = buildRecipients(fromIndex, toCount);

  const subjectPattern = pickFromList(SUBJECT_PATTERNS, n + i);
  const opener = pickFromList(BODY_OPENERS, n * 2 + i);
  const actionA = pickFromList(BODY_ACTIONS, n + i * 3);
  const actionB = pickFromList(BODY_ACTIONS, n * 3 + i * 5 + 1);
  const closer = pickFromList(BODY_CLOSERS, n + i * 7);
  const tagA = pickFromList(TAG_POOL, n + i);
  const tagB = pickFromList(TAG_POOL, n * 2 + i + 3);
  const status = pickFromList(STATUS_WORDS, n + i * 11);
  const cadence = pickFromList(CADENCE_WORDS, n + i * 13);
  const owner = pickFromList(OWNER_WORDS, n + i * 17);
  const quarter = `Q${(n % 4) + 1}`;
  const initiativeCode = `INIT-${String((n * 97 + i * 31) % 10000).padStart(4, "0")}`;
  const personA = pickFromList(HISTORICAL_PEOPLE, n + i * 19) || "Ada Lovelace";
  const personB = pickFromList(HISTORICAL_PEOPLE, n * 2 + i * 23 + 1) || "Alan Turing";
  const personMentionPattern = pickFromList(PERSON_MENTION_PATTERNS, n + i * 5);

  const email = {
    id: `msg-${String(n).padStart(3, "0")}`,
    from,
    to,
    subject: `${renderTemplate(subjectPattern, { term, place, personA, personB })} | ${personA} | ${quarter} ${status} | ${initiativeCode}`,
    body: [
      renderTemplate(opener, { term, place, personA, personB }),
      `Current status is ${status} with ${cadence} updates owned by ${owner}.`,
      `${actionA} ${actionB}`,
      renderTemplate(personMentionPattern, { term, place, personA, personB }),
      `Reference initiative ${initiativeCode}.`,
      closer,
      `Tracking tags: ${tagA}, ${tagB}.`
    ].join(" "),
    topics: [topicSet.root, term, tagA],
    places: [place]
  };

  const persons = [...new Set([personA, personB])];

  const timestamp = Math.floor(YEAR_AGO_SECONDS + Math.random() * (NOW_SECONDS - YEAR_AGO_SECONDS));

  const metadata = {
    metadataAttributes: {
      userAccess: [from, ...to],
      persons,
      topics: email.topics,
      places: email.places,
      timestamp
    }
  };

  fs.writeFileSync(path.join(OUT_DIR, `email${n}.json`), `${JSON.stringify(email, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, `email${n}.json.metadata.json`), `${JSON.stringify(metadata, null, 2)}\n`);
}

console.log(`Generated ${COUNT} pairs from email${START}.json through email${START + COUNT - 1}.json`);
