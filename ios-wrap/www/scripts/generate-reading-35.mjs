/* Generate Reading 3–5 draft skills. Teacher must publish. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function q(id, prompt, choices, answer, difficulty, hint) {
  return { id, prompt, choices, answer, difficulty, hint };
}

function skill(spec, questions) {
  return {
    id: spec.id,
    subject: "Reading",
    grade_band: "3-5",
    grade_or_course: String(spec.grade),
    strand: spec.strand,
    skill_name: spec.name,
    standard_code: spec.best + " | " + spec.ccss,
    standard_codes: [spec.best, spec.ccss],
    prerequisite_skills: spec.prereq || [],
    teach_content: { explanation: spec.teach, worked_example: spec.example },
    question_bank: questions,
    grade_band_lock: "3-5",
    status: "draft"
  };
}

function pad(bank, makeMore) {
  let i = bank.length;
  while (bank.length < 20) {
    bank.push(makeMore(i));
    i += 1;
  }
  return bank;
}

const skills = [];

/* 1 Main idea 3 */
{
  const items = [
    q("r35-mi3-q1", "A paragraph says bees visit flowers, carry pollen, and make honey. The main idea is…", ["How bees work with flowers", "One yellow flower", "A rainy field"], "How bees work with flowers", 1, "What is almost every sentence about?"),
    q("r35-mi3-q2", "Sentences list a helmet, bright vest, and looking both ways. The main idea is…", ["How to bike safely", "A red helmet", "A long hill"], "How to bike safely", 2, "The list supports one point."),
    q("r35-mi3-q3", "A text tells how a seed needs water, soil, and light. Main idea?", ["What a seed needs to grow", "A watering can", "A brown pot"], "What a seed needs to grow", 1, "Group the details."),
    q("r35-mi3-q4", "Which sentence is a detail, not the main idea?", ["Owls hunt at night.", "Owls have sharp talons.", "Night birds have tools for hunting."], "Owls have sharp talons.", 3, "A detail is one fact."),
    q("r35-mi3-q5", "Title that fits a paragraph about recycling paper, cans, and bottles:", ["Ways we reuse materials", "One blue bin", "A lunch tray"], "Ways we reuse materials", 2, "The title should cover all three.")
  ];
  const extras = [
    ["Ants carry food, build tunnels, and guard the queen.", "How an ant colony works", "One crumb", "A picnic"],
    ["The park has swings, a slide, and a sandbox.", "What you can do at the park", "One swing", "A cloudy day"],
    ["Wolves hunt together, care for pups, and howl.", "How wolves live in a pack", "One howl", "A full moon"],
    ["You brush, floss, and visit the dentist.", "How to care for teeth", "A red toothbrush", "Candy"],
    ["Trains, buses, and bikes move people around a city.", "Ways people travel in a city", "One ticket", "A tunnel"],
    ["Frogs lay eggs, tadpoles swim, then frogs hop.", "The life of a frog", "One lily pad", "A snake"],
    ["Readers make a guess, check the text, and revise.", "How to infer while reading", "One picture", "A bookmark"],
    ["Maps show roads, rivers, and towns.", "What a map can show", "One compass rose", "A backpack"],
    ["Chefs chop, simmer, and taste as they cook.", "How a cook prepares food", "One spoon", "A recipe card only"],
    ["Storms bring wind, rain, and sometimes lightning.", "What happens in a storm", "One puddle", "A sunny picnic"],
    ["The museum shows bones, tools, and old letters.", "What you can learn at a museum", "One ticket stub", "A gift shop"],
    ["Players pass, shoot, and play defense.", "How a team plays the game", "One basketball", "A scoreboard"],
    ["Gardeners plant, water, and pull weeds.", "How to keep a garden growing", "One shovel", "A fence"],
    ["Firefighters roll hose, climb, and rescue.", "What firefighters do", "One helmet", "A dalmatian"],
    ["The article lists reduce, reuse, and recycle.", "Three ways to cut waste", "One bottle", "A slogan"]
  ];
  pad(items, (i) => {
    const e = extras[i - 5] || extras[0];
    return q("r35-mi3-q" + (i + 1), e[0] + " Main idea?", [e[1], e[2], e[3]], e[1], 2, "Name the whole, not one piece.");
  });
  skills.push(skill({
    id: "read-3-mi-1",
    grade: 3,
    strand: "Main idea & detail",
    name: "State the main idea of a short informational paragraph",
    best: "ELA.3.R.2.2",
    ccss: "RI.3.2",
    teach: "The main idea is what almost every sentence is doing. Details prove it. A title that names one object is usually too small.",
    example: "Bees visit flowers, carry pollen, and make honey. Main idea: how bees work — not “a yellow flower.”"
  }, items));
}

/* 2 Context clues 3 */
{
  const pairs = [
    ["The cavern was vast, stretching farther than we could see.", "vast", "very large", "very loud", "very new"],
    ["She was elated, grinning and bouncing on her toes.", "elated", "very happy", "very tired", "very late"],
    ["The broth was bland, with almost no flavor.", "bland", "tasteless", "spicy", "frozen"],
    ["He spoke in a faint voice we could barely hear.", "faint", "weak", "angry", "funny"],
    ["The path was soggy after the rain, wet and soft.", "soggy", "wet and soft", "steep", "dusty"],
    ["The kitten was timid and hid under the chair.", "timid", "shy", "hungry", "orange"],
    ["We had ample time, more than enough to finish.", "ample", "more than enough", "almost none", "exactly one minute"],
    ["The glass was fragile, so we packed it in foam.", "fragile", "easy to break", "heavy", "empty"],
    ["Her answer was brief: just one short sentence.", "brief", "short", "wrong", "loud"],
    ["The room was dim because the curtains were closed.", "dim", "not bright", "crowded", "painted"],
    ["They had to abandon the leaky boat and swim.", "abandon", "leave behind", "paint", "name"],
    ["The hike was rigorous, and our legs ached.", "rigorous", "very hard", "funny", "short"],
    ["A sudden gust, a strong rush of wind, slammed the door.", "gust", "a rush of wind", "a bird", "a hill"],
    ["The fabric was coarse, rough against his hand.", "coarse", "rough", "blue", "new"],
    ["She will reside on Oak Street, which means she will live there.", "reside", "live", "visit", "pave"],
    ["The joke was hilarious; everyone laughed for a minute.", "hilarious", "very funny", "mean", "quiet"],
    ["Please cease talking so the test can start.", "cease", "stop", "start", "whisper"],
    ["The pond was shallow. We could see the bottom.", "shallow", "not deep", "salty", "round"],
    ["He was generous and shared his extra pencils.", "generous", "willing to share", "late", "tall"],
    ["The signal was urgent: everyone had to move now.", "urgent", "needing action now", "optional", "secret"]
  ];
  const items = pairs.map((p, i) => q(
    "r35-cc3-q" + (i + 1),
    p[0] + " As used here, " + p[1] + " means…",
    [p[2], p[3], p[4]],
    p[2],
    i < 6 ? 1 : i < 14 ? 2 : 3,
    "The words next to it restated the meaning."
  ));
  skills.push(skill({
    id: "read-3-voc-1",
    grade: 3,
    strand: "Vocabulary & word study",
    name: "Use a restatement or example clue to mean a new word",
    best: "ELA.3.V.1.3",
    ccss: "L.3.4.a",
    teach: "Authors often restate a hard word in the same sentence. Look after a comma or the words “which means.”",
    example: "The cavern was vast, stretching farther than we could see. Vast = very large."
  }, items));
}

