const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (request, response) => {
  Blog
    .find({})
    .then(blogs => {
      response.json(blogs)
    })
})

blogsRouter.post('/', (request, response) => {
  console.log('Received data:', request.body)
  const blogData = request.body // Get the JSON data from the request body

  // Create a new Blog instance using the data from the request body
  const blog = new Blog({
    title: blogData.title,
    author: blogData.author,
    url: blogData.url,
    likes: blogData.likes
  })

  blog
    .save()
    .then(result => {
      response.status(201).json(result)
    })
})

module.exports = blogsRouter