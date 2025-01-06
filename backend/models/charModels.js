import mongoose from "mongoose";

// Define the character schema
const CharacterSchema = mongoose.Schema({
  name: { type: String, required: true,  unique: true  },
  mugshot: { type: String, required: true },
  mainImage: { type: String, required: true },
  background: { type: String, required: true },
  artifacts: [
    {
      name: { type: String, required: true },
      type: { type: String, required: true },
      image: String,
      effect: String,
    },
  ],
  roles: [
    {
      name: { type: String, required: true },
      image: String,
    },
  ],
  weapons: [
    {
      name: { type: String, required: true },
      image: String,
    },
  ],
  materials: [
    {
      name: { type: String, required: true },
      image: String,
      quantity: { type: Number, required: true },
    },
  ],
});

// Export the model
export const Character = mongoose.model("Character", CharacterSchema);