/* 3 Prefix un/re 3 */
{
  const pairs = [
    ["unhappy", "not happy", "happy again", "more happy"],
    ["retie", "tie again", "not tie", "tie bigger"],
    ["unfair", "not fair", "fair again", "very fair"],
    ["rebuild", "build again", "not build", "build first"],
    ["unlock", "open a lock / not locked", "lock again", "paint a lock"],
    ["reread", "read again", "not read", "read louder"],
    ["unkind", "not kind", "kind again", "very kind"],
    ["rewrite", "write again", "not write", "write first"],
    ["unsafe", "not safe", "safe again", "almost safe"],
    ["refill", "fill again", "not fill", "fill halfway"],
    ["unripe", "not ripe", "ripe again", "too ripe"],
    ["reheat", "heat again", "not heat", "heat first"],
    ["untrue", "not true", "true again", "almost true"],
    ["replay", "play again", "not play", "play first"],
    ["unclear", "not clear", "clear again", "very clear"],
    ["repack", "pack again", "not pack", "pack once"],
    ["unopened", "not opened", "opened again", "opened first"],
    ["recheck", "check again", "not check", "check later only"],
    ["unfinished", "not finished", "finished again", "finished first"],
    ["retake", "take again", "not take", "take first"]
  ];
  const items = pairs.map((p, i) => q(
    "r35-pre3-q" + (i + 1),
    "What does " + p[0] + " mean?",
    [p[1], p[2], p[3]],
    p[1],
    i < 8 ? 1 : 2,
    "un- = not. re- = again."
  ));
  skills.push(skill({
    id: "read-3-aff-1",
    grade: 3,
    strand: "Vocabulary & word study",
    name: "Read un- and re- to change a base word",
    best: "ELA.3.V.1.2",
    ccss: "L.3.4.b",
    prereq: ["read-3-voc-1"],
    teach: "un- flips a word to “not.” re- sends you back to “again.” Cover the prefix and read the base first.",
    example: "unhappy = not happy. reread = read again."
  }, items));
}

/* 4 Author purpose 3 */
{
  const items = [
    q("r35-ap3-q1", "A page lists steps to fold a paper crane. The author’s purpose is to…", ["Teach how to do something", "Make you laugh", "Tell a fairy tale"], "Teach how to do something", 1, "Steps = instruct."),
    q("r35-ap3-q2", "A story about a talking pancake that runs away is meant to…", ["Entertain", "Give bus times", "Warn about fire exits"], "Entertain", 1, "Silly story = entertain."),
    q("r35-ap3-q3", "A flyer says “Vote for clean parks on Tuesday.” Purpose?", ["Persuade", "Describe a cell", "Retell a myth"], "Persuade", 2, "It wants an action."),
    q("r35-ap3-q4", "A field guide names birds and what they eat. Purpose?", ["Inform", "Sell a joke", "Scare you"], "Inform", 2, "Facts about the world."),
    q("r35-ap3-q5", "Which line tries to persuade?", ["You should pack a water bottle.", "Water boils at 100°C.", "Once there was a thirsty crow."], "You should pack a water bottle.", 3, "“Should” pushes a choice.")
  ];
  const extra = [
    ["A comic about a goat in rain boots", "Entertain", "Give tax rules", "List minerals"],
    ["A poster: “Join the library. It’s free.”", "Persuade", "Define gravity", "Retell a battle"],
    ["A chart of rainfall by month", "Inform", "Tell a joke", "Sell boots"],
    ["Directions for a board game", "Teach how to do something", "Describe a sunset for fun only", "Argue about recess"],
    ["A speech: “We must save the reef.”", "Persuade", "Count fish species only", "Name colors"],
    ["A myth about why the sun rises", "Entertain", "Give a bus map", "Teach long division"],
    ["A news brief about a new bridge", "Inform", "Invent a dragon", "Sell candy"],
    ["A joke book page", "Entertain", "Explain fractions", "List state capitals"],
    ["“Buy this backpack — it lasts.”", "Persuade", "Define nylon", "Narrate a hike"],
    ["A diagram of a plant cell", "Inform", "Write a limerick", "Beg for a vote"],
    ["A recipe for oat muffins", "Teach how to do something", "Argue about recess", "Tell a ghost story"],
    ["A tall tale about a giant lumberjack", "Entertain", "Measure rainfall", "List safety rules"],
    ["“Please walk, don’t run, in halls.”", "Persuade", "Describe Jupiter", "Name the narrator"],
    ["A timeline of the American Revolution", "Inform", "Write a knock-knock joke", "Sell tickets only"],
    ["How-to: tie a square knot", "Teach how to do something", "Retell a fable", "Campaign for mayor"]
  ];
  pad(items, (i) => {
    const e = extra[i - 5] || extra[0];
    return q("r35-ap3-q" + (i + 1), e[0] + " Purpose?", [e[1], e[2], e[3]], e[1], 2, "Ask: teach, inform, entertain, or persuade?");
  });
  skills.push(skill({
    id: "read-3-pur-1",
    grade: 3,
    strand: "Author's purpose",
    name: "Tell whether a text informs, entertains, instructs, or persuades",
    best: "ELA.3.R.2.3",
    ccss: "RI.3.6",
    teach: "Inform = facts. Instruct = steps. Entertain = a story or joke. Persuade = the writer wants you to do or believe something.",
    example: "“Vote for clean parks” is persuade. A crane-folding page is instruct."
  }, items));
}

/* 5 Character trait 3 */
{
  const items = [];
  const rows = [
    ["Maya gave her extra apple to a classmate who forgot lunch.", "generous", "selfish", "sleepy"],
    ["Luis checked the lock three times before leaving.", "careful", "silly", "rude"],
    ["Nora kept trying the puzzle after it fell apart.", "persistent", "lazy", "mean"],
    ["Theo laughed when someone’s project tore.", "unkind", "helpful", "shy"],
    ["Priya asked both sides before she blamed anyone.", "fair", "rushed", "loud"],
    ["Sam hid the broken cup and said nothing.", "dishonest", "brave", "calm"],
    ["Ava stood up for a new student on the bus.", "brave", "greedy", "bored"],
    ["Ken shared the directions he had already written.", "helpful", "jealous", "late"],
    ["Lila talked through the whole silent reading time.", "disruptive", "focused", "timid"],
    ["Omar waited his turn even when the line was long.", "patient", "angry", "proud"],
    ["Jess copied answers from a neighbor’s paper.", "dishonest", "curious", "kind"],
    ["Rin practiced the piano every morning before school.", "disciplined", "careless", "shy"],
    ["Bo slammed the door after losing a game.", "hot-tempered", "gentle", "patient"],
    ["Cara invited the kid sitting alone.", "welcoming", "jealous", "tired"],
    ["Drew blamed the dog for homework he never did.", "untruthful", "responsible", "calm"],
    ["Eden carried both backpacks when a friend sprained a wrist.", "helpful", "selfish", "proud"],
    ["Finn quit as soon as the problem looked hard.", "easily discouraged", "persistent", "curious"],
    ["Gia whispered the answer so a friend wouldn’t freeze.", "kind", "rude", "vain"],
    ["Hugo took the last cookie and hid the box.", "selfish", "generous", "fair"],
    ["Ivy double-checked every source before she wrote.", "careful", "sloppy", "silly"]
  ];
  rows.forEach((r, i) => items.push(q("r35-ch3-q" + (i + 1), r[0] + " Which trait fits?", [r[1], r[2], r[3]], r[1], i < 8 ? 2 : 3, "Judge by what the character does, not a label in the text.")));
  skills.push(skill({
    id: "read-3-lit-1",
    grade: 3,
    strand: "Literary comprehension",
    name: "Name a character trait from what a character does",
    best: "ELA.3.R.1.1",
    ccss: "RL.3.3",
    teach: "A trait is how a character usually acts. Use actions, words, and choices. Do not guess from clothes or luck.",
    example: "Maya gave away her extra apple. Trait: generous — the act shows it."
  }, items));
}

/* Grade 4–5 compact set */
function bulk(spec, rows, stem) {
  const items = rows.map((r, i) => q(spec.id + "-q" + (i + 1), r[0], [r[1], r[2], r[3]], r[1], r[4] || 2, r[5] || stem));
  skills.push(skill(spec, items));
}

