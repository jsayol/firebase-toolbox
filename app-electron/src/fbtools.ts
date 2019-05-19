import * as firebaseTools_Type from 'firebase-tools';
import * as mockRequire from 'mock-require';
import * as inquirer from 'inquirer';

import { addWinstonConsoleTransport, getRandomId } from './utils';

// These 3 calls need to happen in this specific order.
interceptCliPrompt();
const tools = require('firebase-tools') as typeof firebaseTools_Type;
addWinstonConsoleTransport();

interface RunCommandMessage {
  type: 'run-command';
  command: string;
  args: any[];
  options: { [k: string]: any };
}

interface PromptResponseMessage {
  type: 'prompt-response';
  id: string;
  answer: string;
  error?: any;
}

type Message = RunCommandMessage | PromptResponseMessage;

process.on('disconnect', () => {
  process.exit();
});

process.on('message', (message: Message) => {
  if (message.type === 'run-command') {
    runCommand(message);
  }
});

async function runCommand(message: RunCommandMessage): Promise<void> {
  try {
    const commandParts = message.command.split('.');
    let commandFn;

    try {
      commandFn = commandParts.reduce((obj, part) => obj[part], tools);
    } catch (error) {
      process.send({ type: 'error', error });
      process.exit();
    }

    if (typeof commandFn !== 'function') {
      process.send({
        type: 'error',
        error: `There is no command "${message.command}"`
      });
      process.exit();
    }

    try {
      const result = await commandFn(...message.args, message.options);
      process.send({ type: 'run-command-result', result });
    } catch (error) {
      process.send({ type: 'run-command-error', error });
    }
  } catch (err) {
    // Something went wrong
    process.send({
      type: 'error',
      error: err
    });
  }

  process.exit();
}

export function interceptCliPrompt() {
  // Path to the prompt module we need to intercept
  const PROMPT_PATH = '../../node_modules/firebase-tools/lib/prompt';

  interface PromptOptions {
    [k: string]: any;
  }

  const prompt = function(
    options: PromptOptions,
    questions: inquirer.Question[]
  ) {
    return new Promise(async (resolve, reject) => {
      const id = getRandomId();

      const prompts: Promise<any>[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];

        if (!options[question.name]) {
          const ipcPrompt = new Promise((ipcResolve, ipcReject) => {
            const onResponse = (msg: Message) => {
              if (msg.type === 'prompt-response' && msg.id === id) {
                process.off('message', onResponse);
                if (msg.error) {
                  ipcReject(msg.error);
                } else {
                  ipcResolve({ name: question.name, answer: msg.answer });
                }
              }
            };

            process.on('message', onResponse);
            process.send({ type: 'prompt', id, options, question });
          });

          prompts.push(ipcPrompt);
        }
      }

      try {
        const responses = await Promise.all(prompts);
        responses.forEach(({ name, answer }) => {
          options[name] = answer;
        });
        resolve(options);
      } catch (err) {
        reject(err);
      }
    });
  };

  prompt.once = (question: inquirer.Question) => {
    question.name = question.name || 'question';
    return prompt({}, [question]).then((answers: PromptOptions) => {
      return answers[question.name];
    });
  };

  const originalPrompt = require(PROMPT_PATH);
  prompt.convertLabeledListChoices = originalPrompt.convertLabeledListChoices;
  prompt.listLabelToValue = originalPrompt.listLabelToValue;

  mockRequire(PROMPT_PATH, prompt);
  mockRequire.reRequire(PROMPT_PATH);
}
