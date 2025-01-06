import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import bodyParser from "body-parser";
import { PORT, mongodburl } from "./config.js";
import { Character } from "./models/charmodels.js";
//for frontend
// CORS Middleware
import cors from "cors";


import path from "path";


const app = express();
//-------------------------------------------------------for frontend

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//------------------------------------------
// Middleware for parsing JSON
app.use(bodyParser.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save files to 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique file names
  },
});

const upload = multer({
  storage,
}).any();/*fields([
        
  { name: "mugshot", maxCount: 1 },
  { name: "mainImage", maxCount: 1 },
  { name: "artifacts[]", maxCount: 10 },
  { name: "roles[]", maxCount: 10 },
  { name: "weapons[]", maxCount: 10 },
  { name: "materials[]", maxCount: 10 },
]);*/

// Base route
/*
app.get("/", (request, response) => {
  return response.status(200).send("This is the base server of the project.");
});*/




//get
app.get("/:name", async (req, res) => { 
    const { name } = req.params; // Get the character name from the URL parameter
  
    try {
      // Find the character by name
      const char = await Character.findOne({ name });
      if (!char) {
        return res.status(404).send({ message: "Character not found." });
      }
  
      // Send the character's data as a response
      res.status(200).send(char);
    } catch (error) {
      console.error("Error during character retrieval:", error);
      res.status(500).send({ message: "Error retrieving character." });
    }
  });
  