bulk({
  id: "read-4-ce-1",
  grade: 4,
  strand: "Text structure",
  name: "Identify cause and effect in an informational sentence",
  best: "ELA.4.R.2.1",
  ccss: "RI.4.5",
  teach: "Cause is why. Effect is what happened. Signal words: because, so, therefore, as a result.",
  example: "The river rose because the snow melted. Cause: melting snow. Effect: the river rose."
}, [
  ["The river rose because the snow melted. The cause is…", "The snow melted", "The river rose", "A boat sank", 1, "Because points to the cause."],
  ["We were late, so we missed the opening song. The effect is…", "We missed the opening song", "We left home", "The song was long", 2, "So points to the effect."],
  ["As a result of the drought, crops failed. Effect?", "Crops failed", "It rained", "Farmers sang", 2, "As a result names the outcome."],
  ["Which pair is cause → effect?", "Ice on the road → the bus slid", "The bus slid → ice formed last winter in another town", "A map → a title", 3, "The first event makes the second."],
  ["The lights went out. Therefore the concert paused. Cause?", "The lights went out", "The concert paused", "A ticket stub", 2, "Therefore follows the cause."],
  ["Because the battery died, the robot stopped. Effect?", "The robot stopped", "The battery died", "A new toy", 1, "Name what happened next."],
  ["Heavy rain fell; the creek jumped its banks. Cause?", "Heavy rain fell", "The creek jumped", "A picnic", 2, "What started it?"],
  ["She studied nightly. As a result her score rose. Effect?", "Her score rose", "She bought a pencil", "The test was Friday", 2, "As a result = effect."],
  ["The oven was left on, so the kitchen grew hot. Cause?", "The oven was left on", "The kitchen grew hot", "A recipe", 1, "So follows the cause."],
  ["A cracked dam leaked. Therefore the valley flooded. Effect?", "The valley flooded", "A cracked dam leaked", "A map key", 3, "Therefore introduces the result."],
  ["Which word most often signals a cause?", "because", "instead", "also", 2, "Because answers why."],
  ["Which word most often signals an effect?", "therefore", "during", "between", 2, "Therefore answers what followed."],
  ["The team practiced at dawn, so they were ready. Effect?", "They were ready", "Dawn came", "A whistle", 2, "So + clause = effect."],
  ["A bee sting swelled her hand. Cause?", "A bee sting", "Her hand swelled", "A picnic blanket", 1, "What started the swelling?"],
  ["No one watered the plant; it wilted. Effect?", "It wilted", "No one watered", "A pot", 2, "Second event is the effect."],
  ["Because the trail was icy, hikers turned back. Cause?", "The trail was icy", "Hikers turned back", "A summit", 2, "Because + clause = cause."],
  ["The printer jammed. As a result the job was late. Effect?", "The job was late", "The printer jammed", "Paper", 2, "As a result = effect."],
  ["A power surge hit, so the files vanished. Cause?", "A power surge hit", "The files vanished", "A folder", 3, "So follows the cause."],
  ["Which sentence is organized cause then effect?", "The glass dropped, so it cracked.", "The glass was blue and tall.", "Once there was a glass.", 3, "Look for so / because."],
  ["Pick the effect in “Wind knocked the sign down.”", "The sign fell", "Wind blew", "A street", 2, "What changed?"]
], "Cause is why. Effect is what changed.");

bulk({
  id: "read-4-fig-1",
  grade: 4,
  strand: "Figurative language",
  name: "Tell a simile from a metaphor",
  best: "ELA.4.R.3.1",
  ccss: "RL.4.4",
  teach: "A simile compares with like or as. A metaphor says one thing is another. Both are not literal.",
  example: "The cloud was like a pillow = simile. The cloud was a pillow = metaphor."
}, [
  ["“The cloud was like a pillow.” This is a…", "simile", "metaphor", "fact"],
  ["“The classroom was a zoo.” This is a…", "metaphor", "simile", "recipe"],
  ["Which uses like or as?", "He ran like a fox.", "He was a fox on the field.", "He ran home."],
  ["“Her voice was velvet.” Metaphor or simile?", "metaphor", "simile", "rhyme"],
  ["“As brave as a lion” is a…", "simile", "metaphor", "setting"],
  ["Literal meaning of “the classroom was a zoo”?", "It was noisy and wild", "Animals lived at desks", "It had a ticket booth"],
  ["“The lake was glass.” The author means the lake was…", "very still and smooth", "made of window glass", "cold only"],
  ["Pick the simile.", "The news hit like a wave.", "The news was a wave.", "The news aired at six."],
  ["Pick the metaphor.", "Time is a thief.", "Time moved like a thief.", "The clock ticked."],
  ["“Teeth like pearls” compares with…", "like", "is", "because"],
  ["“The wind whispered.” That figure is closest to…", "personification", "a fraction", "a caption"],
  ["Why writers use simile:", "To help you picture a comparison", "To list dates", "To end a paragraph with a number"],
  ["“He is a walking encyclopedia.” Means he…", "knows a lot", "is made of paper", "walks in a library only"],
  ["“As cold as ice” is…", "simile", "metaphor", "theme"],
  ["“The city is a heartbeat.” This is…", "metaphor", "simile", "index"],
  ["Which is literal?", "The bus was late.", "The bus was a snail.", "The bus crawled like a snail."],
  ["“Cheeks like roses” uses…", "like", "is", "therefore"],
  ["“My brother is a tornado in the kitchen.” Means he is…", "messy and fast", "made of wind", "outside"],
  ["A metaphor never needs…", "like or as", "a noun", "a sentence"],
  ["“Quiet as a mouse” is a…", "simile", "metaphor", "heading"]
].map((r) => [r[0], r[1], r[2], r[3], 2, "like/as = simile. is/was = often metaphor."]), "like/as = simile.");

bulk({
  id: "read-5-ev-1",
  grade: 5,
  strand: "Informational comprehension",
  name: "Match a claim to the sentence that supports it",
  best: "ELA.5.R.2.4",
  ccss: "RI.5.8",
  teach: "A claim is the point. Evidence is a fact, example, or datum that makes the point believable. Quotes and numbers often count.",
  example: "Claim: the library should stay open later. Evidence: 40 students stay after 4 p.m. for Wi-Fi."
}, [
  ["Claim: the library should stay open later. Best evidence?", "40 students stay after 4 p.m. for Wi-Fi", "Libraries are nice", "I like books"],
  ["Claim: recess helps learning. Best evidence?", "A study found higher afternoon scores after outdoor play", "Recess is fun", "Kids like balls"],
  ["Which sentence is a claim, not evidence?", "School should start later.", "Bus ridership rose 12%.", "The first bell is at 7:10."],
  ["Which sentence is evidence, not a claim?", "Bus ridership rose 12%.", "We ought to add a late bus.", "Mornings are hard."],
  ["A quote from a park ranger about trail damage is…", "evidence", "a title", "a joke"],
  ["“Everyone knows it” is weak because…", "It names no fact", "It is too short", "It uses a period"],
  ["Claim: helmets prevent injuries. Strongest support?", "ER visits dropped 18% after the helmet rule", "Helmets look cool", "My cousin has one"],
  ["Numbers in a text often work as…", "evidence", "setting", "rhyme"],
  ["Pick the claim.", "The cafeteria should offer a cold option.", "Monday’s menu listed beans.", "The line was 12 minutes."],
  ["Pick the evidence.", "Monday’s line was 12 minutes long.", "Lunch must change.", "Food matters."],
  ["A photograph of flooded streets supports a claim about…", "storm damage", "favorite colors", "a poem’s rhyme"],
  ["“I feel that” usually introduces…", "an opinion/claim", "a measured fact", "a caption"],
  ["Best evidence that a book is popular?", "It has a 40-person wait list", "The cover is blue", "The author is tall"],
  ["A counterclaim is…", "the other side’s point", "a page number", "a simile"],
  ["Why writers add data:", "To make a claim believable", "To decorate", "To end every paragraph"],
  ["Claim: the new path is safer. Weak support?", "I just like it", "Zero bike crashes this year on that block", "A traffic count"],
  ["An expert quote counts as evidence when…", "it is on the same point as the claim", "it is long", "it uses commas"],
  ["“Should,” “must,” and “ought” often mark a…", "claim", "caption", "setting"],
  ["Two facts that agree make evidence…", "stronger", "a poem", "a heading"],
  ["If the claim is about water quality, drop the sentence about…", "the soccer score", "test results from the river", "a boil-water notice"]
].map((r) => [r[0], r[1], r[2], r[3], 2, "Claim = the point. Evidence = the proof."]), "Match proof to the point.");

