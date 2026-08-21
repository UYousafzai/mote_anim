export const TASKS = [
  {
    name: "NER",
    expert: 0,
    color: "#5ce8ff",
    tokens: ["Apple", "Inc.", "hired", "Cook"],
  },
  {
    name: "Classify",
    expert: 1,
    color: "#f5c16c",
    tokens: ["Quarterly", "revenue", "grew"],
  },
  {
    name: "OCR",
    expert: 2,
    color: "#f07ab8",
    tokens: ["INV-441", "PAGE", "02"],
  },
];

export const EXPERTS = [
  { name: "Expert 1", color: "#5ce8ff", task: true },
  { name: "Expert 2", color: "#f5c16c", task: true },
  { name: "Expert 3", color: "#f07ab8", task: true },
  { name: "Expert 4", color: "#6ee7b7", task: false },
  { name: "Expert N", color: "#c4b5fd", task: false },
];

export const TOKENS = TASKS.flatMap((task, ti) =>
  task.tokens.map((text, i) => ({
    text,
    color: task.color,
    task: ti,
    expert: task.expert,
    i,
    n: task.tokens.length,
  }))
);

export const ATTENTION = [
  [1.0, 0, 0, 0],
  [0.32, 0.68, 0, 0],
  [0.14, 0.28, 0.58, 0],
  [0.1, 0.18, 0.24, 0.48],
];

export const LAYOUT = {
  embedY: -6.2,
  layers: [
    { y: -1.2, hero: false },
    { y: 8.4, hero: true },
    { y: 18.0, hero: false },
    { y: 27.6, hero: false },
  ],
  outputY: 34.4,
  layerH: 7.6,
  attentionY: -2.35,
  attnAddY: -1.2,
  norm2Y: -0.35,
  switchY: 0.55,
  expertY: 2.25,
  sharedX: 7.15,
  sharedY: 2.25,
  combineY: 4.55,
  expertSpread: 10.6,
  expertCount: 5,
  expertShiftX: -1.35,
  tokenGap: 0.82,
  taskZ: 1.7,
};

export const TASK_BEATS = [
  { t: 28.8, task: 0 },
  { t: 34.2, task: 1 },
  { t: 39.6, task: 2 },
];

export const CHAPTERS = [
  {
    t: 0,
    body: "MoTE decoder: shared attention, then a shared FFN in parallel with a task expert.",
  },
  {
    t: 7.2,
    body: "A mixed batch — three samples, three tasks. All visual and text tokens share the backbone.",
  },
  {
    t: 14.4,
    body: "Norm → Attention. Residual add. The attention path stays shared across tasks.",
  },
  {
    t: 22.2,
    body: "After the second Norm the stream splits: Shared FFN (always on) and MoTE (switch + experts).",
  },
  {
    t: 28.4,
    body: "The Switch reads the task and sends the entire sample to one expert.",
  },
  {
    t: 34.0,
    body: "Expert 1 for NER. Every token in the sample takes the same route.",
  },
  {
    t: 39.4,
    body: "Classify → Expert 2, OCR → Expert 3. Idle experts stay dark. Shared FFN still runs.",
  },
  {
    t: 51.2,
    body: "Three-way sum: selected expert + shared FFN + residual.",
  },
  {
    t: 58.4,
    body: "One task expert per sample. Active compute does not grow with stored experts.",
  },
];

export const DURATION = 68;
