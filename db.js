const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { STRING } = Sequelize;
const config = {
  logging: false,
  dialect: "postgres",
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || "postgres://localhost/acme_db", config);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: Sequelize.STRING
})

User.hasMany(Note);
Note.belongsTo(User);

User.beforeCreate(async (user, options) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
});

User.byToken = async token => {
  try {
    let decoded = jwt.verify(token, "somekeyhere");
    const user = await User.findByPk(decoded.userId);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  let answer = await bcrypt.compare(password, user.password);

  if (answer) {
    let token = jwt.sign({ userId: user.id }, "somekeyhere");
    return token;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];

  const notes = [ { text: 'hello world'}, { text: 'reminder to buy groceries'}, { text: 'reminder to do laundry'} ];
  const [note1, note2, note3] = await Promise.all(notes.map( note => Note.create(note)));

  const [lucy, moe, larry] = await Promise.all(credentials.map(credential => User.create(credential)));

  await lucy.setNotes(note1);
  await moe.setNotes([note2, note3]);

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  },
};