function twenty(rows, hint) {
  return rows.map((r) => [r[0], r[1], r[2], r[3], r[4] || 2, r[5] || hint]);
}

bulk({
  id: "read-3-thm-1",
  grade: 3,
  strand: "Literary comprehension",
  name: "Name the theme of a short fable-like story",
  best: "ELA.3.R.1.2",
  ccss: "RL.3.2",
  teach: "Theme is the lesson about life, not the plot. Plot is what happened. Theme is what it is about.",
  example: "A fox loses friends by lying. Theme: honesty keeps friends — not “a fox told a lie.”"
}, twenty([
  ["A girl shares her last crayon and later has help on a hard page. Theme?", "Kindness comes back around", "Crayons are wax", "School starts at 8"],
  ["A boy cries wolf twice; no one comes the third time. Theme?", "People stop trusting a liar", "Wolves are loud", "Farms have fences"],
  ["Two goats refuse to move and both fall. Theme?", "Stubbornness can hurt both sides", "Goats eat grass", "Bridges are wood"],
  ["A seed waits all winter and then grows. Theme?", "Patience can pay off", "Winter is cold", "Soil is brown"],
  ["Which is plot, not theme?", "The fox stole cheese", "Greed can leave you with nothing", "Sharing matters"],
  ["Which is theme, not plot?", "Hard work beats luck", "She won the race on Saturday", "The ribbon was blue"],
  ["A team loses until they pass instead of hogging. Theme?", "Working together works better", "Basketballs bounce", "Gyms have clocks"],
  ["Someone copies homework and fails the quiz anyway. Theme?", "Cheating does not teach you", "Quizzes have ten items", "Pencils break"],
  ["A traveler is rude to a baker and goes hungry. Theme?", "Respect opens doors", "Bread is warm", "Roads are long"],
  ["Best theme question:", "What did the author want you to learn about life?", "What color was the hat?", "How many pages?"],
  ["A mouse helps a lion and later is saved. Theme?", "Small friends can matter", "Lions roar", "Nets have rope"],
  ["Theme should be…", "true beyond this one story", "a character’s full name", "the page number"],
  ["“Never give up” fits a story about…", "retrying after a fall", "listing state birds", "a lunch menu"],
  ["A proud crow drops its cheese. Theme?", "Pride can cost you", "Cheese is yellow", "Trees have branches"],
  ["If every event is “then this happened,” you are listing…", "plot", "theme", "meter"],
  ["A child returns a lost wallet. Theme?", "Honesty is worth it", "Wallets have zippers", "The mall closes at 9"],
  ["Two themes can both fit if…", "both lessons are backed by the ending", "they rhyme", "they are short"],
  ["Drop this as theme:", "The dog’s name was Scout", "Loyalty holds a family together", "Courage is quiet"],
  ["Fables often end with…", "a clear lesson", "a graph", "an index"],
  ["Theme is closest to…", "the author’s message", "the setting’s weather", "the table of contents"]
], "Lesson about life, not the one event."));

bulk({
  id: "read-3-pov-1",
  grade: 3,
  strand: "Literary comprehension",
  name: "Tell who is narrating: I or he/she",
  best: "ELA.3.R.1.3",
  ccss: "RL.3.6",
  teach: "First person uses I, me, we. Third person uses he, she, they, and names. The narrator is not always the hero.",
  example: "“I hid the map.” First person. “Lena hid the map.” Third person."
}, twenty([
  ["“I hid the map under the porch.” Point of view?", "first person", "third person", "a recipe"],
  ["“Lena hid the map under the porch.” Point of view?", "third person", "first person", "second person only"],
  ["Which pronoun marks first person?", "I", "she", "they"],
  ["Which pronoun marks third person?", "he", "I", "me"],
  ["“We ran until the bell.” Narrator is…", "in the group (first person)", "outside naming kids", "the bell"],
  ["“Jamal thought the test was fair.” POV?", "third person", "first person", "a caption"],
  ["You can hear a character’s exact thoughts most easily in…", "first person", "a timeline", "an index"],
  ["“You should pack water,” if the book speaks to the reader, is closest to…", "second person", "third person limited only", "a metaphor"],
  ["The narrator says “my brother.” POV?", "first person", "third person", "informational heading"],
  ["The narrator says “her brother.” POV?", "third person", "first person", "a chart"],
  ["Why POV matters:", "It decides whose mind you sit in", "It sets font size", "It numbers pages"],
  ["Two characters argue. First person will show…", "one side from the inside", "a weather table", "chapter titles only"],
  ["“They boarded the train.” POV?", "third person", "first person", "a schedule"],
  ["Pick first person.", "I forgot my lunch.", "She forgot her lunch.", "The lunch line moved."],
  ["Pick third person.", "Owen tied his shoes.", "I tied my shoes.", "Tie your shoes."],
  ["If every sentence starts with a name, you are likely in…", "third person", "first person", "a form"],
  ["“My stomach dropped.” You are hearing…", "the narrator’s feeling", "the author’s birthday", "a glossary"],
  ["A story can switch POV only if…", "a new section makes the shift clear", "the font changes", "a word is bold"],
  ["Third person can still know thoughts if it is…", "third person limited or omniscient", "a photograph", "a blurb"],
  ["“Ask me later,” I said. POV?", "first person", "third person", "stage directions only"]
], "I/we = first. he/she/name = third."));

bulk({
  id: "read-3-inf-1",
  grade: 3,
  strand: "Literary comprehension",
  name: "Infer a feeling or reason the text does not state",
  best: "ELA.3.R.3.2",
  ccss: "RL.3.1",
  teach: "An inference uses a clue plus what you already know. It is not a wild guess and it is not a sentence copied from the page.",
  example: "Maya’s hands shook as she opened the envelope. Inference: she is nervous — the text never says the word."
}, twenty([
  ["Maya’s hands shook as she opened the envelope. You can infer she is…", "nervous", "hungry", "eight years old"],
  ["The dog hides when the suitcase comes out. Infer the dog…", "dislikes people leaving", "cannot see", "is a puppy only"],
  ["He reread the note four times and frowned. Infer he is…", "worried or confused", "finished packing", "teaching math"],
  ["Which is an inference, not a stated fact?", "She is embarrassed", "Her face turned red — wait, pick: she might feel embarrassed", "The gym is large"],
  ["Best clue that a character is proud:", "He stood taller and grinned", "He owns socks", "It was Tuesday"],
  ["Kids whisper and glance at a closed door. Infer…", "something secret is behind it", "the door is wood", "school has doors"],
  ["An inference must be…", "backed by a clue", "longer than the paragraph", "the first sentence"],
  ["“It was raining.” That sentence is…", "stated", "inferred", "a theme"],
  ["Empty chairs and a cold cake. Infer the party…", "already ended or few came", "is tomorrow only", "needs balloons only"],
  ["She gave one-word answers and stared at the floor. Infer she is…", "upset or shy", "tall", "the narrator’s cousin"],
  ["Do not infer from…", "a detail that is not there", "a shaking hand", "a slammed door"],
  ["The lights go off and people cheer. Infer it may be…", "a surprise or a show starting", "lunch", "a spelling test"],
  ["A good check:", "Could I point to the clue?", "Is my guess exciting?", "Does it rhyme?"],
  ["He pocketed the coin and looked both ways. Infer he…", "does not want to be seen", "likes copper", "is late for art"],
  ["Which question asks for inference?", "Why did she pause at the gate?", "What color is the gate?", "How many words?"],
  ["Steam on the window + coats on. Infer the weather is…", "cold outside", "a holiday", "after lunch"],
  ["A stated feeling uses words like…", "sad, angry, glad", "maybe, perhaps", "theme, plot"],
  ["Two clues beat one because…", "they confirm the same idea", "they rhyme", "they are bold"],
  ["He packed a flashlight and extra water. Infer the trip is…", "long or outdoor", "to the next classroom", "about painting"],
  ["If the text already says “she was furious,” you do not need to…", "infer that feeling", "read the next line", "notice quotes"]
], "Clue + what you know, not a guess."));

