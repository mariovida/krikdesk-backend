require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
var https = require("follow-redirects").https;

const authRoutes = require("./src/routes/authRoutes");

const corsOptions = require("./src/config/cors");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", authRoutes);

app.get("/api/status", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_API_URL = "https://api.notion.com/v1/pages";

// Endpoint to create a Notion task
app.post("/create-task", async (req, res) => {
  const { title, description } = req.body;

  try {
    const response = await axios.post(
      NOTION_API_URL,
      {
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: {
            title: [{ text: { content: title } }],
          },
          Status: {
            status: { name: "Not Started" },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
      }
    );

    res
      .status(200)
      .json({ message: "Task created in Notion!", data: response.data });
  } catch (error) {
    console.error(
      "Error creating task:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to create task",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/", (req, res) => {
  //res.send("Server is running");
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
