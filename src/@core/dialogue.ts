import { DialogueState, EngineState, EntityState } from "../types";

// Setup the DOM
function gameDialogue() {
  let dialogue;

  const initialize = () => {
    const dialogueMarkup = `
      <ul class="dialogue">
        <div class="dialogue__inner">
          <p class="dialogue__name" id="dialogue-name"></p>
          <div class="dialogue__text" id="dialogue-text"></div>
          <div class="dialogue__choices" id="dialogue-choices"></div>
          <div class="dialogue__actions">
            <img src="/assets/img/enter.svg" />
          </div>
        </div>
      </ul>`;

    const container = document.createElement("div");
    container.innerHTML = dialogueMarkup;

    document.body.appendChild(container);
  };

  const findNextDialogue = (state: EngineState) => {
    // Reset choice response
    state.dialogue.isShowingChoiceResponse = false;

    if (
      state.activeEntity.dialogue &&
      state.activeEntity.dialogue[state.activeEntityDialogue + 1]
    ) {
      // Find first dialogue index that matches condition
      const nextMatchIndex = state.activeEntity.dialogue.findIndex(
        (d, index) => {
          if (index <= state.activeEntityDialogue) {
            return;
          }
          if (d.condition) {
            return d.condition(state.activeEntity.state);
          }
          return d;
        }
      );

      // No more dialogue
      if (nextMatchIndex < 0) {
        // Remove classes
        if (state.activeEntity.dialogue) {
          const classesToRemove = state.activeEntity.dialogue.map(
            (d) => d.class
          );
          state.activeEntity.currentClasses =
            state.activeEntity.currentClasses.filter(
              (c) => !classesToRemove.includes(c)
            );
        }

        state.activeEntity.currentClasses.push("-visited");

        state.activeEntity = undefined;
        state.activeEntityDialogue = -1;
        state.currentClasses = state.currentClasses.filter(
          (c) => !c.includes("-chat")
        );

        state.needRender = true;

        // Reset keydown
        state.keyDown = "";
        return;
      }

      const dialogClass = state.activeEntity.dialogue[nextMatchIndex].class;

      if (dialogClass) {
        state.activeEntity.currentClasses.push(dialogClass);
      }

      const dialogReward = state.activeEntity.dialogue[nextMatchIndex].reward;

      if (
        dialogReward &&
        !state.inventory.some((i) => i.name === dialogReward.name)
      ) {
        state.successSound.play();
        state.inventory.push(dialogReward);
        state.dialogue.updateInventory = true;
      }

      const dialogText = state.activeEntity.dialogue[nextMatchIndex].text || "";
      const sound =
        dialogText.length > 40
          ? "long"
          : dialogText.length > 20
          ? "regular"
          : "short";

      state.blipSound.play(sound);

      // Check for dialogue choices
      const choices = state.activeEntity.dialogue[nextMatchIndex].choices;
      if (choices) {
        state.dialogue.currentChoiceIndex = 0;
        state.dialogue.currentChoices = choices;
      }

      state.activeEntityDialogue = nextMatchIndex;
    } else {
      // Remove classes
      if (state.activeEntity.dialogue) {
        const classesToRemove = state.activeEntity.dialogue.map((d) => d.class);
        state.activeEntity.currentClasses =
          state.activeEntity.currentClasses.filter(
            (c) => !classesToRemove.includes(c)
          );
      }

      state.activeEntity.currentClasses.push("-visited");

      state.activeEntity = undefined;
      state.activeEntityDialogue = -1;
      state.currentClasses = state.currentClasses.filter(
        (c) => !c.includes("-chat")
      );
    }
    state.needRender = true;

    // Reset keydown
    state.keyDown = "";
  };

  const update = (state: EngineState) => {
    // Check for choice input
    if (state.arrowDown && state.activeEntity) {
      // Change choice if any
      if (
        state.dialogue.currentChoices &&
        state.dialogue.currentChoices.length > 0
      ) {
        const newVal =
          state.arrowDown === "ArrowUp"
            ? Math.max(0, state.dialogue.currentChoiceIndex - 1)
            : state.arrowDown === "ArrowDown"
            ? Math.min(
                state.dialogue.currentChoices.length - 1,
                state.dialogue.currentChoiceIndex + 1
              )
            : 0;
        state.dialogue.currentChoiceIndex = newVal;
        state.needRender = true;
        state.arrowDown = "";
      }
    }

    // Check for choice selection
    if (
      state.keyDown &&
      state.activeEntity &&
      state.dialogue.currentChoiceIndex > -1
    ) {
      const choice =
        state.dialogue.currentChoices[state.dialogue.currentChoiceIndex];
      if (choice && choice.response) {
        // Trigger response action if any
        if (choice.response.onSelect) {
          choice.response.onSelect(state.activeEntity.state, state);
        }

        state.dialogue.currentDialogue = choice.response.text;

        const sound =
          choice.response.text.length > 40
            ? "long"
            : choice.response.text.length > 20
            ? "regular"
            : "short";

        state.blipSound.play(sound);

        state.dialogue.isShowingChoiceResponse = true;
      }

      state.dialogue.currentChoices = [];
      state.dialogue.currentChoiceIndex = -1;
      state.needRender = true;
      state.keyDown = "";

      // findNextDialogue(state);
    }

    // Check for new interaction
    if (state.keyDown && !state.activeEntity) {
      // Reset choice response
      state.dialogue.isShowingChoiceResponse = false;

      const entitiesNearby = state.currentLevel.entities.filter(
        (i) => i.isNear && i.interactive
      );
      const newEntity = entitiesNearby.find((e) => !e.hasInteracted);
      const entityNearby = newEntity || entitiesNearby[0];

      if (entityNearby && entityNearby.dialogue) {
        state.activeEntity = entityNearby;
        state.activeEntity.hasInteracted = true;
        state.currentClasses.push("-chat");

        // Find first dialogue index that matches condition
        const firstMatchIndex = entityNearby.dialogue.findIndex((d) => {
          if (d.condition) {
            return d.condition(entityNearby.state);
          }
          return d;
        });

        state.activeEntityDialogue = firstMatchIndex;

        // Change music volume
        if (state.currentLevel.theme) {
          state.currentLevel.theme.volume(0.5);
        }

        const dialogText =
          state.activeEntity.dialogue[firstMatchIndex].text || "";
        const sound =
          dialogText.length > 40
            ? "long"
            : dialogText.length > 20
            ? "regular"
            : "short";

        state.blipSound.play(sound);

        // Add dialogue classes
        const dialogClass = state.activeEntity.dialogue[firstMatchIndex].class;
        if (dialogClass) {
          state.activeEntity.currentClasses.push(dialogClass);
        }

        const dialogReward =
          state.activeEntity.dialogue[firstMatchIndex].reward;

        if (
          dialogReward &&
          !state.inventory.some((i) => i.name === dialogReward.name)
        ) {
          state.successSound.play();
          state.inventory.push(dialogReward);
          state.dialogue.updateInventory = true;
        }

        // Check for dialogue choices
        const choices = state.activeEntity.dialogue[firstMatchIndex].choices;
        if (choices) {
          state.dialogue.currentChoices = choices;
          state.dialogue.currentChoiceIndex = 0;
        }

        state.needRender = true;

        // Reset keydown
        state.keyDown = "";
      }
    }

    // Set next interaction
    if (state.keyDown && state.activeEntity) {
      findNextDialogue(state);
    }

    if (
      state.activeEntityDialogue > -1 &&
      !state.dialogue.isShowingChoiceResponse
    ) {
      // Progress dialogue text
      const dialogue = state.activeEntity.dialogue[state.activeEntityDialogue];
      if (state.dialogue.currentDialogue !== dialogue.text) {
        state.dialogue.currentDialogue = dialogue.text;
      }
    }

    if (state.activeEntity && !state.currentClasses.includes("-zoom-in")) {
      state.currentClasses.push("-zoom-in");
      state.needRender = true;
    }

    if (!state.activeEntity && state.currentClasses.includes("-zoom-in")) {
      state.currentClasses = state.currentClasses.filter(
        (c) => !c.includes("-zoom")
      );

      // Change music volume
      if (state.currentLevel.theme) {
        state.currentLevel.theme.volume(1);
      }

      state.needRender = true;
    }
  };

  dialogue = {
    initialize,
    update,
  };

  return dialogue;
}

export default gameDialogue;
