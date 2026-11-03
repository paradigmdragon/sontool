import type { Work, Block } from "./core/index.js";
const text = (id: string, value: string): Block => ({
  id,
  module: { id: "sontool/text", version: "0.1.0-draft.1" },
  content: { text: value },
  fallback: value,
});
export const landing: Work = {
  schemaVersion: "0.1.0-draft.1",
  id: "landing",
  revision: 0,
  title: "A garden together",
  intent: { purpose: "Invite neighbors to make a shared garden" },
  pages: [
    {
      id: "landing-page",
      scenes: [
        {
          id: "welcome",
          mode: "flow",
          blocks: [
            text("title", "A garden together"),
            text(
              "body",
              "Every small contribution becomes part of the garden.",
            ),
          ],
        },
      ],
    },
  ],
};
export const scrollStory: Work = {
  schemaVersion: "0.1.0-draft.1",
  id: "scroll-story",
  revision: 0,
  title: "Three moments",
  intent: { purpose: "Read a short story at your own pace" },
  pages: [
    {
      id: "story-page",
      scenes: [
        {
          id: "past",
          mode: "flow",
          blocks: [
            text("past-text", "We started with an empty patch of earth."),
          ],
        },
        {
          id: "journey",
          mode: "scroll",
          scroll: { axis: "horizontal", distance: 2 },
          blocks: [
            text("seed", "A seed."),
            text("water", "A little water."),
            text("bloom", "Something grew."),
          ],
        },
        {
          id: "after",
          mode: "flow",
          blocks: [text("after-text", "Now the story belongs to all of us.")],
        },
      ],
    },
  ],
};
export const choiceStory: Work = {
  schemaVersion: "0.1.0-draft.1",
  id: "choice-story",
  revision: 0,
  title: "Choose your contribution",
  intent: {
    purpose: "Let readers choose a route; preserve both possible outcomes",
  },
  pages: [
    {
      id: "choice-page",
      scenes: [
        {
          id: "question",
          mode: "choice",
          blocks: [
            text("question-text", "What would you like to bring?"),
            {
              id: "choice",
              module: { id: "sontool/choice", version: "0.1.0-draft.1" },
              content: {
                options: [
                  { label: "Plant a seed", targetSceneId: "plant" },
                  { label: "Tell a story", targetSceneId: "tell" },
                ],
              },
              fallback: "Choose planting or storytelling.",
            },
          ],
        },
        {
          id: "plant",
          mode: "flow",
          blocks: [
            text("plant-text", "Your seed is the beginning of something new."),
          ],
        },
        {
          id: "tell",
          mode: "flow",
          blocks: [
            text("tell-text", "Your story helps us remember why we started."),
          ],
        },
      ],
    },
  ],
};
export const examples = { landing, scroll: scrollStory, choice: choiceStory };
