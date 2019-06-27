const mongoose = require("mongoose");
const express = require("express");
const axios = require("axios");
var cheerio = require("cheerio");
const db = require("../models/index");
const path = require("path");
const router = express.Router()
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true })

router.get("/", function(req, res){
    res.redirect("/articles")
});

router.get("/scrape", function(req, res){
    res.redirect("/articles");
    axios.get("https://www.theverge.com/").then(function(response){
        var $ = cheerio.load(response.data);
        var titleArray = [];

        $(".c-entry-box--compact__title").each(function(i, element){
            var result = {};

            result.title = $(this)
            .children("a")
            .text();
            result.link = $(this)
            .children("a")
            .attr("href");

            console.log(result.title);
            console.log(result.link);
            
            if(result.title !== "" && result.link !== "") {

                titleArray.push(result.title);

                db.Article.count({title: result.title}, function(err, test){

                    if (err) {
                        console.log(err);
                    }

                    if (test === 0 ) {
                        var entry = new db.Article(result);
                        entry.save(function(err, doc){
                            if (err){
                                console.log(err);
                            } else {
                                console.log(doc);
                            }
                        });
                    }
                });

            } else {
                console.log("Not saved to DB, missing data")
            }
        });
        res.redirect("/");
    })
    .catch(function(err){
        if (err) {
            console.log(err);
        }
    })
})

router.get("/articles", function(req, res) {

    db.Article.find().sort({_id: -1}).exec(function(err, data){
        if(err) {
            console.log(err);
        } else {
            res.render("index", { article: data })
        }
    });
    
});

router.get("/api/articles", function(req, res) {
    db.Article.find({}, function(err, doc) {
        if (err) {
            console.log(err)
        } else {
            res.json(doc);
        }
    });
});


router.get("/clearAll", function(req, res) {
    db.Article.remove({}, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("Removed all articles");
        }
    });
    res.redirect("/api/articles");
});

router.get("/readArticle/:id", function(req, res) {
    var articleId = req.params.id;
    var hbsObj = {
        article: [],
        body: [],
    };

    db.Article.findOne({ _id: articleId })
    .populate("comment")
    .exec(function(err, doc) {
        if (err) {
            console.log(err);
        } else {

            hbsObj.article = doc;
            var link = doc.link;

            axios.get(link).then(function(response) {
                var $ = cheerio.load(response.data);
                $(".l-col__main").each(function(i, element){
                    hbsObj.body = $(this)
                    .children(".c-entry-content")
                    .children("p")
                    .text();

                    res.render("article", hbsObj);
                    return false;
                });
            });
        }
    });
});


router.post("/comment/:id", function(req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleId = req.params.id;

    var commentObj = {
        name: user,
        body: content
    };

    var newComment = new db.Comment(commentObj);

    newComment.save(function(err, doc){
        if (err) {
            console.log(err);
        } else {
            console.log(doc._id);
            console.log(articleId);

            db.Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { comment: doc._id } },
                { new: true }
            ) 
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/readArticle/" + articleId);
                }
            });
        }
    });
    
});


module.exports = router;