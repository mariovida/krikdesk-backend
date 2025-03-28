require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
var https = require("follow-redirects").https;

const authRoutes = require("./src/routes/authRoutes");
const usersRoutes = require("./src/routes/usersRoutes");

const corsOptions = require("./src/config/cors");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", usersRoutes);

app.get("/api/status", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const NOTION_PROJECTS_DATABASE_ID = process.env.NOTION_PROJECTS_DATABASE_ID;
const NOTION_API_URL = "https://api.notion.com/v1/pages";
const NOTION_API_USERS = "https://api.notion.com/v1/users";
const NOTION_API_PROJECTS = `https://api.notion.com/v1/databases/${NOTION_PROJECTS_DATABASE_ID}/query`;

app.get("/get-users", async (req, res) => {
  try {
    const response = await axios.get(NOTION_API_USERS, {
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
      },
    });

    const users = response.data.results.map((user) => ({
      id: user.id,
      name: user.name,
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error(
      "Error fetching users:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.response?.data || error.message,
    });
  }
});

app.get("/get-projects", async (req, res) => {
  try {
    const response = await axios.post(
      NOTION_API_PROJECTS,
      {},
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
      }
    );

    const projects = response.data.results.map((project) => ({
      id: project.id,
      name: project.properties.Name?.title[0]?.plain_text || "Untitled",
    }));

    res.status(200).json(projects);
  } catch (error) {
    console.error(
      "Error fetching projects from Notion:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: "Failed to fetch projects",
      error: error.response?.data || error.message,
    });
  }
});

// Endpoint to create a Notion task
app.post("/create-task", async (req, res) => {
  const { title, description, assignee, priority, selectedProject } = req.body;

  try {
    const response = await axios.post(
      NOTION_API_URL,
      {
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          Name: {
            title: [{ text: { content: title } }],
          },
          Assignee: assignee ? { people: [{ id: assignee }] } : undefined,
          Priority: priority ? { select: { name: priority } } : undefined,
          Status: {
            status: { name: "Not Started" },
          },
          Project: selectedProject
          ? { relation: [{ id: selectedProject }] }
          : undefined,
        },
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ text: { content: description } }],
            },
          },
        ],
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
