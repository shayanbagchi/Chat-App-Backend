const Chatkit = require('@pusher/chatkit-server');
const { instanceLocator, key } = require('./config');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex')
const saltRounds = 10;
const db = knex({
  client: 'pg',
  connection: {
   connectionString: process.env.DATABASE_URL,
   ssl: true
  }
});

const chatkit = new Chatkit.default({
  instanceLocator,
  key
})

const handleRegister = (req, res,) => {
	const {email,name,password} = req.body;
	if (!email || !name || !password) {
		return res.status(400).json('incorrect form submission');
	}

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
}

module.exports = {
	handleRegister:handleRegister
};