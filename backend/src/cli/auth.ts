import inquirer from "inquirer";
import { auth } from "@backend/lib/auth";
import { tryCatchAsync } from "@backend/lib/utils";

export const createUser = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) => {
  await auth.api.signUpEmail({
    body: {
      email,
      name,
      password,
    },
  });
  return;
};

const questions = [
  {
    type: "input",
    name: "name",
    message: "Quel est ton nom ?",
  },
  {
    type: "input",
    name: "email",
    message: "Quel est ton email",
  },
  {
    type: "password",
    name: "password",
    message: "Defini ton password",
  },
];

const answers = await inquirer.prompt(questions);
const { error } = await tryCatchAsync(createUser(answers));
if (error) {
  console.log("Error : ", error.message);
  process.exit(1);
}
console.log("Utilisateur créé");
