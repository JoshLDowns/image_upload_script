const fs = require("fs");
const csv = require("async-csv");

const cloudinary = require("cloudinary").v2;
const cloudName = "brandhub";
const cloudKey = "";
const cloudSecret = "";

cloudinary.config({
  cloud_name: cloudName,
  api_key: cloudKey,
  api_secret: cloudSecret,
  secure: true
});

//upload and build csv

const uploadAndBuild = async () => {
  const imageData = [];
  const errors = [];
  const images = await fs.promises.readdir("images");

  for (const img of images) {
    //upload to cloudinary
    if (img.split(".")[1] === "jpg") {
      await cloudinary.uploader
        .upload(`images/${img}`, { folder: "prod/GalloImageArchive" })
        .then((result) => {
          let imageArray = img.split("_");
          if (imageArray.length === 1) {
            imageData.push({
              item_id: imageArray[0].split(".")[0],
              type: "thumbnail",
              position: null,
              public_id: result.public_id,
              original_url: result.url,
            });
          }
          imageData.push({
            item_id: imageArray[0].split(".")[0],
            type: "large",
            position: imageArray[1] ? parseInt(imageArray[1]) + 1 : 1,
            public_id: result.public_id,
            original_url: result.url,
          });
          console.log(`Successfully uploaded ${img}`);
        })
        .catch((err) => {
          console.log(`Failed to upload ${img}, error: ${err}`);
          errors.push(img);
        });
    }
  }

  if (errors.length > 0)
    console.log(`The following images failed to upload: ${errors.join(", ")}`);

  await buildCsv(imageData);

  console.log("Successfully Created Image CSV");
};

const buildCsv = async (imageData) => {
  imageData.sort((a, b) =>
    parseInt(a.item_id) < parseInt(b.item_id)
      ? -1
      : parseInt(a.item_id) > parseInt(b.item_id)
      ? 1
      : 0
  );

  //build csv from object
  const columnNames = [
    "item_id",
    "public_id",
    "original_url",
    "type",
    "position",
  ];

  let csvInput = [columnNames];

  csvInput.push(...imageData.map((row) => columnNames.map((c) => row[c])));

  let csvString = await csv.stringify(csvInput);

  return new Promise((resolve, reject) => {
    fs.writeFile("images.csv", csvString, "utf8", (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(csvString);
      }
    });
  });
};

uploadAndBuild();
