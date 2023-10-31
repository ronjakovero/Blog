const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const jwt = require('jsonwebtoken')


blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', async (request, response, next) => {
  console.log('Received data:', request.body)
  const { title, author, url, likes, userId } = request.body

  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  if (!title || !url){
    return response.status(400).json({ error: 'Title and url are required' })
  }

  const user = request.user

  const blog = new Blog({
    title,
    author,
    url,
    likes,
    userId,
    user: user._id,
  })

  try {
    const savedBlog = await blog.save()
    const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1 })

    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(populatedBlog)
  } catch(exception) {
    next(exception)
  }
})

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const blogId = request.params.id
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const blog = await Blog.findById(blogId)

    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    if (blog.user.toString() !== decodedToken.id) {
      return response.status(403).json({ error: 'Unauthorized to delete this blog' })
    }

    await Blog.findByIdAndDelete(blogId)

    response.status(204).end()
  } catch (exception) {
    next(exception)
  }
})

blogsRouter.put('/:id/like', async (request, response, next) => {
  try {
    const blogId = request.params.id
    const blog = await Blog.findById(blogId)

    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    blog.likes += 1
    const updatedBlog = await blog.save()

    response.json(updatedBlog)
  } catch (exception) {
    next(exception)
  }
})


blogsRouter.put('/:id', async (request, response, next) => {
  try {
    const blogId = request.params.id
    const { title, author, url, likes } = request.body

    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      { title, author, url, likes },
      { new: true }
    ).populate('user', { username: 1, name: 1 })

    if (!updatedBlog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    response.json(updatedBlog)
  } catch (exception) {
    next(exception)
  }
})


module.exports = blogsRouter