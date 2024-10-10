const express = require('express');
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("./config/passport");
require('dotenv').config();

const app = express();

// MongoDB Connection
const mongoDB = process.env.MONGO_URI;
(async () => {
    try {
        await mongoose.connect(mongoDB);
        console.log('Successfully connected to TaskPro MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
})();

// Import Routes
const authRouter = require("./routes/authRouter");
const boardsRouter = require("./routes/boardsRoute");
const columnsRouter = require("./routes/columnsRouter");
const cardsRouter = require("./routes/cardsRoute");
const swaggerRouter = require("./routes/swaggerRouter");

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(passport.initialize()); 

// Routes
app.use("/auth", authRouter);
app.use("/auth/boards", boardsRouter);
app.use("/auth/boards/columns", columnsRouter);
app.use("/auth/boards/columns/cards", cardsRouter);
app.use("/swagger", swaggerRouter);

app.get("/", async (req, res) => {
    res.json({ status: 200 });
});

// Error Handling
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        status: "error",
        code: err.status || 500,
        message: err.message,
        data: err.data || "Internal Server Error",
    });
    next(err);
});

// Port Number
const PORT = process.env.PORT || 2000; // Default to 2000 if PORT is not set
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});