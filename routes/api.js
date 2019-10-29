'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var env = require('dotenv').config();
var mongoose = require('mongoose');
var db = mongoose.connection;

mongoose.set('useFindAndModify', false);
mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true, poolSize: 4, wtimeout: 2500 })

db.on('err', console.error.bind(console, 'connection error'))
db.once('openURI', function () {
  console.log("connected")
})

const issueSchema = new mongoose.Schema({
  project_name: String,
  issue_title: String,
  issue_text: String,
  created_by: String,
  created_on: Date,
  updated_on: { type: Date, default: null },
  assigned_to: { type: String, default: "" },
  status_text: { type: String, default: "open" },
  open: { type: Boolean, default: true, }
});

const issue = mongoose.model('issue', issueSchema)

module.exports = function (app) {

  app.route('/api/issues/:project')
    .get(async function (req, res) {
      var project = req.params.project;
      let updated = req.query;
      updated["project_name"] = project;

      let issueTracker = await issue.find(updated, (err, docs) => {
        if (err) {
          res.send(err)
        }
        else {
          res.json(docs)
        }
      })
    })

    .post(async function (req, res) {
      let project = req.params.project;
      let date = Date()
      if (req.body.issue_title == undefined || req.body.issue_text == undefined || req.body.created_by == undefined) {
        return res.send('missing inputs')
      }
      if (req.body.issue_title.trim() == "" || req.body.issue_text.trim() == "" || req.body.created_by.trim() == "") {
        return res.send("missing inputs")
      } else {
        let docIssue = new issue({
          'project_name': project,
          "assigned_to": req.body.assigned_to,
          "created_by": req.body.created_by,
          "created_on": date,
          "issue_text": req.body.issue_text,
          "issue_title": req.body.issue_title,
          "status_text": req.body.status_text,
          "open": true
        });

        await docIssue.save((err, docs) => {
          if (err) {
            res.json({ "msg": err })
          }
          res.send(docs)
        });
      }
    })

    .put(async function (req, res) {
      var project = req.params.project;
      let date = Date();
      let val = "";

      for (let i in req.body) {
        if (i != "_id") {
          val += req.body[i]
        }
      }
      if (val.trim() == "") {
        return res.send('no updated field sent')
      }

      if (req.body._id == undefined || req.body._id.trim() == "") {
        return res.send("Please enter Id")
      } else {

        let query = { _id: mongoose.Types.ObjectId(req.body._id) };
        let options = { new: true };
        let updated = {};
        let i;
        for (i in req.body) {
          if (req.body[i].trim() != "") {
            updated[i] = req.body[i]
          }
        }

        let issueUpdate = await issue.findByIdAndUpdate(query,
          { "$set": updated, "updated_on": date }, options, (err, docs) => {
            if (err) {
              res.send("could not update" + req.body._id)
            } else {
              if (docs != null) {
                res.send("successfully updated")
              }
            }
          })
      }
    })

    .delete(async function (req, res) {
      var project = req.params.project;
      if (req.body._id == undefined || req.body._id.trim() == "") {
        return res.send("id error")
      } else {
        let id = mongoose.Types.ObjectId(req.body._id);
        let issueDelete = await issue.findByIdAndDelete(id, (err) => {
          if (err) {
            res.send(err)
          } else {
            res.send("deleted " + req.body._id)
          }
        })
      }
    });

};
