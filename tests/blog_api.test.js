const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')


beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')
  const titles = response.body.map(r => r.title)
  expect(titles).toContain(
    'Browser can execute only JavaScript'
  )
}, 100000)

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('a valid blog can be added', async () => {

  const newBlog = {
    title: 'async/await simplifies making async calls',
    author: 'me',
    url: 'kkjhg',
    likes: 1,
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  expect(response.body).toHaveLength(helper.initialBlogs.length + 1)
  expect(titles).toContain(
    'async/await simplifies making async calls'
  )
})

test('missing likes property defaults to 0', async () => {

  const newBlog = {
    title: 'Blog without likes',
    author: 'me',
    url: 'jeejeejaa',
    // likes is missing
  }

  await api.post('/api/blogs').send(newBlog).expect(201).expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')

  const blogWithoutLikes = response.body.find((blog) => blog.title === 'Blog without likes property')

  expect(blogWithoutLikes.likes).toBe(0)
})

test('blog without title or url is not added', async () => {

  const blogWithoutTitle = {
    author: 'badAuthor',
    url: 'hahhsdjdj',
    likes: 5,
  }

  const blogWithouturl = {
    title: 'Blog without url',
    author: 'badAuthor',
    likes: 2,
  }

  await api.post('/api/blogs').send(blogWithoutTitle).expect(400)

  await api.post('/api/blogs').send(blogWithouturl).expect(400)

  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('blogs have unique identifier property "id"', async () => {
  const response = await api.get('/api/blogs')
  expect(response.body).toHaveLength(helper.initialBlogs.length)


  response.body.forEach((blog) => {
    expect(blog.id).toBeDefined()
  })
})

test('deletion of a blog', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToDelete = blogsAtStart.body[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAtEnd = await api.get('/api/blogs')

  expect(blogsAtEnd.body).toHaveLength(
    helper.initialBlogs.length - 1
  )

  const titles = blogsAtEnd.body.map((r) => r.title)
  expect(titles).not.toContain(blogToDelete.title)
})

test('update a single blog post', async () => {
  const blogsAtStart = await api.get('/api/blogs')
  const blogToUpdate = blogsAtStart.body[0]

  const updatedBlog = {
    ...blogToUpdate,
    likes: blogToUpdate.likes + 1,
  }

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)

  const blogsAtEnd = await api
    .get('/api/blogs')
  const updatedBlogInResponse = blogsAtEnd.body.find((blog) => blog.id === blogToUpdate.id)
  expect(updatedBlogInResponse.likes).toBe(blogToUpdate.likes + 1)
})




describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'hei', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username is too short', async () => {
    const newUser = {
      username: 'ab',
      name: 'Test User',
      password: 'passwooord',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Both username and password must be at least 3 characters long')
  })

  test('creation fails with proper statuscode and message if password is too short', async () => {
    const newUser = {
      username: 'newuser',
      name: 'TestuuUser',
      password: '12',
    }
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Both username and password must be at least 3 characters long')
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'hei',
      name: 'Moi',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})


afterAll(async () => {
  await mongoose.connection.close()
})