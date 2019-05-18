const Chatkit = require('@pusher/chatkit-server');
const { instanceLocator, key } = require('./config');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex')
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

const handleSignin = (req, res) => {
	const {email, password} = req.body;
	if (!email || !password) {
		return res.status(400).json('incorrect form submission');
	}
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
}

module.exports = {
	handleSignin: handleSignin
};