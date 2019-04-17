const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');
const Chatkit = require('@pusher/chatkit-server');
const { instanceLocator, key } = require('./config');

const saltRounds = 10;

const db = knex({
  client: 'pg',
  connection: {
    host : 'chat-app.cvgmglwxgf4w.ap-south-1.rds.amazonaws.com',
    user : 'ShayanB',
    password : 'Shayandude9',
    database : 'ChatAppDatabase'
  }
});

const app = express();

// middlewares

app.use(bodyParser.json());
app.use(cors());

// middlewares


const chatkit = new Chatkit.default({
  instanceLocator,
  key
})

app.get('/', (req,res) => {
	res.send(db.users);
})

app.post('/signin', (req,res) => {
	db.select('email','hash').from('login')
	.where('email','=', req.body.email)
	.then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if(isValid){
			return db.select('*').from('users')
				.where('email','=', req.body.email)
				.then(user => {
					res.status(200).json(user[0]);
					chatkit.getUser({
					  id: user[0].username,
					})
					.catch(err => console.error(err))
				})
				.catch(err => res.status(400).json('unable to get user'))
		} else {
			res.status(400).json('wrong username or password')
		}
	})
	.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req,res) => {
	const { email,password,firstname,lastname,username } = req.body;

	const hash = bcrypt.hashSync(password, saltRounds);
	db.transaction(trx => {
		trx.insert({
			email: email,
			username: username,
			hash: hash
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email:loginEmail[0],
					username:username,
					firstname:firstname,
					lastname:lastname,
					joined: new Date()
				})
			.then(user => {
				res.json(user[0]);
				chatkit.createUser({
					  id: user[0].username,
					  name: user[0].firstname + " " + user[0].lastname
					})
					  .catch(error => {
					      if (error.error_type === 'services/chatkit/user_already_exists') {
					        res.sendStatus(200)
					      } else {
					        res.status(error.status).json(error)
					      }
					})
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.status(400).json("Unable to register"))
})

app.get('/profile/:username', (req,res) => {
	const { username } = req.params;
	db.select('*').from('users').where({
			username: username
	}).then(user => {
		if(user.length) {
			res.status(200).json(user[0])
		} else {
			res.status(404).json('not found')
		}
	}).catch(err => res.status(404).json('error getting user'))
});

app.post('/auth', (req, res) => {
  const authData = chatkit.authenticate({
    userId: 'shayandude'
  });

  res.status(authData.status)
     .send(authData.body);
})

app.listen( 3000, () => {
	console.log('server is running on port 3000');
})