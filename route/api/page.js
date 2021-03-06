/**
 * Created by bangbang93 on 2017/9/3.
 */
'use strict';
const router = require('express-promise-router')()
const PageService = require('../../service/page')

router.get('/:id(\\w{24})', async function (req, res) {
  const id = req.params.id;

  let page = await PageService.getById(id)
  if (!page) {
    page = await PageService.getByName(id)
  }

  if (!page) {
    return res.sendStatus(404)
  }

  res.json(page)
})

router.get('/:name', async function (req, res) {
  const {name} = req.params

  const page = await PageService.getByName(name)

  if (!page) {
    return res.sendStatus(404)
  }

  res.json(page)
})

router.get('/', async function (req, res) {
  const {page} = req.query

  const list = await PageService.list(page, 20)

  res.json(list)
})

module.exports = router
