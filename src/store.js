import Vue from 'vue'
import Vuex from 'vuex'
import VueWait from 'vue-wait'

import { db, storage } from './main'

Vue.use(Vuex)
Vue.use(VueWait)

export default new Vuex.Store({
  state: {
    banners: [],
    movies: [],
    movie: {
      found: false
    },
    showtimes: [],
    locations: [],
    search: {
      movie: '',
      location: ''
    },
    seatBooked: ['A1', 'A2'],
    seatSelected: []
  },
  mutations: {
    GET_BANNER (state, payload) {
      state.banners = payload
    },
    SET_SEARCH_MOVIE (state, payload) {
      state.search.movie = payload
    },
    SET_SEARCH_LOCATION (state, payload) {
      state.search.location = payload
    },
    SET_SEARCH_MOVIE_TITLE (state, payload) {
      state.search.movieTitle = payload
    },
    SET_SEARCH_LOCATION_TITLE (state, payload) {
      state.search.locationTitle = payload
    },
    GET_MOVIES (state, payload) {
      state.movies = payload
    },
    GET_SHOWTIMES (state, payload) {
      state.showtimes = payload
    },
    GET_LOCATIONS (state, payload) {
      state.locations = payload
    },
    GET_MOVIE (state, payload) {
      state.movie = payload
    },
    SET_SEAT_SELECTED (state, payload) {
      state.seatSelected = payload
    }
  },
  actions: {
    // Get all banner
    async getBanners ({ commit, dispatch }) {
      dispatch('wait/start', 'banner.getItems')

      let banners = []
      let querySnapshot = await db.collection('banners').get()

      querySnapshot.forEach(async doc => {
        let url = await storage
          .ref('banner/' + doc.data().filename)
          .getDownloadURL()
        banners.push({ id: doc.id, url })
      })

      commit('GET_BANNER', banners)
      dispatch('wait/end', 'banner.getItems')
    },

    // Get all locations
    async getLocations ({ commit, dispatch }) {
      dispatch('wait/start', 'locations.getItems')

      let movies = []
      let querySnapshot = await db.collection('theatres').get()

      querySnapshot.forEach(async doc => {
        movies.push({ id: doc.id, ...doc.data() })
      })

      commit('GET_LOCATIONS', movies)
      dispatch('wait/end', 'locations.getItems')
    },

    // Get all movies
    async getMovies ({ commit, dispatch }) {
      dispatch('wait/start', 'movie.getItems')

      let movies = []
      let querySnapshot = await db.collection('movies').get()

      querySnapshot.forEach(async doc => {
        movies.push({ id: doc.id, ...doc.data() })
      })

      commit('GET_MOVIES', movies)
      dispatch('wait/end', 'movie.getItems')
    },

    // Get movie by id
    async getMovie ({ commit, dispatch }, id) {
      dispatch('wait/start', 'movie.getItems')

      let querySnapshot = await db
        .collection('movies')
        .doc(id)
        .get()

      let movie = { found: querySnapshot.exists, data: querySnapshot.data() }

      commit('GET_MOVIE', movie)
      dispatch('wait/end', 'movie.getItems')
    },

    // Get showtime by theatre
    async getShowtimes ({ commit, dispatch }, id) {
      dispatch('wait/start', 'movie.getShowtimes')

      let showtimes = []
      let querySnapshot = await db
        .collection('theatres')
        .doc(id)
        .collection('showtimes')
        .get()

      await querySnapshot.forEach(async doc => {
        let movie = await db
          .collection('movies')
          .doc(doc.data().movie)
          .get()

        showtimes.push({
          id: doc.id,
          movie: { ...movie.data(), id: movie.id },
          time: doc.data().time
        })
      })

      commit('GET_SHOWTIMES', showtimes)
      dispatch('wait/end', 'movie.getShowtimes')
    },
    // Seatmap

    // Add Select
    doAddSeatSelect ({ state, commit }, id) {
      let seat = state.seatSelected
      if (!seat.includes(id)) {
        seat.push(id)
      }
      commit('SET_SEAT_SELECTED', seat)
    },

    // Remove Select
    doRemoveSeatSelect ({ state, commit }, id) {
      let seat = state.seatSelected

      seat = seat.filter(s => s !== id)

      commit('SET_SEAT_SELECTED', seat)
    }
  }
})
