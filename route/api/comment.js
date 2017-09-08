/**
 * Created by bangbang93 on 2017/9/7.
 */
'use strict';
const router = require('express-promise-router')()
const CommentService = require('../../service/comment')

router.get('/article/:id(\\w{24})', async function (req, res) {
  const {page = 1} = req.query
  const {id: articleId} = req.params

  const list = await CommentService.listByArticle(articleId, page)

  res.json(list)
})

router.post('/article/:id(\\w{24})', async function (req, res) {
  const {content, publisher, reply} = req.body
  const articleId = req.params.id
  if (!content || !publisher.email || !publisher.name) {
    return res.status(400).json({
      msg: 'missing params'
    })
  }

  const comment = await CommentService.create({
    content,
    publisher,
  }, {article: articleId, reply})

  res.json(comment)
})

module.exports = router