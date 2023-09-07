const User = require('../models/user')

const initialBlogs = [
  {
    title: 'HTML is easy',
    author: 'HTML',
    url: 'hdjkdfd',
    likes: 6,
  },
  {
    title: 'Browser can execute only JavaScript',
    author: 'Browser',
    url: 'kkjjh',
    likes: 3,
  },
]

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs,
  usersInDb,
}