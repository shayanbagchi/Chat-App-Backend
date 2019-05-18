
const handleProfileGet = (req,res) => {
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
}

module.exports = {
	handleProfileGet: handleProfileGet
};