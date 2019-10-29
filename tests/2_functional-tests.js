
var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  suite('POST /api/issues/{project} => object with issue data', function () {

    test('Every field filled in', function (done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - Every field filled in',
          assigned_to: 'Chai and Mocha',
          status_text: 'open'
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isNotEmpty(res.body, 'data does not exist')
          assert.property(res.body, 'assigned_to')
          assert.property(res.body, 'status_text')
          assert.property(res.body, 'created_by')
          assert.property(res.body, 'issue_text')
          assert.property(res.body, 'issue_title')
          assert.equal(res.body.issue_title, 'Title', 'should match Title')
          assert.equal(res.body.issue_text, 'text', 'should match text')
          assert.equal(res.body.assigned_to, 'Chai and Mocha', 'should match Chai and Mocha')
          assert.equal(res.body.status_text, 'open', 'should match open')
          assert.equal(res.body.created_by, 'Functional Test - Every field filled in', 'should match Functional Test - Every field filled in')

          done();
        });
    });

    test('Required fields filled in', function (done) {
        chai.request(server)
            .post('/api/issues/test')
            .send({
            issue_title: 'Title',
            issue_text: 'text',
            created_by: 'Functional Test - Required field',
            assigned_to: '',
            status_text: 'open'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isNotEmpty(res.body, 'data does not exist')
            assert.property(res.body, 'created_by')
            assert.property(res.body, 'issue_text')
            assert.property(res.body, 'issue_title')
            assert.equal(res.body.issue_title, 'Title', 'should match Title')
            assert.equal(res.body.issue_text, 'text', 'should match text')
            assert.equal(res.body.created_by, 'Functional Test - Required field', 'should match Functional Test - Required field filled in')

            done();
          })
        });

    test('Missing required fields', function (done) {
      chai.request(server)
          .post('/api/issues/test')
          .send({
            issue_title: '   ',
            issue_text: '  ',
            created_by: '   '
          })
          .end((err, res) => {
            assert.equal(res.text, 'missing inputs')
            done();
       })
    });

  });

  suite('PUT /api/issues/{project} => text', function () {

    test('No body', function (done) {
        chai.request(server)
            .put('/api/issues/test')
            .send({})
            .end((err,res) => {
               assert.isEmpty(res.body, 'missing inputs')
               done();
            })
    });

    test('One field to update', function (done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - One field update',
          open: false
        })
        .end((err, res) => {
          let id = res.body._id;
          chai.request(server)
              .put('/api/issues/test')
              .send({
                _id: id,
                open: "false"
                //mongoose.Types.ObjectId(req.body._id) 
              })
              .end((err,res) => {
                  assert.equal(res.text, 'successfully updated')
                  done();
              })
        })
    });

    test('Multiple fields to update', function (done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - One field update',
          open: false
        })
        .end((err, res) => {
          let id = res.body._id;
          chai.request(server)
            .put('/api/issues/test')
            .send({
              _id: id,
              open: "false",
              issue_text: 'text2'
            })
            .end((err, res) => {
              assert.equal(res.text, 'successfully updated')
              done();
            })
        })
    });

  });

  suite('GET /api/issues/{project} => Array of objects with issue data', function () {

    test('No filter', function (done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({})
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'issue_title');
          assert.property(res.body[0], 'issue_text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'updated_on');
          assert.property(res.body[0], 'created_by');
          assert.property(res.body[0], 'assigned_to');
          assert.property(res.body[0], 'open');
          assert.property(res.body[0], 'status_text');
          assert.property(res.body[0], '_id');
          done();
        });
    });

    test('One filter', function (done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({
          open: false
        })
        .end((err, res) => {
          assert.property(res.body[0], 'open')
          assert.equal(res.body[0].open, false)
          done();
        })
    });

    test('Multiple filters (test for multiple fields you know will be in the db for a return)', function (done) {
      chai.request(server)
        .get('/api/issues/test')
        .query({
          open: false,
          issue_text: 'text2'
        })
        .end((err, res) => {
          assert.property(res.body[0], 'open')
          assert.equal(res.body[0].open, false)
          assert.equal(res.body[0].issue_text, 'text2')
          done();
        })
    });

  });

  suite('DELETE /api/issues/{project} => text', function () {

    test('No _id', function (done) {
      chai.request(server)
          .delete('/api/issues/test')
          .send({
            _id: "              "
          })
          .end((err, res) => {
            assert.equal(res.text, 'id error')
            done();
          })
     
    });

    test('Valid _id', function (done) {
      chai.request(server)
        .post('/api/issues/test')
        .send({
          issue_title: 'Title',
          issue_text: 'text',
          created_by: 'Functional Test - One field update',
          open: false
        })
        .end((err, res) => {
          let id = res.body._id;
          chai.request(server)
            .delete('/api/issues/test')
            .send({
              _id: id,
            })
            .end((err, res) => {
              assert.equal(res.text, 'deleted ' + id)
              done();
            })
        })
    });

  });

});