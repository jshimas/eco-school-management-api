const app = require("../app"); // Replace with the path to your Express app

let server;

module.exports = {
  startServer: async (port = 8080, host = "localhost") => {
    return new Promise((resolve, reject) => {
      server = app.listen(port, host, () => {
        console.log(`App running at http://${host}:${port}/`);
        resolve();
      });

      server.on("error", reject);
    });
  },

  closeServer: () => {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
};
