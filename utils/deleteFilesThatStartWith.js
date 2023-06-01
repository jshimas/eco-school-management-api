const fs = require("fs");
const path = require("path");

module.exports = async (startingWith) => {
  const directoryPath = path.join(
    __dirname.split("\\").slice(0, -1).join("\\"),
    "public",
    "images"
  );

  const { readdir, unlink } = fs.promises;

  try {
    // Creating a directory if it does not exist
    fs.existsSync(directoryPath) || fs.mkdirSync(directoryPath);

    const files = await readdir(directoryPath);
    files
      .filter((file) => file.startsWith(startingWith))
      .forEach((file) => unlink(path.join(directoryPath, file)));
  } catch (error) {
    console.error(`Error deleting files: ${error}`);
  }
};
