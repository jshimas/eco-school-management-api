const { startServer } = require("./utils/serverHandler");
const { sequelize } = require("./models");

const port = process.env.PORT || 8080;
const host = process.env.HOST || "127.0.0.1";

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");
    await startServer(port, host);
  } catch (error) {
    console.error("There has been an error starting a server: ", error);
  }
})();