bulk({
  id: "read-3-feat-1",
  grade: 3,
  strand: "Informational comprehension",
  name: "Use a text feature to find information faster",
  best: "ELA.3.R.2.1",
  ccss: "RI.3.5",
  teach: "Features are tools around the sentences: title, heading, caption, diagram, glossary, index, table of contents. They point; they are not the whole article.",
  example: "A caption under a photo tells you what the picture is showing. A glossary defines a bold word."
}, twenty([
  ["A short line under a photo is a…", "caption", "index", "theme"],
  ["A list of chapter names in front is the…", "table of contents", "glossary", "caption"],
  ["Bold words defined at the back live in the…", "glossary", "index", "setting"],
  ["An A–Z list of topics and page numbers is an…", "index", "caption", "simile"],
  ["A heading helps you…", "see what the next section is about", "rhyme", "count syllables"],
  ["A diagram is most useful when you need…", "to see how parts fit", "a character’s feelings", "a joke"],
  ["Where do you look up what “habitat” means in that book?", "glossary", "index only if you guess pages", "the back cover blurb only"],
  ["Where do you find every page that mentions “volcanoes”?", "index", "caption", "first paragraph"],
  ["A map in a text is a feature that shows…", "place", "rhyme scheme", "the author’s age"],
  ["The title should name…", "the whole text", "one tiny detail", "the page count"],
  ["Captions are usually…", "next to a picture", "in the index", "the theme"],
  ["A timeline is best for…", "order of events", "defining a word", "a character trait"],
  ["Why authors add labels on a diagram:", "to name each part", "to entertain only", "to hide the caption"],
  ["Table of contents vs index: contents is…", "in chapter order", "A–Z", "under photos"],
  ["A sidebar often…", "adds a fact beside the main text", "replaces the title", "lists every page"],
  ["You need a pronunciation. Try the…", "glossary", "map key", "heading font"],
  ["A chart compares…", "numbers or categories", "themes of two novels only", "page color"],
  ["If a heading says “Desert Animals,” the section should be about…", "animals that live in deserts", "rain forests", "the author’s dog"],
  ["Features save time because they…", "point you to the spot", "remove the need to read", "change the theme"],
  ["A photograph without a caption is harder to use because…", "you may not know what it shows", "it has no pixels", "it cannot be printed"]
], "Use the tool around the sentences."));

bulk({
  id: "read-4-sum-1",
  grade: 4,
  strand: "Informational comprehension",
  name: "Choose the best summary of a short passage",
  best: "ELA.4.R.2.2",
  ccss: "RI.4.2",
  teach: "A summary restates the main idea plus the key supports in fewer words. It drops examples that only decorate. It does not add new opinions.",
  example: "Passage: bees pollinate, make honey, live in hives. Summary: Bees live in groups and help plants make seeds — not “I like honey.”"
}, twenty([
  ["A summary should include…", "the main idea and key supports", "every adjective", "your opinion"],
  ["A summary should drop…", "tiny extra examples", "the central idea", "the topic"],
  ["Which is a summary, not a retell of one scene?", "The article explains how storms form and why they weaken over land.", "First the wind blew. Then a hat flew.", "I was scared."],
  ["“I think this is cool” in a summary is…", "an opinion that does not belong", "a key support", "a heading"],
  ["Best summary length vs the passage:", "shorter", "longer", "exactly the same words"],
  ["If you copy four full sentences, you wrote…", "a lift, not a summary", "a perfect summary", "a caption"],
  ["Key support means…", "a detail the main idea needs", "the funniest line", "the last word"],
  ["A title can help a summary by…", "naming the topic", "replacing evidence", "listing page numbers"],
  ["Two articles, one summary each. Good check:", "Could a classmate who did not read it follow?", "Did I use the word very?", "Is it in ink?"],
  ["Which belongs in a summary of a whale article?", "Whales are mammals that must surface for air.", "The photo is pretty.", "My uncle saw a dolphin."],
  ["Retell vs summary: retell is…", "more blow-by-blow", "always shorter", "only headings"],
  ["Adding a fact the text never gave makes a summary…", "inaccurate", "stronger", "a glossary"],
  ["Order in a summary should follow…", "the text’s logic", "alphabetical words", "who spoke first at lunch"],
  ["A good first sentence of a summary often…", "states the main idea", "asks a riddle", "quotes a joke"],
  ["“In conclusion I loved it” is…", "not a summary move", "the main idea", "evidence"],
  ["Three details, one is a date of a side event. Drop…", "the side date if it is not needed", "the main cause", "the topic word"],
  ["Summaries use…", "your words plus the author’s ideas", "only the author’s adjectives", "emojis"],
  ["If two supports fight the heading, trust…", "the body that is consistent", "the longest word", "the caption font"],
  ["A summary of steps should keep…", "the order", "every brand name", "the author’s joke"],
  ["Pick the summary.", "Otters use tools and stay in family groups.", "The otter’s whisker twitched. Then it spun.", "Otters are my favorite."]
], "Shorter, accurate, no new opinion."));

bulk({
  id: "read-4-pov-1",
  grade: 4,
  strand: "Literary comprehension",
  name: "Contrast what two characters know or want",
  best: "ELA.4.R.1.3",
  ccss: "RL.4.6",
  teach: "Point of view also means what a character thinks. Two people can see the same event and want different things. Track who knows the secret.",
  example: "Jada knows the gift is a bike. Leo still thinks it is a book. Their points of view differ on the same box."
}, twenty([
  ["Jada knows the gift is a bike; Leo thinks it is a book. They differ because…", "they do not know the same fact", "the box is brown", "it is Saturday"],
  ["A secret only one character knows creates…", "dramatic irony / a gap in POV", "a caption", "a glossary"],
  ["“I won’t go,” said Noor. “We’ll be fine,” said Ben. They differ in…", "what they want or fear", "their shoes", "the chapter number"],
  ["To contrast two views, quote…", "each character’s words or thoughts", "the weather", "the page color"],
  ["The narrator likes the fox; the hen fears it. Same fox, different…", "points of view", "settings", "fonts"],
  ["A fair contrast uses…", "both sides", "only the hero", "the title"],
  ["If the text never shows Mina’s thoughts, do not claim…", "you know what Mina wants", "Mina spoke once", "there is a setting"],
  ["“Both were tired, but only Sage wanted to quit.” The contrast is…", "goal, not energy", "the trail length", "boot size"],
  ["First person makes it easy to miss…", "the other character’s full view", "the word I", "quotation marks"],
  ["A letter from each sister about the same week will likely…", "stress different details", "use the same verbs", "list the same groceries"],
  ["Track who has the map. That is tracking…", "knowledge", "rhyme", "captions"],
  ["Two reviews of one play disagree. That is…", "point of view", "setting only", "meter"],
  ["“He’s stealing,” thought Cal. The bag was Cal’s brother’s. Cal’s view is…", "mistaken", "a theme", "an index"],
  ["Best question:", "What does each character want here?", "How many commas?", "What font?"],
  ["A narrator who calls a town “home” may be…", "closer to that place than a tourist narrator", "wrong about maps", "the index"],
  ["When goals clash, the plot often…", "tightens", "lists features", "defines words"],
  ["Do not mix up narrator and character when…", "a side character is talking", "a heading appears", "a map is printed"],
  ["“We should tell,” vs “We should hide it.” Contrast in…", "choice", "setting weather", "chapter title"],
  ["Evidence of a view is…", "what they say, do, or think", "the author’s birthday", "the ISBN"],
  ["If both laugh at the same joke, their views on that joke…", "align", "must be theme", "are captions"]
], "Who knows what, and who wants what."));

