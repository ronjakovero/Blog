const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((total, blog) => total + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) return null

  const favorite = blogs.reduce((favorite, blog) => (blog.likes > favorite.likes ? blog : favorite))
  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes,
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}