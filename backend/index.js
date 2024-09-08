// Library Import
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
require('dotenv').config();

// Database Connection
const connectDB = require('./config/db');

// Routes
const router = require('./routes');

// App
const app = express();
app.use(cors({
    origin : process.env.FRONTEND_URL,
    credentials : true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Router
app.use("/api",router);

// Port
const PORT = 8080 || process.env.PORT;

// Server
connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log(`Server is running on http://localhost:${PORT}`);
    })
});