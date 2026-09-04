require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const bcrypt = require("bcryptjs");
const Database = require("../src/config/database");
const { BCRYPT_ROUNDS } = require("../src/config/constants");
const UserRepository = require("../src/repository/UserRepository");

const seedUsers = [
  ["Ava Rivers", "ava.rivers"],
  ["Noah Blake", "noah.blake"],
  ["Mia Carter", "mia.carter"],
  ["Liam Stone", "liam.stone"],
  ["Zoe Parker", "zoe.parker"],
  ["Ethan Reed", "ethan.reed"],
  ["Nora Hayes", "nora.hayes"],
  ["Kai Morgan", "kai.morgan"],
  ["Ivy Bennett", "ivy.bennett"],
  ["Leo Brooks", "leo.brooks"],
];

const main = async () => {
  const database = Database.getInstance();
  const userRepository = new UserRepository(database);
  const password = await bcrypt.hash("Password@123", BCRYPT_ROUNDS);
  let inserted = 0;
  let skipped = 0;

  for (const [displayName, slug] of seedUsers) {
    const existing = await userRepository.findByEmail(`${slug}@chatapp.test`);
    if (existing) {
      skipped += 1;
      continue;
    }

    await userRepository.createIfEmailMissing({
      username: displayName,
      email: `${slug}@chatapp.test`,
      password,
    });
    inserted += 1;
  }

  console.log(
    `[SEED] Users complete. Inserted: ${inserted}, skipped: ${skipped}. Password: Password@123`,
  );
  process.exit(0);
};

main().catch((error) => {
  console.error("[SEED] Failed to seed users", error);
  process.exit(1);
});