bulk({
  id: "read-5-root-1",
  grade: 5,
  strand: "Vocabulary & word study",
  name: "Use a Greek or Latin root to mean an unfamiliar word",
  best: "ELA.5.V.1.2",
  ccss: "L.5.4.b",
  teach: "Roots travel. spect = look, struct = build, port = carry, scrib/script = write, phon = sound. Prefix and suffix ride on the root.",
  example: "Inspect = look into. Spect = look. Portable = can be carried."
}, twenty([
  ["spect most nearly means…", "look", "carry", "write"],
  ["port most nearly means…", "carry", "light", "water"],
  ["struct most nearly means…", "build", "sleep", "eat"],
  ["scrib/script most nearly means…", "write", "jump", "cut"],
  ["phon most nearly means…", "sound", "color", "time"],
  ["Inspect is closest to…", "look into carefully", "carry away", "build quickly"],
  ["A portable radio is one you can…", "carry", "plant", "freeze"],
  ["A construction crew’s job is to…", "build", "sing", "erase"],
  ["A manuscript is something…", "written", "sung only", "eaten"],
  ["A telephone carries…", "sound from far away", "bricks", "rain"],
  ["Spectator is a person who…", "looks on", "carries freight", "builds roofs"],
  ["Export means to…", "carry out of a place", "look inside", "write over"],
  ["Reconstruct means to…", "build again", "look away", "carry down"],
  ["Describe means to…", "write or tell how something is", "carry a box", "look last"],
  ["Symphony is built on…", "sound", "stone", "time only"],
  ["If bio means life, biography is…", "writing about a life", "a building plan", "a carried load"],
  ["If geo means earth, geology is…", "study of the earth", "a look in a mirror", "a loud sound"],
  ["Preview uses pre- plus view. It means…", "look before", "carry after", "write during"],
  ["Disruption of a structure is harm to something…", "built", "whispered", "carried only"],
  ["Pick the word that has “look.”", "respect (look back at worth)", "portable", "phonics"]
], "Find the root, then the affix."));

bulk({
  id: "read-5-cmp-1",
  grade: 5,
  strand: "Informational comprehension",
  name: "Compare how two short texts treat the same topic",
  best: "ELA.5.R.3.3",
  ccss: "RI.5.6",
  teach: "Same topic is not the same point. Ask what each author includes, leaves out, and wants you to believe. Use both texts, not the one you liked.",
  example: "Text A lists jobs on a farm. Text B argues farms should pay more. Same topic, different purpose."
}, twenty([
  ["Text A lists farm jobs. Text B argues for higher pay. They share a topic but differ in…", "purpose", "paper color", "word count only"],
  ["To compare two texts, first find…", "the shared topic", "the longest word", "the funnier joke"],
  ["An author who leaves out risks may be…", "pushing a brighter view", "writing a glossary", "counting pages"],
  ["Both texts mention bees. Only B gives colony-collapse numbers. B is more…", "data-heavy", "poetic", "like a fable"],
  ["A firsthand diary vs a textbook page. Difference in…", "point of view and closeness", "the existence of bees", "ink"],
  ["If A entertains and B instructs, the reader should…", "not expect the same job from each", "merge them into one narrator", "ignore headings"],
  ["Best comparison sentence:", "A explains the process; B argues a rule should change.", "Both have words.", "B is longer."],
  ["A photo essay vs an interview. Unique to the interview:", "quoted voice", "pictures only", "a map key only"],
  ["When facts conflict, a reader should…", "check which source is closer to evidence", "pick the nicer cover", "average the fonts"],
  ["Two storm articles. Only one names wind speed. That one is…", "more specific on force", "a poem", "a caption only"],
  ["Purpose can differ even if…", "the topic is identical", "the title matches letter for letter", "both use the word the"],
  ["A compare question wants…", "alike and different", "a retell of A only", "your favorite"],
  ["Leaving out the other side of an argument is…", "a choice that shapes the text", "a printing error always", "a caption"],
  ["Text A: how volcanoes form. B: a town after an eruption. A is more…", "process; B is more human impact", "both jokes", "both indexes"],
  ["Shared details show…", "overlap", "that one author copied a font", "theme of a novel"],
  ["A good note-taking move:", "two columns: A only / both / B only", "one long paragraph of feelings", "copy A twice"],
  ["If both conclude “wear a helmet,” they…", "agree on a claim", "must share every example", "are poems"],
  ["Tone words like “disaster” vs “event” hint at…", "attitude", "page size", "genre labels only"],
  ["You need both texts when the question says…", "compare / contrast / both authors", "define this word", "name the setting"],
  ["A trap is summarizing only the text you…", "preferred", "annotated", "finished second"]
], "Same topic, different job or view."));

bulk({
  id: "read-3-seq-1",
  grade: 3,
  strand: "Text structure",
  name: "Put informational steps in time order",
  best: "ELA.3.R.2.1",
  ccss: "RI.3.3",
  teach: "Sequence is order in time. Signal words: first, next, then, finally, before, after.",
  example: "Plant the seed. Then water. Finally wait."
}, twenty([
  ["First plant, then water, finally wait. Last step?", "Wait", "Plant", "Open the shed"],
  ["Which word best marks sequence?", "then", "instead", "also"],
  ["A recipe is usually organized by…", "sequence", "rhyme", "theme"],
  ["Before you slice the bread, you should…", "bake it", "eat it", "name it"],
  ["“Finally” most often points to…", "the last step", "the title", "a caption"],
  ["Mix, pour, bake. The middle step is…", "pour", "mix", "bake"],
  ["Which set is out of order for washing hands?", "dry, then soap, then water", "wet, soap, rinse, dry", "soap after water on"],
  ["A life-cycle diagram is a kind of…", "sequence", "argument", "joke"],
  ["“After the bell” tells you…", "when", "why someone is kind", "the theme"],
  ["To retell a how-to, keep…", "the order", "every adjective", "the author’s joke"],
  ["First / next / last is a…", "sequence frame", "metaphor", "glossary"],
  ["You cannot put on the lid…", "before the jar is filled if the steps say fill first", "ever", "on Tuesdays"],
  ["A timeline is closest to…", "sequence", "a character trait", "a simile"],
  ["“Meanwhile” means…", "at the same time", "never", "the opposite"],
  ["Which heading fits a sequence section?", "Steps to fold the crane", "Why cranes are white", "A crane poem"],
  ["If step 2 depends on step 1, swapping them…", "breaks the process", "improves style", "changes the font"],
  ["“In the morning… later that day…” marks…", "time order", "compare/contrast", "cause only"],
  ["Pick the sequence sentence.", "After thunder, we counted the seconds.", "Thunder is loud.", "I dislike storms."],
  ["A numbered list in a science lab is usually…", "sequence", "theme", "dialogue"],
  ["Last in “seed → sprout → plant” is…", "plant", "seed", "soil"]
], "Time order. First, then, last."));

bulk({
  id: "read-3-set-1",
  grade: 3,
  strand: "Literary comprehension",
  name: "Name the setting and why it matters to the problem",
  best: "ELA.3.R.1.1",
  ccss: "RL.3.3",
  teach: "Setting is where and when. It can make a problem harder or easier.",
  example: "Sam is at a lake at dusk. That is why he cannot find the path."
}, twenty([
  ["Sam is at a lake at dusk and cannot see the path. Setting is…", "the lake at dusk", "Sam", "the path’s name"],
  ["Setting answers…", "where and when", "who is kind", "what the lesson is"],
  ["A story in a silent library makes whispering…", "fit the place", "a metaphor only", "the theme always"],
  ["Which is setting, not character?", "a crowded train at dawn", "Maya is generous", "a theme about honesty"],
  ["Moving the same plot from a pool to a desert would change…", "the problem’s details", "the page count", "the author’s birthday"],
  ["“Long ago in a small port” tells…", "time and place", "the villain’s trait", "the glossary"],
  ["Night + no lantern makes finding a key…", "harder", "a caption", "a heading"],
  ["The cafeteria at lunch is a setting that includes…", "place and time of day", "only the hero’s name", "a root word"],
  ["If the storm is the reason they stay inside, setting is…", "driving the plot", "unrelated decoration", "the index"],
  ["Pick the setting sentence.", "The attic smelled like dust in July.", "She was brave.", "Honesty matters."],
  ["A map in a novel often supports…", "setting", "meter", "a claim in an ad"],
  ["When can be a year, a season, or…", "a time of day", "a trait", "a suffix"],
  ["Two settings in one chapter mean…", "the characters moved or time passed", "the theme flipped", "the book ended"],
  ["Why writers describe weather:", "it can shape what characters can do", "it replaces dialogue", "it is the narrator"],
  ["“On the space station” is…", "place", "theme", "evidence in science class only"],
  ["A problem caused by high tide depends on…", "setting", "a prefix", "the table of contents"],
  ["Character vs setting: “anxious” is…", "character", "setting", "caption"],
  ["“Winter of 1900” is…", "when", "who", "why as theme"],
  ["If you can drop the place and nothing changes, the setting is…", "weakly tied to the plot", "the theme", "first person"],
  ["Best setting question:", "Where and when is this happening, and so what?", "How many pages?", "What font?"]
], "Where, when, and how that changes the problem."));

