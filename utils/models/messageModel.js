const mongoose = require("mongoose");

const schema = mongoose.Schema;

const messageSchema = new schema(
  {
    text: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, default: "AdminBot" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Messages", messageSchema);