//delete
app.delete("/cleanup", async (req, res) => {
    try {
      await Character.deleteMany(); // Deletes all documents in the Character collection
      res.status(200).send({ message: "All characters have been removed from the database." });
    } catch (error) {
      console.error("Error while cleaning up database:", error);
      res.status(500).send({ message: "Error while cleaning up database." });
    }
  });
  //deletebyname
  app.delete("/delete/:name", async (req, res) => {
    const { name } = req.params; // Get the character name from the URL parameter
  
    try {
      // Find and delete the character by name
      const deletedChar = await Character.findOneAndDelete({ name });
      
      // If the character is not found, return a 404 response
      if (!deletedChar) {
        return res.status(404).send({ message: "Character not found." });
      }
  
      // Delete associated files (mugshot, mainImage, artifacts images, etc.)
      const filesToDelete = [
        deletedChar.mugshot,
        deletedChar.mainImage,
        deletedChar.background,
        ...deletedChar.artifacts.map(artifact => artifact.image).filter(image => image),
        ...deletedChar.roles.map(role => role.image).filter(image => image),
        ...deletedChar.weapons.map(weapon => weapon.image).filter(image => image),
        ...deletedChar.materials.map(material => material.image).filter(image => image)
      ];
  
      // Delete each file in the uploads folder
      filesToDelete.forEach((filePath) => {
        const fullPath = path.join(uploadDir, filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${filePath}`);
        }
      });
  
      res.status(200).send({ message: `Character "${name}" and associated files deleted.` });
    } catch (error) {
      console.error("Error during deletion:", error);
      res.status(500).send({ message: "Error deleting character." });
    }
  });
  
// Character POST route
app.post("/Character", upload, async (request, response) => {
    try {
      const { body, files } = request;
  
      // Parse files based on their fieldnames
      const parseFiles = (prefix) => {
        return files
          .filter((file) => file.fieldname.startsWith(prefix))
          .map((file) => ({ image: file.path }));
      };
  
      const newChar = {
        name: body.name,
        mugshot: files.find((file) => file.fieldname === "mugshot")?.path,
        mainImage: files.find((file) => file.fieldname === "mainImage")?.path,
        background: files.find((file) => file.fieldname === "background")?.path,
        artifacts: JSON.parse(body.artifacts).map((artifact, index) => ({
          ...artifact,
          image: parseFiles(`artifacts[${index}]`)[0]?.image || null,
        })),
        roles: JSON.parse(body.roles).map((role, index) => ({
          ...role,
          image: parseFiles(`roles[${index}]`)[0]?.image || null,
        })),
        weapons: JSON.parse(body.weapons).map((weapon, index) => ({
          ...weapon,
          image: parseFiles(`weapons[${index}]`)[0]?.image || null,
        })),
        materials: JSON.parse(body.materials).map((material, index) => ({
          ...material,
          image: parseFiles(`materials[${index}]`)[0]?.image || null,
        })),
      };
  
      const char = await Character.create(newChar);
      return response.status(201).send(char);
    } catch (error) {
      console.error(error.message);
      return response.status(500).send({ message: error.message });
    }
  });
//getall
app.get("/", async (req, res) => {
  try {
    // Find all characters from the database
    const characters = await Character.find();
    
    // If no characters are found, return a 404 response
    if (characters.length === 0) {
      return res.status(404).send({ message: "No characters found." });
    }

    // Send the characters data as a response
    res.status(200).send(characters);
  } catch (error) {
    console.error("Error during character retrieval:", error);
    res.status(500).send({ message: "Error retrieving characters." });
  }
});
//update
app.put("/update/:name", upload, async (req, res) => {
    const { name } = req.params; // Get the character name from the URL parameter
    const { body, files } = req; // Get the body and files from the request
  
    try {
      // Find the character by name
      const character = await Character.findOne({ name });
  
      // If no character is found, return a 404 response
      if (!character) {
        return res.status(404).send({ message: "Character not found." });
      }
  
      // Prepare update data
      const updateData = {};
  
      // Update the character name if provided
      if (body.name) {
        updateData.name = body.name;
      }
  
      // Update the mugshot if a new file is provided
      if (files) {
        // Check for mugshot
        const mugshotFile = files.find((file) => file.fieldname === "mugshot");
        if (mugshotFile) {
          updateData.mugshot = mugshotFile.path;
        }
  
        // Check for mainImage
        const mainImageFile = files.find((file) => file.fieldname === "mainImage");
        if (mainImageFile) {
          updateData.mainImage = mainImageFile.path;
        }
        //check for background
        const backgroundFile = files.find((file) => file.fieldname === "background");
        if (backgroundFile) {
          updateData.backgroundFile = backgroundFile.path;
        }
  
        // Handle updating artifacts
        if (body.artifacts) {
          const artifacts = JSON.parse(body.artifacts).map((artifact, index) => ({
            ...artifact,
            image: files.find(file => file.fieldname === `artifacts[${index}]`)?.path || artifact.image,
          }));
          updateData.artifacts = artifacts;
        }
  
        // Handle updating roles
        if (body.roles) {
          const roles = JSON.parse(body.roles).map((role, index) => ({
            ...role,
            image: files.find(file => file.fieldname === `roles[${index}]`)?.path || role.image,
          }));
          updateData.roles = roles;
        }
  
        // Handle updating weapons
        if (body.weapons) {
          const weapons = JSON.parse(body.weapons).map((weapon, index) => ({
            ...weapon,
            image: files.find(file => file.fieldname === `weapons[${index}]`)?.path || weapon.image,
          }));
          updateData.weapons = weapons;
        }
  
        // Handle updating materials
        if (body.materials) {
          const materials = JSON.parse(body.materials).map((material, index) => ({
            ...material,
            image: files.find(file => file.fieldname === `materials[${index}]`)?.path || material.image,
          }));
          updateData.materials = materials;
        }
      }
  
      // Handle removing artifacts, roles, or materials (if the field is empty)
      if (body.removeArtifacts) {
        updateData.artifacts = [];
      }
  
      if (body.removeRoles) {
        updateData.roles = [];
      }
  
      if (body.removeWeapons) {
        updateData.weapons = [];
      }
  
      if (body.removeMaterials) {
        updateData.materials = [];
      }
  
      // Perform the update operation
      const updatedChar = await Character.findOneAndUpdate({ name }, updateData, { new: true });
  
      // Send the updated character back in the response
      res.status(200).send(updatedChar);
    } catch (error) {
      console.error("Error during update:", error);
      res.status(500).send({ message: "Error updating character." });
    }
  });
  
// Connect to MongoDB and start the server
mongoose
  .connect(mongodburl)
  .then(() => {
    console.log("Connected to the database.");
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
