require("dotenv").config();
module.exports = {
  development: {
    use_env_variable: false,
    database: "teresaterroso__pw2_g10",
    username: "teresaterroso__pw2_g10",
    password: "qip%ac.WSMu_",
    host: "pw2.joaoferreira.eu",
    dialect: "mysql",
  },
  test: {
    use_env_variable: false,
    username: "root",
    password: "root",
    database: "owly",
    host: "localhost",
    dialect: "mysql",
    logging: false,
  },
};