bulk({
  id: "read-3-poe-1",
  grade: 3,
  strand: "Literary comprehension",
  name: "Hear rhyme and rhythm in a short poem",
  best: "ELA.3.R.1.4",
  ccss: "RL.3.5",
  teach: "Rhyme is matching end sounds. Rhythm is the beat you can tap.",
  example: "cat / hat rhyme. Tap the beat in the line to feel rhythm."
}, twenty([
  ["Which pair rhymes?", "light / night", "light / lake", "light / little"],
  ["Rhythm is the poem’s…", "beat", "title font", "page number"],
  ["A stanza is…", "a group of lines", "a caption", "a root"],
  ["Line breaks make you…", "pause with your eyes and voice", "skip the meaning", "count chapters"],
  ["Which pair does not rhyme?", "moon / man", "moon / June", "moon / spoon"],
  ["Repeated first sounds (slippery silver) are…", "alliteration", "captions", "indexes"],
  ["A poet repeats a line to…", "make a beat or an idea stick", "fill the page", "define a glossary word"],
  ["Rhyme is about…", "sound", "letter count only", "the author’s age"],
  ["“The wind whispered” in a poem is also…", "personification", "an index", "a timeline"],
  ["You tap the desk as you read to feel…", "rhythm", "setting’s year", "a claim"],
  ["A couplet is…", "two lines that often rhyme", "a chapter", "a diagram"],
  ["Which is most poem-like?", "short lines with a beat and image", "a bus schedule", "a glossary"],
  ["End rhyme sits…", "at the ends of lines", "only in titles", "in captions"],
  ["If two lines share -ing endings but not the vowel, they may…", "not truly rhyme", "always rhyme", "be captions"],
  ["Imagery means the poem…", "helps you picture with the senses", "lists dates", "argues a law"],
  ["A refrain is…", "a repeated line", "the first word of a novel", "a map key"],
  ["Poets may skip punctuation so that…", "the voice keeps moving", "the theme vanishes", "pages number themselves"],
  ["Pick the rhyming pair.", "day / gray", "day / dog", "day / desk"],
  ["Reading a poem aloud helps you hear…", "rhyme and rhythm", "the index", "the author’s email"],
  ["A line that is far shorter than the last one can signal…", "a punch or a pause", "a missing page", "third person"]
], "Sound first: rhyme, beat, line break."));

bulk({
  id: "read-4-mi-1",
  grade: 4,
  strand: "Main idea & detail",
  name: "Separate a central idea from a supporting detail in grade-4 text",
  best: "ELA.4.R.2.2",
  ccss: "RI.4.2",
  prereq: ["read-3-mi-1"],
  teach: "Ask: if I delete this sentence, does the point collapse? If not, it was a detail.",
  example: "Central idea: cities add green roofs to cut heat. Detail: one roof has 20,000 plants."
}, twenty([
  ["Cities add green roofs to cut heat. One Chicago roof has 20,000 plants. Central idea?", "Green roofs help cool cities", "Chicago is a city", "20,000 is a number"],
  ["A detail that can be deleted without losing the point is…", "support, not the central idea", "the title", "the glossary"],
  ["Which is a detail?", "One roof holds 20,000 plants", "Green roofs cut city heat", "Cities look for cooler designs"],
  ["A heading that matches the central idea should name…", "the whole point", "one example city only", "a photo credit"],
  ["If every sentence is about bats and sonar, the idea is about…", "how bats sense", "one cave in Texas only if that’s all", "your opinion"],
  ["A statistic is usually…", "support", "the theme of a fable", "a stanza"],
  ["Two details that do not fit the heading may mean…", "the idea is wider or the heading is weak", "the book is a poem", "third person"],
  ["Pick the central idea.", "Wetlands clean water and buffer storms.", "One heron stood still.", "The photo is pretty."],
  ["“For example” usually introduces…", "a detail", "the title", "the theme"],
  ["A concluding sentence that restates the point is close to…", "the central idea", "a caption under a map", "a character trait"],
  ["Delete “In 2019 a pilot program began.” Did the idea survive? Then that sentence was…", "a detail", "the only idea", "a rhyme"],
  ["Central idea vs topic: topic is…", "the subject word; idea is the point about it", "longer always", "a date"],
  ["Topic: glaciers. Weak idea:", "Glaciers exist.", "Glaciers store fresh water and are shrinking.", "Melt changes rivers."],
  ["Three details about seeds traveling. Idea?", "Seeds move in several ways", "One burr stuck to a sock", "Wind is air"],
  ["An idea can be implied when…", "no sentence says it outright but all point there", "the author used a comma", "there is a map"],
  ["Best test:", "What is this mostly teaching?", "What is the longest word?", "Who printed it?"],
  ["A sidebar fact is often…", "extra detail", "the only central idea", "the narrator"],
  ["If the quiz asks “mostly about,” it wants…", "central idea", "a single date", "your feeling"],
  ["Two paragraphs, one idea: look for…", "what both share", "the funnier line", "bold only"],
  ["Pick the detail.", "The pilot roof was planted in 2019.", "Green roofs reduce heat.", "Cities use plants on roofs to stay cooler."]
], "Point vs example."));

bulk({
  id: "read-4-mm-1",
  grade: 4,
  strand: "Vocabulary & word study",
  name: "Pick the meaning that fits the sentence for a multiple-meaning word",
  best: "ELA.4.V.1.3",
  ccss: "L.4.4.a",
  teach: "Do not pick the first definition you know. Plug each meaning back into the sentence.",
  example: "“The bat hung in the cave.” Not a baseball bat — the animal fits."
}, twenty([
  ["The bat hung in the cave. Bat means…", "the animal", "a baseball club", "a blink"],
  ["She will park the car. Park means…", "leave the car", "a green playground", "a bench"],
  ["A cold wave hit the coast. Wave means…", "a moving swell of water", "a hand greeting", "a hair style only"],
  ["Please book the room. Book means…", "reserve", "a novel", "a library shelf"],
  ["The spring in the toy bounced. Spring means…", "a coil", "the season", "a water source"],
  ["He sat on the bank. In a river story, bank means…", "the side of the river", "a place for money", "a tilt"],
  ["Turn off the light. Light means…", "a lamp / illumination", "not heavy", "pale color"],
  ["The box is light. Light means…", "not heavy", "a lamp", "sunrise"],
  ["They saw a crane on the dock. In a bird text, crane is…", "the bird", "the lifting machine", "a stretch"],
  ["A crane lifted the beam. Crane is…", "the machine", "the bird", "a neck exercise"],
  ["Check the match. In soccer, match means…", "the game", "a stick that lights", "a pair of socks"],
  ["Strike the match. Match means…", "the stick that lights", "the game", "a twin"],
  ["The story has a fair ending. Fair means…", "just", "a carnival", "pale"],
  ["We went to the fair. Fair means…", "a carnival", "just", "pale"],
  ["A ring woke her. Ring means…", "a sound", "jewelry", "a circle of friends"],
  ["The ring fit her finger. Ring means…", "jewelry", "a phone sound", "a boxing arena"],
  ["Watch the pot. Watch means…", "look after", "a timepiece", "a guard troop only"],
  ["Her watch stopped. Watch means…", "a timepiece", "look after", "a tower"],
  ["The test is hard. Hard means…", "difficult", "not soft", "firmly"],
  ["The bench is hard. Hard means…", "not soft", "difficult", "harshly"]
], "Plug the meaning back into the sentence."));

