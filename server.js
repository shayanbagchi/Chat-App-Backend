const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');

const app = express();

// middlewares
app.use(bodyParser.json());
app.use(cors());
// middlewares

app.get('/', (req,res) => { res.status(200).send("Success!") })
app.post('/signin', (req,res) => {signin.handleSignin(req, res)} )
app.post('/register', (req,res) => {register.handleRegister(req, res)} )
app.get('/profile/:username', (req,res) => {profile.handleProfileGet(req, res)} )


app.listen(process.env.PORT || 3000, () => {
	console.log(`server is running on port ${process.env.PORT}`);
})