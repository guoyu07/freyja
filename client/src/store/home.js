/**
 * Created by bangbang93 on 2017/9/6.
 */
'use strict';
import {Fetch} from './index'

export default {
  namespaced: true,
  state: () => ({
    articles: [{
      title: '',
      summary: '',
      tags: [],
      author: {
        username: '',
      },
      createdAt: '',
      commentCount: 0,
    }],
    categories: [],
  }),
  getters: {
    articleCount(state) {
      return state.articles.length
    },
  },
  mutations: {
    setArticles(state, list) {
      state.articles.splice(0, state.articles.length)
      list.forEach((article) => {
        state.articles.push(article)
      })
    },
    addPage(state, page) {
      state.page += page;
    },
    setCategories(state, categories) {
      state.categories.splice(0, state.categories.length)
      categories.forEach((e) => {
        state.categories.push(e)
      })
    }
  },
  actions: {
    async getArticles({commit, rootState}, {page, tag, category}) {
      let resp
      if (tag) {
        resp = await Fetch.get(`${rootState.origin}/api/tag/${tag}`, {page})
      } else if (category) {
        resp = await Fetch.get(`${rootState.origin}/api/category/${category}`, {page})
      } else {
        resp = await Fetch.get(`${rootState.origin}/api/article`, {page})
      }
      if (resp.status !== 200) {
        throw new Error('fetch article list failed')
      }

      const list = await resp.json()
      commit('setArticles', list)
      return list
    },
    async getCategories({commit}) {
      let resp = await Fetch.get('/api/category/tree')
      const categories = await resp.json()
      commit('setCategories', categories)
    }
  }
}
