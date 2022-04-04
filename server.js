const { syncAndSeed } = require("./db");
const app = require("./app");

const init = async () => {
  await syncAndSeed();
  const port = process.env.PORT || 8080;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

console.log(process.env.JWT);
init();
