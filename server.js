const express = require('express');
const connectDB = require('./config/db');
const app = express();

// Connection database
connectDB();

// Init Middleware
app.use(express.json({ extended: false}))

app.get('/', (req, res) =>{
    res.send("Hello domestic india")
});

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/pans', require('./routes/api/pans'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>
    console.log(`server run this port: ${PORT}`)
)