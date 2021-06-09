const Comic     = require('../models/Comic');
const Chapter   = require('../models/Chapter');
const User   = require('../models/User');
const { singleMongooseToObject, multiMongooseToObject } =  require('../../util/mongoose');

class SiteController {

    async fetchUsers(req, res, next) {
         User
        .find({}).lean()
        .select('banned role name _id')
        .then(users => res.send(users))
        .catch(next)
    }

    fetchComics(req, res, next) {
        Comic
        .find({}).lean()
        .select('-userId')
        .then(comic => res.send(comic))
        .catch(next)
    }

    fetchChapters(req, res, next) {
        Chapter
        .find({comicSlug: req.params.chapterSlug}).lean()
        .select('-image')
        .then(chapters => res.send(chapters))
        .catch(next)
    }
}

//export (SiteController) thì lát require nhận được nó
module.exports = new SiteController();
