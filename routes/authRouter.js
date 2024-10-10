const express = require("express");
const router = express.Router();
const User = require("../models/users");
const auth = require("../middlewares/auth");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper function to generate tokens
const generateTokens = (user) => {
    const payload = {
        id: user.id,
        name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

    return { token, refreshToken };
};

// Register a new user
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const user = await User.findOne({ email });

    if (user) {
        return res.status(409).json({
            status: "error",
            code: 409,
            message: "Email already in use",
            data: "Conflict",
        });
    }
    try {
        const newUser = new User({ name, email });
        await newUser.setPassword(password);
        await newUser.save();

        const { token, refreshToken } = generateTokens(newUser);
        newUser.refreshToken = refreshToken;
        await newUser.save();

        res.status(201).json({
            status: "success",
            code: 201,
            data: {
                message: "Registration successful",
                token,
                refreshToken,
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                },
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            status: "error",
            code: 500,
            message: "Internal Server Error",
            data: error.message,
        });
    }
});

// Login a user
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isValidPassword(password))) {
        return res.status(400).json({
            status: "error",
            code: 400,
            message: "Incorrect email or password",
            data: "Bad Request",
        });
    }

    try {
        const { token, refreshToken } = generateTokens(user);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            status: "success",
            code: 200,
            data: {
                token,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
        });
    } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({
            status: "error",
            code: 500,
            message: "Internal Server Error",
            data: error.message,
        });
    }
});

// Logout a user
router.get("/logout", auth, async (req, res) => {
    try {
        const user = req.user;
        user.refreshToken = null;
        await user.save();

        res.status(200).json({
            status: "success",
            code: 200,
            message: "Successfully logged out",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            status: "error",
            code: 500,
            message: "Internal Server Error",
            data: error.message,
        });
    }
});

// Refresh token
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(payload.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token: newAccessToken });
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
});

router.get('/user', auth, async (req, res) => {
    res.json(req.user); 
});

module.exports = router;