bulk({
  id: "read-4-flu-1",
  grade: 4,
  strand: "Fluency",
  name: "Choose the reading that matches punctuation and phrasing",
  best: "ELA.4.F.1.4",
  ccss: "RF.4.4.b",
  teach: "Fluency is not speed alone. Periods drop the voice. Questions lift it. Commas are short rests.",
  example: "“Wait,” she said, “we forgot the key.” Two short groups, not one rush."
}, twenty([
  ["A period usually tells you to…", "stop and drop your voice", "keep rushing", "whisper"],
  ["A question mark tells you to…", "lift your voice at the end", "stop like a period with no lift", "skip the line"],
  ["A comma is a…", "short rest", "full stop", "volume spike always"],
  ["An exclamation mark adds…", "energy or surprise", "a caption", "a glossary"],
  ["Quotation marks mean you should…", "change to the speaker’s voice a little", "skip those words", "read faster always"],
  ["Which phrasing matches “Wait, we forgot the key.”?", "Wait / we forgot the key", "Wait we / forgot the key", "Waitweforgot thekey"],
  ["Reading word-by-word without phrases sounds…", "choppy", "fluent", "like a heading"],
  ["Bold words should be…", "a bit stronger", "skipped", "whispered always"],
  ["To sound fluent you also need…", "to understand the words", "to beat a timer only", "to skip punctuation"],
  ["A dash can mark…", "an abrupt break", "a chapter", "an index"],
  ["Ellipsis (…) often means…", "a trailing off or pause", "yell", "a new stanza title"],
  ["If meaning is lost, first…", "slow down and look at punctuation", "speed up", "close the book"],
  ["Dialogue tags like “she whispered” tell you to…", "soften the quoted line", "shout", "ignore commas"],
  ["A list with commas should be read as…", "separate items", "one mashed word", "a rhyme"],
  ["Fluency practice is useful when you…", "reread a passage you already decoded", "see the page once at top speed", "cover the punctuation"],
  ["Which is the better read of a question?", "Are we late? (voice up)", "Are we late. (voice down hard)", "Are. We. Late"],
  ["Line breaks in poems also act like…", "punctuation for the voice", "captions", "indexes"],
  ["Reading too fast often causes…", "missed meaning", "better theme", "a new setting"],
  ["A semicolon is a rest…", "stronger than a comma, weaker than a period", "the same as a question", "a shout"],
  ["The goal of fluency here is…", "sound like speech that makes sense", "win a race", "memorize fonts"]
], "Punctuation is the score for your voice."));

bulk({
  id: "read-5-ci-1",
  grade: 5,
  strand: "Main idea & detail",
  name: "State a central idea that covers more than one paragraph",
  best: "ELA.5.R.2.2",
  ccss: "RI.5.2",
  prereq: ["read-4-mi-1"],
  teach: "The central idea has to cover the stack of paragraphs, not the loudest example in paragraph two.",
  example: "P1 plastic in rivers. P2 in fish. P3 policy. Idea: plastic moves through water and people try to stop it."
}, twenty([
  ["P1 rivers, P2 fish, P3 policy on plastic. Central idea?", "Plastic waste moves through water and people are trying to stop it", "One fish ate a bottle cap", "Policies are long"],
  ["A central idea that only fits paragraph 2 is…", "too narrow", "perfect", "a theme of a fable"],
  ["Across paragraphs, repeated words often mark…", "the idea", "the caption font", "the narrator"],
  ["A section heading is a clue to…", "that section’s piece of the idea", "the author’s age", "meter"],
  ["If P3 contradicts P1 with no explanation, the idea is…", "unclear or the text is flawed", "automatically the last paragraph", "a poem"],
  ["Best covering sentence?", "Scientists track plastic from rivers into food and then test fixes.", "A turtle was sad.", "The photo is blue."],
  ["Details that appear once and never return are often…", "local support", "the only idea", "the title"],
  ["To write the idea in your own words you must…", "drop extra names unless needed", "copy paragraph 1", "list every date"],
  ["Two headings: “Problem” and “What cities tried.” The stack is about…", "a problem and responses", "only cities’ names", "a character"],
  ["A good check: cover each paragraph and ask…", "does my idea still need this part?", "is the font nice?", "does it rhyme?"],
  ["An implied idea across pages is still…", "allowed if the parts point there", "illegal", "a glossary"],
  ["Which is too broad?", "People do things.", "Plastic in water harms animals and draws new rules.", "Rivers carry waste into the sea."],
  ["Which is too narrow?", "One net program in one bay", "Waste travels and communities respond", "Plastic shows up in fish"],
  ["Transition “on the other hand” may add…", "a second piece the idea must include", "a caption", "a stanza"],
  ["Quotes in P2 support the idea if they…", "back the same point", "are famous", "are long"],
  ["A chart in the section is usually…", "support", "a new unrelated text", "the narrator’s feeling"],
  ["If the question says “the article,” look…", "across sections", "at sentence one only", "at the URL"],
  ["Restating the idea at the end is…", "common and helpful", "always wrong", "a simile"],
  ["Pick the stack idea.", "Bees struggle when habitat and chemicals rise together.", "One bee sat on a daisy.", "Yellow is pretty."],
  ["Authors bury the idea when they…", "lead with a story and land the point later", "use page numbers", "add an index"]
], "The idea must cover the stack."));

bulk({
  id: "read-5-fig-1",
  grade: 5,
  strand: "Figurative language",
  name: "Explain personification and hyperbole in context",
  best: "ELA.5.R.3.1",
  ccss: "RL.5.4",
  prereq: ["read-4-fig-1"],
  teach: "Personification gives human action to a thing. Hyperbole is on-purpose exaggeration.",
  example: "The wind hammered the door. I waited a million years."
}, twenty([
  ["“The wind hammered the door.” This is…", "personification", "a measured fact", "a caption"],
  ["“I waited a million years.” This is…", "hyperbole", "personification", "a date"],
  ["Personification always gives…", "human action or feeling to a thing", "a number", "a heading"],
  ["Hyperbole is…", "exaggeration", "a map", "third person"],
  ["“The alarm screamed.” The alarm…", "is written as if it can scream", "has vocal cords", "is a character’s name"],
  ["“This backpack weighs a ton.” Means it is…", "very heavy", "2,000 pounds", "empty"],
  ["Which is literal?", "The lake froze overnight.", "The lake grabbed our boots.", "We waited a million years to skate."],
  ["“Time crawled.” Time is treated as…", "something that can crawl", "a clock brand", "a caption"],
  ["Why use hyperbole?", "To stress a feeling", "To report a lab number", "To list steps"],
  ["Why use personification?", "To make a scene feel alive", "To define a glossary word", "To number pages"],
  ["“My phone died.” Everyday personification means…", "the battery ran out", "a funeral", "a simile only"],
  ["Pick hyperbole.", "He could eat a mountain of rice.", "He ate two bowls.", "Rice is a grain."],
  ["Pick personification.", "The streets swallowed the parade.", "The streets were crowded.", "A parade has floats."],
  ["“The sun smiled” is…", "personification", "hyperbole only", "an index"],
  ["“I’ve told you a thousand times” is…", "hyperbole", "personification", "setting"],
  ["If you read hyperbole as fact you will…", "miss the point", "gain a measurement", "find the theme automatically"],
  ["“Opportunity knocked.” Means…", "a chance appeared", "a fist hit wood", "a neighbor visited"],
  ["Combining both: “The bored clock rolled its millionth tick.” Tick count is…", "hyperbole; clock acting is personification", "only setting", "only evidence"],
  ["Literal rewrite of “the wind hammered”:", "The wind blew hard against the door", "A person used a hammer", "The door told a joke"],
  ["Figurative language is a problem when the task is…", "a science measurement", "picturing a storm", "hearing a voice in a story"]
], "Human action vs on-purpose stretch."));

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/reading-3-5-draft.json");
fs.writeFileSync(out, JSON.stringify(skills, null, 2));
const qs = skills.reduce((n, s) => n + s.question_bank.length, 0);
console.log("WROTE", out, "skills", skills.length, "questions", qs);
